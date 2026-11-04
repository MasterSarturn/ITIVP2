const { Sequelize, Cart, CartItem, Product, Account, PromoCode } = require('../models');
const { evaluatePromo, describePromo } = require('../utils/promo');
const { hasPurchased } = require('./accessService');
const { toCents, fromCents } = require('../utils/money');
const { parseUuid, requireBody } = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const productAttributes = ['id', 'sellerId', 'name', 'price', 'status', 'imageKey', 'imageUrl'];

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

// Позиции корзины с признаком доступности и сумма только по доступным
async function summarize(cartId) {
  const items = await loadItems(cartId);
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
      product: { id: item.product.id, name: item.product.name, price: item.product.price, status: item.product.status, imageUrl: item.product.imageUrl }
    });
  }

  return { items: result, totalCents };
}

// totalAmount - итог к оплате с учётом промокода. Если выбранный код перестал действовать,
// скидка не считается, а причина возвращается в promoProblem
async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const { items, totalCents } = await summarize(cart.id);
  const promo = cart.promoCodeId ? await PromoCode.findByPk(cart.promoCodeId) : null;
  const { discountCents, problem } = promo ? evaluatePromo(promo, totalCents) : { discountCents: 0, problem: null };

  return {
    id: cart.id,
    items,
    subtotalAmount: fromCents(totalCents),
    discountAmount: fromCents(discountCents),
    totalAmount: fromCents(totalCents - discountCents),
    promo: promo ? describePromo(promo) : null,
    promoProblem: problem
  };
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
  await cart.update({ promoCodeId: null });
}

module.exports = { getCart, summarize, addItem, removeItem, clearCart, getOrCreateCart, loadItems, isAvailable };
