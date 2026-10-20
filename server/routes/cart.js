// Корзина (/api/cart) и избранное (/api/wishlist): у каждого пользователя только свои данные
const express = require('express');
const cartController = require('../controllers/cartController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const { uuidParam } = require('../utils/validators');

const cart = express.Router();
const wishlist = express.Router();

cart.use(authenticate);
wishlist.use(authenticate);
cart.param('productId', uuidParam);
wishlist.param('productId', uuidParam);

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Собственная корзина
 *     description: Позиции, товар которых перестал быть доступным, помечаются available=false и не входят в totalAmount.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Корзина с позициями и суммой (строкой)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
cart.get('/', asyncHandler(cartController.getCart));

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Очистить корзину
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Корзина очищена
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
cart.delete('/', asyncHandler(cartController.clearCart));

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Добавить товар в корзину
 *     description: Только опубликованный товар, не собственный и не купленный ранее. Повторное добавление — 409. Количества нет.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Корзина после добавления
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
cart.post('/items', asyncHandler(cartController.addCartItem));

/**
 * @openapi
 * /api/cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Удалить позицию из корзины
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *     responses:
 *       204:
 *         description: Позиция удалена
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
cart.delete('/items/:productId', asyncHandler(cartController.removeCartItem));

/**
 * @openapi
 * /api/wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Собственное избранное
 *     description: Запись о снятом с публикации или архивном товаре остаётся и помечается available=false.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница избранного
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
wishlist.get('/', asyncHandler(cartController.getWishlist));

/**
 * @openapi
 * /api/wishlist:
 *   post:
 *     tags: [Wishlist]
 *     summary: Добавить опубликованный товар в избранное
 *     description: 201 при добавлении, 200 если товар уже был в избранном.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Товар уже в избранном
 *       201:
 *         description: Товар добавлен
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
wishlist.post('/', asyncHandler(cartController.addToWishlist));

/**
 * @openapi
 * /api/wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Удалить товар из избранного
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *     responses:
 *       204:
 *         description: Удалено
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
wishlist.delete('/:productId', asyncHandler(cartController.removeFromWishlist));

module.exports = { cart, wishlist };
