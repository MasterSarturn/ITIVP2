const accountService = require('../services/accountService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const downloadService = require('../services/downloadService');
const statsService = require('../services/statsService');
const promoService = require('../services/promoService');
const { parsePage } = require('../utils/validators');
const { sendCsv } = require('../utils/csvExport');

async function getStats(req, res) {
  res.status(200).json(await statsService.getStats(req.query.days));
}

async function listUsers(req, res) {
  const { status, role, q } = req.query;
  res.status(200).json(await accountService.listUsers({ page: parsePage(req.query.page), status, role, q }));
}

async function getUser(req, res) {
  res.status(200).json(await accountService.getUser(req.params.id));
}

async function updateUser(req, res) {
  res.status(200).json(await accountService.updateUser(req.params.id, req.body));
}

async function setUserStatus(req, res) {
  res.status(200).json(await accountService.setStatus(req.user, req.params.id, req.body));
}

async function setUserRole(req, res) {
  res.status(200).json(await accountService.setRole(req.user, req.params.id, req.body));
}

async function deleteUser(req, res) {
  await accountService.deleteUser(req.user, req.params.id);
  res.status(204).send();
}

async function listProducts(req, res) {
  const { status, sellerId, q } = req.query;
  res.status(200).json(await productService.listAll({ page: parsePage(req.query.page), status, sellerId, q }));
}

async function listOrders(req, res) {
  const { status, userId } = req.query;
  res.status(200).json(await orderService.listAllOrders({ page: parsePage(req.query.page), status, userId }));
}

async function refundOrder(req, res) {
  res.status(200).json(await orderService.refundOrder(req.user, req.params.id));
}

async function listPayments(req, res) {
  const { status, orderId } = req.query;
  res.status(200).json(await paymentService.listAllPayments({ page: parsePage(req.query.page), status, orderId }));
}

async function listDownloads(req, res) {
  const { userId, productId } = req.query;
  res.status(200).json(await downloadService.listAll({ page: parsePage(req.query.page), userId, productId }));
}

async function listPromoCodes(req, res) {
  const { isActive, q } = req.query;
  res.status(200).json(await promoService.list({ page: parsePage(req.query.page), isActive, q }));
}

async function createPromoCode(req, res) {
  res.status(201).json(await promoService.create(req.user, req.body));
}

async function updatePromoCode(req, res) {
  res.status(200).json(await promoService.update(req.user, req.params.id, req.body));
}

async function deletePromoCode(req, res) {
  await promoService.remove(req.user, req.params.id);
  res.status(204).send();
}

// ---------- Экспорт CSV: те же фильтры, что у списков, но все страницы ----------

function exportUsers(req, res) {
  const { status, role, q } = req.query;
  return sendCsv(
    res,
    'users.csv',
    ['ID', 'Имя', 'Фамилия', 'Email', 'Роль', 'Статус', 'Создан', 'Последний вход'],
    (page) => accountService.listUsers({ page, status, role, q }),
    (u) => [u.id, u.firstName, u.lastName, u.email, u.role, u.status, u.createdAt, u.lastLoginAt]
  );
}

function exportOrders(req, res) {
  const { status, userId } = req.query;
  return sendCsv(
    res,
    'orders.csv',
    ['ID', 'Статус', 'Сумма, BYN', 'Покупатель', 'Email', 'Товары', 'Создан', 'Изменён'],
    (page) => orderService.listAllOrders({ page, status, userId }),
    (o) => [
      o.id,
      o.status,
      o.totalAmount,
      [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' '),
      o.user?.account?.email,
      (o.items ?? []).map((item) => item.product?.name).filter(Boolean).join(', '),
      o.createdAt,
      o.updatedAt
    ]
  );
}

function exportPayments(req, res) {
  const { status, orderId } = req.query;
  return sendCsv(
    res,
    'payments.csv',
    ['ID', 'Заказ', 'Сумма, BYN', 'Статус', 'Провайдер', 'Внешний ID', 'Оплачен', 'Создан'],
    (page) => paymentService.listAllPayments({ page, status, orderId }),
    (p) => [p.id, p.orderId, p.amount, p.status, p.provider, p.externalPaymentId, p.paidAt, p.createdAt]
  );
}

function exportProducts(req, res) {
  const { status, sellerId, q } = req.query;
  return sendCsv(
    res,
    'products.csv',
    ['ID', 'Название', 'Категория', 'Продавец', 'Цена, BYN', 'Статус', 'Создан'],
    (page) => productService.listAll({ page, status, sellerId, q }),
    (p) => [
      p.id,
      p.name,
      p.category?.name,
      [p.seller?.firstName, p.seller?.lastName].filter(Boolean).join(' '),
      p.price,
      p.status,
      p.createdAt
    ]
  );
}

module.exports = {
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  exportUsers,
  exportOrders,
  exportPayments,
  exportProducts,
  getStats,
  listUsers,
  getUser,
  updateUser,
  setUserStatus,
  setUserRole,
  deleteUser,
  listProducts,
  listOrders,
  refundOrder,
  listPayments,
  listDownloads
};
