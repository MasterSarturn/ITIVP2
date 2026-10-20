const crypto = require('crypto');
const path = require('path');
const { Op } = require('sequelize');
const { sequelize, Sequelize, Product, ProductFile } = require('../models');
const productService = require('./productService');
const storageService = require('./storageService');
const { purchasedSince } = require('./accessService');
const createHttpError = require('../utils/httpError');

// MIME определяется сервером по расширению, заявленному клиентом типу не доверяем
const MIME_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.epub': 'application/epub+zip',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.exe': 'application/vnd.microsoft.portable-executable',
  '.msi': 'application/x-msi',
  '.dmg': 'application/x-apple-diskimage'
};

const VERSION_PATTERN = /^[A-Za-z0-9._-]{1,50}$/;

const publicAttributes = ['id', 'productId', 'fileName', 'fileSize', 'mimeType', 'version', 'createdAt'];

// multer отдаёт имя как latin1, а браузеры шлют UTF-8
function decodeFileName(originalName) {
  const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
  return decoded.includes('�') ? originalName : decoded;
}

function sanitizeFileName(originalName) {
  const base = path.basename(decodeFileName(originalName).replace(/\\/g, '/'));
  const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim().slice(0, 200);

  if (!cleaned || cleaned === '.' || cleaned === '..') {
    throw createHttpError(400, 'Некорректное имя файла');
  }

  return cleaned;
}

function describeUpload(file, rawVersion) {
  const fileName = sanitizeFileName(file.originalname);
  const mimeType = MIME_BY_EXTENSION[path.extname(fileName).toLowerCase()];

  if (!mimeType) {
    throw createHttpError(415, `Тип файла не поддерживается. Допустимые расширения: ${Object.keys(MIME_BY_EXTENSION).join(', ')}`);
  }

  if (rawVersion !== undefined && !VERSION_PATTERN.test(rawVersion)) {
    throw createHttpError(400, 'version может содержать латиницу, цифры, точку, дефис и подчёркивание (до 50 символов)');
  }

  return {
    fileName,
    mimeType,
    fileSize: file.size,
    version: rawVersion ?? null,
    storageKey: (productId) => `products/${productId}/${rawVersion ?? crypto.randomUUID()}/${fileName}`
  };
}

function toPublicFile(file) {
  return Object.fromEntries(publicAttributes.map((key) => [key, file[key]]));
}

// Продавец и Admin видят активные файлы. Покупателю дополнительно доступны файлы, удалённые уже после его заказа
async function listFiles(user, productId) {
  const product = await Product.findByPk(productId);

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  const isManager = user.role === 'admin' || user.id === product.sellerId;
  let where = { productId, deletedAt: null };

  if (!isManager) {
    const since = await purchasedSince(user.id, productId);

    if (!since) {
      throw await productService.isPubliclyVisible(product)
        ? createHttpError(403, 'Файлы доступны только после покупки')
        : createHttpError(404, 'Товар не найден');
    }

    where = { productId, [Op.or]: [{ deletedAt: null }, { deletedAt: { [Op.gt]: since } }] };
  }

  const files = await ProductFile.findAll({ where, order: [['createdAt', 'ASC'], ['id', 'ASC']] });
  return files.map(toPublicFile);
}

async function findActiveFile(productId, fileId, transaction) {
  const file = await ProductFile.findOne({ where: { id: fileId, productId, deletedAt: null }, transaction });

  if (!file) {
    throw createHttpError(404, 'Файл не найден');
  }

  return file;
}

async function assertUploadAllowed(product) {
  if (product.status === 'archived') {
    throw createHttpError(409, 'Нельзя загружать файлы в архивный товар');
  }
}

// Файл пишется в хранилище до записи в БД; если БД отказала, файл убирается
async function persistUpload(file, upload, productId, writeRecords) {
  const storageKey = upload.storageKey(productId);

  await storageService.save(storageKey, file.buffer);

  try {
    return await sequelize.transaction((transaction) => writeRecords(storageKey, transaction));
  } catch (error) {
    await storageService.remove(storageKey);

    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Файл с таким ключом хранилища уже существует');
    }

    throw error;
  }
}

async function uploadFile(user, productId, file, body) {
  const product = await productService.findManageableProduct(productId, user);
  await assertUploadAllowed(product);

  const upload = describeUpload(file, body?.version);
  const created = await persistUpload(file, upload, product.id, (storageKey, transaction) =>
    ProductFile.create({
      productId: product.id,
      fileName: upload.fileName,
      storageKey,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      version: upload.version
    }, { transaction }));

  return toPublicFile(created);
}

// Замена — новая версия: старая запись остаётся, на неё ссылаются Download
async function replaceFile(user, productId, fileId, file, body) {
  const product = await productService.findManageableProduct(productId, user);
  await assertUploadAllowed(product);

  const upload = describeUpload(file, body?.version);

  const created = await persistUpload(file, upload, product.id, async (storageKey, transaction) => {
    const previous = await findActiveFile(product.id, fileId, transaction);
    const replacement = await ProductFile.create({
      productId: product.id,
      fileName: upload.fileName,
      storageKey,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      version: upload.version
    }, { transaction });

    await previous.update({ deletedAt: new Date() }, { transaction });
    return replacement;
  });

  return toPublicFile(created);
}

async function deleteFile(user, productId, fileId) {
  const product = await productService.findManageableProduct(productId, user);

  await sequelize.transaction(async (transaction) => {
    const file = await findActiveFile(product.id, fileId, transaction);

    if (product.status === 'published' && await productService.countActiveFiles(product.id, transaction) === 1) {
      throw createHttpError(409, 'Это последний файл опубликованного товара: сначала снимите товар с публикации');
    }

    await file.update({ deletedAt: new Date() }, { transaction });
  });
}

module.exports = { listFiles, uploadFile, replaceFile, deleteFile };
