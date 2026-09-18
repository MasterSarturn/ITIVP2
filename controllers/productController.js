const productModel = require('../models/productModel');

const allowedCategories = new Set(['book', 'music', 'software']);
const requiredFields = ['name', 'category', 'description', 'author', 'downloadUrl'];

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseProductId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw createHttpError(400, 'ID товара должен быть положительным целым числом');
  }

  return id;
}

function validateProductData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw createHttpError(400, 'Тело запроса должно быть JSON-объектом');
  }

  const missingFields = requiredFields.filter(
    (field) => typeof data[field] !== 'string' || data[field].trim() === ''
  );

  if (missingFields.length > 0) {
    throw createHttpError(400, `Обязательные поля заполнены неверно: ${missingFields.join(', ')}`);
  }

  if (!allowedCategories.has(data.category)) {
    throw createHttpError(400, 'Категория должна быть book, music или software');
  }

  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0) {
    throw createHttpError(400, 'Цена должна быть числом, большим или равным нулю');
  }

  return {
    name: data.name.trim(),
    category: data.category,
    description: data.description.trim(),
    price: data.price,
    author: data.author.trim(),
    downloadUrl: data.downloadUrl.trim()
  };
}

function getProducts(req, res) {
  res.status(200).json(productModel.getAllProducts());
}

function getProductById(req, res) {
  const product = productModel.getProductById(parseProductId(req.params.id));

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  res.status(200).json(product);
}

function createProduct(req, res) {
  const product = productModel.createProduct(validateProductData(req.body));
  res.status(201).json(product);
}

function updateProduct(req, res) {
  const id = parseProductId(req.params.id);
  const product = productModel.updateProduct(id, validateProductData(req.body));

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  res.status(200).json(product);
}

function deleteProduct(req, res) {
  const product = productModel.deleteProduct(parseProductId(req.params.id));

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  res.status(204).send();
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};