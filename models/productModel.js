const products = require('../data/products');

function getAllProducts() {
  return products;
}

function getProductById(id) {
  return products.find((product) => product.id === id);
}

function createProduct(productData) {
  const nextId = products.length > 0
    ? Math.max(...products.map((product) => product.id)) + 1
    : 1;
  const product = {
    id: nextId,
    ...productData,
    createdAt: new Date().toISOString()
  };

  products.push(product);
  return product;
}

function updateProduct(id, productData) {
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return undefined;
  }

  const updatedProduct = {
    id,
    ...productData,
    createdAt: products[productIndex].createdAt
  };
  products[productIndex] = updatedProduct;
  return updatedProduct;
}

function deleteProduct(id) {
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return undefined;
  }

  const deletedProducts = products.splice(productIndex, 1);
  return deletedProducts[0];
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};