const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const { parsePage } = require('../utils/validators');

async function createOrder(req, res) {
  res.status(201).json(await orderService.createOrder(req.user));
}

async function listOrders(req, res) {
  res.status(200).json(await orderService.listOrders(req.user.id, parsePage(req.query.page)));
}

async function getOrder(req, res) {
  res.status(200).json(await orderService.getOrder(req.user, req.params.id));
}

async function cancelOrder(req, res) {
  res.status(200).json(await orderService.cancelOrder(req.user, req.params.id));
}

async function createPayment(req, res) {
  const { payment, created } = await paymentService.createPayment(req.user, req.params.id);
  res.status(created ? 201 : 200).json(payment);
}

async function listPayments(req, res) {
  res.status(200).json(await paymentService.listOrderPayments(req.user, req.params.id));
}

module.exports = { createOrder, listOrders, getOrder, cancelOrder, createPayment, listPayments };
