// Отзывы и продажи продавца
const express = require('express');
const reviewController = require('../controllers/reviewController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { uuidParam } = require('../utils/validators');

const reviews = express.Router();
const seller = express.Router();

reviews.use(authenticate);
reviews.param('id', uuidParam);

/**
 * @openapi
 * /api/reviews/{id}:
 *   patch:
 *     tags: [Reviews]
 *     summary: Изменить собственный отзыв
 *     description: Чужой отзыв изменить нельзя, в том числе администратору (403).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               text: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Обновлённый отзыв
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
reviews.patch('/:id', asyncHandler(reviewController.updateReview));

/**
 * @openapi
 * /api/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Удалить отзыв (свой; администратор — любой)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Отзыв удалён
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
reviews.delete('/:id', asyncHandler(reviewController.deleteReview));

/**
 * @openapi
 * /api/seller/sales:
 *   get:
 *     tags: [Seller]
 *     summary: Оплаченные позиции по собственным товарам (продавец, администратор)
 *     description: Данные покупателя не отдаются.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница продаж (productId, unitPrice, paidAt)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
seller.get('/sales', authenticate, requireRole('seller', 'admin'), asyncHandler(reviewController.listSales));

module.exports = { reviews, seller };
