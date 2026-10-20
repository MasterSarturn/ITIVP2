const { Sequelize, Cart, CartItem, Product, Account } = require('../models');
const { hasPurchased } = require('./accessService');
const { toCents, fromCents } = require('../utils/money');
const { parseUuid, requireBody } = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const productAttributes = ['id', 'sellerId', 'name', 'price', 'status'];

// Корзина создаётся лениво при первом обращении (Cart.userId UNIQUE)
async function getOrCreateCart(userId, transaction) {
  const [cart] = await Cart.findOrCreate({ where: { userId }, defaults: { userId }, transaction });
  return cart;
}

async function isSellerActive(sellerId) {
  const account = await Account.findOne({ where: { userId: sellerId }, attributes: ['status'] });
  return account?.status === 'active';
}

async function isAvailable(product) {
  return product.status === 'published' && await isSellerActive(product.sellerId);
}

async function loadItems(cartId, transaction) {
  return CartItem.findAll({
    where: { cartId },
    include: [{ model: Product, as: 'product', attributes: productAttributes }],
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
    transaction
  });
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await loadItems(cart.id);
  let totalCents = 0;

  const result = [];

  for (const item of items) {
    const available = await isAvailable(item.product);

    if (available) {
      totalCents += toCents(item.product.price);
    }

    result.push({
      productId: item.productId,
      addedAt: item.createdAt,
      available,
      product: { id: item.product.id, name: item.product.name, price: item.product.price, status: item.product.status }
    });
  }

  return { id: cart.id, items: result, totalAmount: fromCents(totalCents) };
}

async function addItem(user, body) {
  requireBody(body);

  const productId = parseUuid(body.productId, 'productId');
  const product = await Product.findByPk(productId);

  if (!product || !await isAvailable(product)) {
    throw createHttpError(404, 'Товар не найден');
  }

  if (product.sellerId === user.id) {
    throw createHttpError(409, 'Нельзя купить собственный товар');
  }

  if (await hasPurchased(user.id, productId)) {
    throw createHttpError(409, 'Товар уже куплен');
  }

  const cart = await getOrCreateCart(user.id);

  try {
    await CartItem.create({ cartId: cart.id, productId });
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Товар уже в корзине');
    }

    throw error;
  }

  return getCart(user.id);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  const deleted = await CartItem.destroy({ where: { cartId: cart.id, productId } });

  if (deleted === 0) {
    throw createHttpError(404, 'Товара нет в корзине');
  }
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { cartId: cart.id } });
}

module.exports = { getCart, addItem, removeItem, clearCart, getOrCreateCart, loadItems, isAvailable };
