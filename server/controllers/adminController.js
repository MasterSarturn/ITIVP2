const accountService = require('../services/accountService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const downloadService = require('../services/downloadService');
const { parsePage } = require('../utils/validators');

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
  const { status, sellerId } = req.query;
  res.status(200).json(await productService.listAll({ page: parsePage(req.query.page), status, sellerId }));
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

module.exports = {
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
