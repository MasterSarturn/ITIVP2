const { WishlistItem, Product } = require('../models');
const productService = require('./productService');
const { paginate } = require('../utils/pagination');
const { parseUuid, requireBody } = require('../utils/validators');
const createHttpError = require('../utils/httpError');

async function list(userId, page) {
  const result = await paginate(WishlistItem, page, {
    where: { userId },
    include: [{ model: Product, as: 'product', attributes: ['id', 'sellerId', 'name', 'price', 'status'] }],
    order: [['createdAt', 'DESC'], ['productId', 'DESC']]
  });

  // запись остаётся, даже если товар потом сняли с публикации или заархивировали
  const items = [];

  for (const item of result.items) {
    items.push({
      productId: item.productId,
      addedAt: item.createdAt,
      available: await productService.isPubliclyVisible(item.product),
      product: { id: item.product.id, name: item.product.name, price: item.product.price, status: item.product.status }
    });
  }

  return { ...result, items };
}

// Повторное добавление дубль не создаёт: created = false
async function add(userId, body) {
  requireBody(body);

  const productId = parseUuid(body.productId, 'productId');
  const product = await Product.findByPk(productId);

  if (!product || !await productService.isPubliclyVisible(product)) {
    throw createHttpError(404, 'Товар не найден');
  }

  const [, created] = await WishlistItem.findOrCreate({ where: { userId, productId } });
  return { productId, created };
}

async function remove(userId, productId) {
  const deleted = await WishlistItem.destroy({ where: { userId, productId } });

  if (deleted === 0) {
    throw createHttpError(404, 'Товара нет в избранном');
  }
}

module.exports = { list, add, remove };
