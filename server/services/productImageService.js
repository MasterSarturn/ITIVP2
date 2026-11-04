const crypto = require('crypto');
const { Product } = require('../models');
const productService = require('./productService');
const storageService = require('./storageService');
const createHttpError = require('../utils/httpError');

// Формат определяется по сигнатуре файла, а не по расширению и заявленному типу
function detectImage(buffer) {
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png' };
  }

  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg' };
  }

  if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp' };
  }

  throw createHttpError(415, 'Поддерживаются изображения PNG, JPEG и WebP');
}

const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

async function setImage(user, productId, file) {
  const product = await productService.findManageableProduct(productId, user);
  const { ext } = detectImage(file.buffer);
  const key = `products/${product.id}/image/${crypto.randomUUID()}.${ext}`;
  const previous = product.getDataValue('imageKey');

  await storageService.save(key, file.buffer);

  try {
    await product.update({ imageKey: key });
  } catch (error) {
    await storageService.remove(key);
    throw error;
  }

  if (previous) {
    await storageService.remove(previous);
  }

  return productService.findVisibleProduct(product.id, user);
}

async function removeImage(user, productId) {
  const product = await productService.findManageableProduct(productId, user);
  const previous = product.getDataValue('imageKey');

  if (!previous) {
    return;
  }

  await product.update({ imageKey: null });
  await storageService.remove(previous);
}

// Картинка публична, как и карточка товара; скрытый товар видят только владелец и администратор
async function getImage(productId, viewer) {
  const product = await Product.findByPk(productId);

  const key = product?.getDataValue('imageKey');

  if (!key || !(await productService.canView(product, viewer))) {
    throw createHttpError(404, 'Изображение не найдено');
  }

  const { stream, size } = await storageService.stream(key);
  return { stream, size, mimeType: MIME_BY_EXT[key.split('.').pop()] };
}

module.exports = { setImage, removeImage, getImage };
