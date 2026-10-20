const { sequelize, Sequelize, Order, Payment } = require('../models');
const paymentProvider = require('./paymentProvider');
const { paginate, DESC } = require('../utils/pagination');
const { toCents } = require('../utils/money');
const { parseUuid, parseOptionalEnum, parseEnum, requireBody } = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];
const PROVIDER_RESULTS = ['completed', 'failed'];

function toPublicPayment(payment) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    status: payment.status,
    provider: payment.provider,
    externalPaymentId: payment.externalPaymentId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    ...(payment.status === 'pending' && { paymentUrl: paymentProvider.checkoutUrl(payment) })
  };
}

async function findOwnOrder(user, orderId, { allowAdmin }) {
  const order = await Order.findByPk(orderId);

  if (!order || (order.userId !== user.id && !(allowAdmin && user.role === 'admin'))) {
    throw createHttpError(404, 'Заказ не найден');
  }

  return order;
}

// Сумма берётся из заказа, а не из тела запроса. Незавершённый платёж заказа возвращается повторно
async function createPayment(user, orderId) {
  const order = await findOwnOrder(user, orderId, { allowAdmin: false });

  if (order.status !== 'pending') {
    throw createHttpError(409, 'Оплатить можно только заказ в статусе pending');
  }

  if (toCents(order.totalAmount) === 0) {
    throw createHttpError(409, 'Бесплатный заказ оплаты не требует');
  }

  const existing = await Payment.findOne({ where: { orderId, status: 'pending' } });

  if (existing) {
    return { payment: toPublicPayment(existing), created: false };
  }

  const { provider, externalPaymentId } = await paymentProvider.createPayment(order);
  const payment = await Payment.create({ orderId, amount: order.totalAmount, provider, externalPaymentId });

  return { payment: toPublicPayment(payment), created: true };
}

async function listOrderPayments(user, orderId) {
  await findOwnOrder(user, orderId, { allowAdmin: true });

  const payments = await Payment.findAll({ where: { orderId }, order: [['createdAt', 'ASC'], ['id', 'ASC']] });
  return payments.map(toPublicPayment);
}

async function listAllPayments({ page, status, orderId }) {
  const where = {};
  const parsedStatus = parseOptionalEnum(status, PAYMENT_STATUSES, 'status');

  if (parsedStatus !== undefined) {
    where.status = parsedStatus;
  }

  if (orderId !== undefined) {
    where.orderId = parseUuid(orderId, 'orderId');
  }

  const result = await paginate(Payment, page, { where, order: DESC });
  return { ...result, items: result.items.map(toPublicPayment) };
}

// Единственное место, где меняется статус платежа и, как следствие, заказа.
// Идемпотентно по (provider, externalPaymentId): повтор того же результата ничего не меняет
async function applyProviderResult({ provider, externalPaymentId, status, amount }) {
  try {
    return await sequelize.transaction(async (transaction) => {
      const payment = await Payment.findOne({
        where: { provider, externalPaymentId },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!payment) {
        throw createHttpError(404, 'Платёж не найден');
      }

      if (amount !== undefined && toCents(amount) !== toCents(payment.amount)) {
        throw createHttpError(400, 'Сумма не совпадает с суммой платежа');
      }

      if (payment.status === status) {
        return toPublicPayment(payment);
      }

      if (payment.status !== 'pending') {
        throw createHttpError(409, `Платёж уже в статусе ${payment.status}`);
      }

      if (status === 'failed') {
        await payment.update({ status }, { transaction });
        return toPublicPayment(payment);
      }

      const order = await Order.findByPk(payment.orderId, { lock: transaction.LOCK.UPDATE, transaction });

      if (order.status !== 'pending') {
        throw createHttpError(409, `Заказ в статусе ${order.status} оплатить нельзя`);
      }

      await payment.update({ status, paidAt: new Date(), externalPaymentId }, { transaction });
      await order.update({ status: 'paid' }, { transaction });

      return toPublicPayment(payment);
    });
  } catch (error) {
    // частичный уникальный индекс: у заказа не более одного completed-платежа
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'У заказа уже есть успешный платёж');
    }

    throw error;
  }
}

function parseWebhookBody(body) {
  requireBody(body);

  if (typeof body.provider !== 'string' || typeof body.externalPaymentId !== 'string') {
    throw createHttpError(400, 'Нужно передать provider и externalPaymentId');
  }

  if (typeof body.amount !== 'number' && typeof body.amount !== 'string') {
    throw createHttpError(400, 'Нужно передать amount');
  }

  return {
    provider: body.provider,
    externalPaymentId: body.externalPaymentId,
    status: parseEnum(body.status, PROVIDER_RESULTS, 'status'),
    amount: body.amount
  };
}

function handleWebhook(rawBody, signature, body) {
  if (!paymentProvider.verifySignature(rawBody, signature)) {
    throw createHttpError(401, 'Неверная подпись webhook');
  }

  return applyProviderResult(parseWebhookBody(body));
}

// Только для разработки: имитирует ответ провайдера по своему платежу
async function simulateResult(user, paymentId, body) {
  requireBody(body);

  const status = parseEnum(body.status, PROVIDER_RESULTS, 'status');
  const payment = await Payment.findByPk(paymentId);

  if (!payment) {
    throw createHttpError(404, 'Платёж не найден');
  }

  await findOwnOrder(user, payment.orderId, { allowAdmin: true });

  return applyProviderResult({ provider: payment.provider, externalPaymentId: payment.externalPaymentId, status });
}

module.exports = {
  createPayment,
  listOrderPayments,
  listAllPayments,
  handleWebhook,
  simulateResult
};
