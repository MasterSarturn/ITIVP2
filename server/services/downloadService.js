const { Op } = require('sequelize');
const { Download, OrderItem, Order, ProductFile } = require('../models');
const storageService = require('./storageService');
const { paginate } = require('../utils/pagination');
const { parseUuid, requireBody } = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const DEFAULT_TTL_SECONDS = 300;

function ttlMs() {
  return (Number(process.env.DOWNLOAD_TTL_SECONDS) || DEFAULT_TTL_SECONDS) * 1000;
}

function expiresAt(download) {
  return new Date(download.downloadedAt.getTime() + ttlMs());
}

function toPublicDownload(download) {
  return {
    id: download.id,
    orderItemId: download.orderItemId,
    productFileId: download.productFileId,
    productId: download.orderItem?.productId,
    fileName: download.productFile?.fileName,
    downloadedAt: download.downloadedAt,
    ipAddress: download.ipAddress
  };
}

function downloadInclude(orderWhere = {}, itemWhere = {}) {
  return [
    {
      model: OrderItem,
      as: 'orderItem',
      where: itemWhere,
      required: true,
      attributes: ['id', 'productId'],
      include: [{ model: Order, as: 'order', where: orderWhere, required: true, attributes: ['id', 'userId'] }]
    },
    { model: ProductFile, as: 'productFile', attributes: ['id', 'fileName'] }
  ];
}

// Запрос скачивания фиксирует факт выдачи и открывает короткое окно для GET .../content
async function requestDownload(user, body, ipAddress) {
  requireBody(body);

  const orderItemId = parseUuid(body.orderItemId, 'orderItemId');
  const productFileId = parseUuid(body.productFileId, 'productFileId');

  const orderItem = await OrderItem.findByPk(orderItemId, { include: [{ model: Order, as: 'order' }] });

  if (!orderItem || orderItem.order.userId !== user.id) {
    throw createHttpError(404, 'Позиция заказа не найдена');
  }

  if (orderItem.order.status !== 'paid') {
    throw createHttpError(409, 'Скачивание доступно только для оплаченного заказа');
  }

  // Файл активен либо удалён уже после оформления заказа. Статус товара (archived) значения не имеет
  const file = await ProductFile.findOne({
    where: {
      id: productFileId,
      productId: orderItem.productId,
      [Op.or]: [{ deletedAt: null }, { deletedAt: { [Op.gt]: orderItem.order.createdAt } }]
    }
  });

  if (!file) {
    throw createHttpError(404, 'Файл не найден среди файлов купленного товара');
  }

  const download = await Download.create({ orderItemId, productFileId, ipAddress: ipAddress?.slice(0, 45) || null });

  return { id: download.id, expiresAt: expiresAt(download) };
}

// Отдаёт поток файла только владельцу, пока не истёк TTL и заказ остаётся оплаченным
async function openContent(user, downloadId) {
  const download = await Download.findByPk(downloadId, {
    include: [
      { model: OrderItem, as: 'orderItem', include: [{ model: Order, as: 'order' }] },
      { model: ProductFile, as: 'productFile' }
    ]
  });

  if (!download || download.orderItem.order.userId !== user.id) {
    throw createHttpError(404, 'Скачивание не найдено');
  }

  if (download.orderItem.order.status !== 'paid') {
    throw createHttpError(403, 'Доступ к файлу закрыт: заказ не оплачен или возвращён');
  }

  if (expiresAt(download) < new Date()) {
    throw createHttpError(410, 'Срок действия ссылки истёк, запросите скачивание заново');
  }

  const { stream, size } = await storageService.stream(download.productFile.storageKey);

  return {
    stream,
    size,
    fileName: download.productFile.fileName,
    mimeType: download.productFile.mimeType
  };
}

async function listOwn(userId, page) {
  const result = await paginate(Download, page, {
    include: downloadInclude({ userId }),
    order: [['downloadedAt', 'DESC'], ['id', 'DESC']]
  });

  return { ...result, items: result.items.map(toPublicDownload) };
}

async function listAll({ page, userId, productId }) {
  const orderWhere = userId === undefined ? {} : { userId: parseUuid(userId, 'userId') };
  const itemWhere = productId === undefined ? {} : { productId: parseUuid(productId, 'productId') };

  const result = await paginate(Download, page, {
    include: downloadInclude(orderWhere, itemWhere),
    order: [['downloadedAt', 'DESC'], ['id', 'DESC']]
  });

  return {
    ...result,
    items: result.items.map((download) => ({ ...toPublicDownload(download), userId: download.orderItem.order.userId }))
  };
}

module.exports = { requestDownload, openContent, listOwn, listAll };
