const productService = require('../services/productService');
const { parsePage } = require('../utils/validators');

async function getProducts(req, res) {
  const { categorySlug, authorId, q } = req.query;
  res.status(200).json(await productService.listCatalog({ page: parsePage(req.query.page), categorySlug, authorId, q }));
}

async function getProductById(req, res) {
  res.status(200).json(await productService.findVisibleProduct(req.params.id, req.user));
}

async function getMyProducts(req, res) {
  res.status(200).json(
    await productService.listBySeller(req.user.id, { page: parsePage(req.query.page), status: req.query.status })
  );
}

async function createProduct(req, res) {
  res.status(201).json(await productService.createProduct(req.user, req.body));
}

async function updateProduct(req, res) {
  res.status(200).json(await productService.updateProduct(req.user, req.params.id, req.body));
}

async function updateProductStatus(req, res) {
  res.status(200).json(await productService.setStatus(req.user, req.params.id, req.body));
}

async function deleteProduct(req, res) {
  await productService.archiveProduct(req.user, req.params.id);
  res.status(204).send();
}

module.exports = {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};
