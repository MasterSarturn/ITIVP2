// Файловое хранилище за узким интерфейсом (save, stream, remove): локальный диск
// можно заменить на S3, не трогая остальной код. storageKey наружу из сервера не уходит.
const fs = require('fs');
const path = require('path');
const createHttpError = require('../utils/httpError');

const ROOT = path.resolve(process.env.STORAGE_DIR || './storage');

function resolveKey(key) {
  const fullPath = path.resolve(ROOT, key);

  if (!fullPath.startsWith(ROOT + path.sep)) {
    throw createHttpError(400, 'Некорректный ключ хранилища');
  }

  return fullPath;
}

async function save(key, buffer) {
  const fullPath = resolveKey(key);

  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

  try {
    await fs.promises.writeFile(fullPath, buffer, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw createHttpError(409, 'Файл с таким именем и версией уже загружен');
    }

    throw error;
  }
}

async function stream(key) {
  const fullPath = resolveKey(key);

  try {
    const { size } = await fs.promises.stat(fullPath);
    return { stream: fs.createReadStream(fullPath), size };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createHttpError(404, 'Файл отсутствует в хранилище');
    }

    throw error;
  }
}

async function remove(key) {
  await fs.promises.rm(resolveKey(key), { force: true });
}

module.exports = { save, stream, remove };
