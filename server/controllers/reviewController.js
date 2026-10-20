const reviewService = require('../services/reviewService');
const salesService = require('../services/salesService');
const { parsePage } = require('../utils/validators');

async function listReviews(req, res) {
  res.status(200).json(await reviewService.listReviews(req.user, req.params.id, parsePage(req.query.page)));
}

async function createReview(req, res) {
  res.status(201).json(await reviewService.createReview(req.user, req.params.id, req.body));
}

async function updateReview(req, res) {
  res.status(200).json(await reviewService.updateReview(req.user, req.params.id, req.body));
}

async function deleteReview(req, res) {
  await reviewService.deleteReview(req.user, req.params.id);
  res.status(204).send();
}

async function listSales(req, res) {
  res.status(200).json(await salesService.listSales(req.user.id, parsePage(req.query.page)));
}

module.exports = { listReviews, createReview, updateReview, deleteReview, listSales };
