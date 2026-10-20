const catalogService = require('../services/catalogService');
const { parsePage } = require('../utils/validators');

async function listCategories(req, res) {
  res.status(200).json(await catalogService.listCategories(parsePage(req.query.page)));
}

async function createCategory(req, res) {
  res.status(201).json(await catalogService.createCategory(req.body));
}

async function updateCategory(req, res) {
  res.status(200).json(await catalogService.updateCategory(req.params.id, req.body));
}

async function deleteCategory(req, res) {
  await catalogService.deleteCategory(req.params.id);
  res.status(204).send();
}

async function listAuthors(req, res) {
  res.status(200).json(await catalogService.listAuthors({ page: parsePage(req.query.page), q: req.query.q }));
}

async function getAuthor(req, res) {
  res.status(200).json(await catalogService.getAuthor(req.params.id));
}

async function createAuthor(req, res) {
  res.status(201).json(await catalogService.createAuthor(req.body));
}

async function updateAuthor(req, res) {
  res.status(200).json(await catalogService.updateAuthor(req.params.id, req.body));
}

async function deleteAuthor(req, res) {
  await catalogService.deleteAuthor(req.params.id);
  res.status(204).send();
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor
};
