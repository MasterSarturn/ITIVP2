const express = require('express');
const productController = require('../controllers/productController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));
router.post('/', asyncHandler(productController.createProduct));
router.put('/:id', asyncHandler(productController.updateProduct));
router.delete('/:id', asyncHandler(productController.deleteProduct));

module.exports = router;