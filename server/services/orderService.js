const { sequelize, Order, OrderItem, Payment, Product, CartItem } = require('../models');
const cartService = require('./cartService');
const paymentProvider = require('./paymentProvider');
const { hasPurchased } = require('./accessService');
const { paginate, DESC } = require('../utils/pagination');
const { toCents, fromCents } = require('../utils/money');
const { parseUuid, parseOptionalEnum } = require('../utils/validators');
const audit = require('../utils/audit');
const createHttpError = require('../utils/httpError');

const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'];

const orderInclude = [{
  model: OrderItem,
  as: 'items',
  include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }]
}];

function loadOrder(id, options = {}) {
  return Order.findByPk(id, { include: orderInclude, ...options });
}

async function createOrder(user) {
  const orderId = await sequelize.transaction(async (transaction) => {
    const cart = await cartService.getOrCreateCart(user.id, transaction);
    // блокировка корзины защищает от двух одновременных оформлений
    await cart.reload({ lock: transaction.LOCK.UPDATE, transaction });

    const items = await cartService.loadItems(cart.id, transaction);

    if (items.length === 0) {
      throw createHttpError(409, 'Корзина пуста');
    }

    let totalCents = 0;

    for (const { product } of items) {
      if (!await cartService.isAvailable(product)) {
        throw createHttpError(409, `Товар «${product.name}» недоступен для покупки, удалите его из корзины`);
      }

      if (product.sellerId === user.id) {
        throw createHttpError(409, `Нельзя купить собственный товар «${product.name}»`);
      }

      if (await hasPurchased(user.id, product.id)) {
        throw createHttpError(409, `Товар «${product.name}» уже куплен`);
      }

      totalCents += toCents(product.price);
    }

    // бесплатный заказ платежа не требует и сразу считается оплаченным
    const order = await Order.create({
      userId: user.id,
      status: totalCents === 0 ? 'paid' : 'pending',
      totalAmount: fromCents(totalCents)
    }, { transaction });

    // unitPrice фиксирует цену на момент заказа
    await OrderItem.bulkCreate(
      items.map(({ product }) => ({ orderId: order.id, productId: product.id, unitPrice: product.price })),
      { transaction }
    );
    await CartItem.destroy({ where: { cartId: cart.id }, transaction });

    return order.id;
  });

  return loadOrder(orderId);
}

function listOrders(userId, page) {
  return paginate(Order, page, { where: { userId }, include: orderInclude, distinct: true, order: DESC });
}

function listAllOrders({ page, status, userId }) {
  const where = {};
  const parsedStatus = parseOptionalEnum(status, ORDER_STATUSES, 'status');

  if (parsedStatus !== undefined) {
    where.status = parsedStatus;
  }

  if (userId !== undefined) {
    where.userId = parseUuid(userId, 'userId');
  }

  return paginate(Order, page, { where, include: orderInclude, distinct: true, order: DESC });
}

// Чужой заказ для обычного пользователя не существует (404), Admin читает любые
async function getOrder(user, id) {
  const order = await loadOrder(id);

  if (!order || (order.userId !== user.id && user.role !== 'admin')) {
    throw createHttpError(404, 'Заказ не найден');
  }

  return order;
}

async function cancelOrder(user, id) {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction });

    if (!order || (order.userId !== user.id && user.role !== 'admin')) {
      throw createHttpError(404, 'Заказ не найден');
    }

    if (order.status !== 'pending') {
      throw createHttpError(409, 'Отменить можно только заказ в статусе pending');
    }

    await order.update({ status: 'cancelled' }, { transaction });
    await Payment.update({ status: 'failed' }, { where: { orderId: order.id, status: 'pending' }, transaction });
  });

  return loadOrder(id);
}

async function refundOrder(admin, id) {
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(id, { lock: transaction.LOCK.UPDATE, transaction });

    if (!order) {
      throw createHttpError(404, 'Заказ не найден');
    }

    if (order.status !== 'paid') {
      throw createHttpError(409, 'Вернуть можно только оплаченный заказ');
    }

    const payments = await Payment.findAll({ where: { orderId: order.id, status: 'completed' }, transaction });

    for (const payment of payments) {
      await paymentProvider.refund(payment);
      await payment.update({ status: 'refunded' }, { transaction });
    }

    await order.update({ status: 'refunded' }, { transaction });
  });

  audit(admin, 'order.refund', { orderId: id });
  return loadOrder(id);
}

// Отмена незавершённых заказов пользователя при удалении его аккаунта
async function cancelPendingOrders(userId, transaction) {
  const orders = await Order.findAll({ where: { userId, status: 'pending' }, attributes: ['id'], transaction });
  const orderIds = orders.map((order) => order.id);

  if (orderIds.length === 0) {
    return;
  }

  await Order.update({ status: 'cancelled' }, { where: { id: orderIds }, transaction });
  await Payment.update({ status: 'failed' }, { where: { orderId: orderIds, status: 'pending' }, transaction });
}

module.exports = {
  ORDER_STATUSES,
  createOrder,
  listOrders,
  listAllOrders,
  getOrder,
  cancelOrder,
  refundOrder,
  cancelPendingOrders
};
