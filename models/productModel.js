const { Product } = require('./index');

function getAllProducts() {
  return Product.findAll({ order: [['id', 'ASC']] });
}

function getProductById(id) {
  return Product.findByPk(id);
}

function createProduct(productData) {
  return Product.create(productData);
}

async function updateProduct(id, productData) {
  const [updatedCount] = await Product.update(productData, { where: { id } });

  if (updatedCount === 0) {
    return undefined;
  }

  return Product.findByPk(id);
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);

  if (!product) {
    return undefined;
  }

  await product.destroy();
  return product;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};