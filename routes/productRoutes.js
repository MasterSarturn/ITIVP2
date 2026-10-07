const express = require('express');
const productController = require('../controllers/productController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Список товаров (постранично, по 20)
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница товаров и общее число страниц
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsPage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', asyncHandler(productController.getProducts));

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Получить товар по ID
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', asyncHandler(productController.getProductById));

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Создать товар (только администратор)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, requireAdmin, asyncHandler(productController.createProduct));

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Полностью обновить товар (только администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(productController.updateProduct));

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Удалить товар (только администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductId'
 *     responses:
 *       204:
 *         description: Товар удалён
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, requireAdmin, asyncHandler(productController.deleteProduct));

module.exports = router;
