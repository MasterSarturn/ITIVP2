const express = require('express');
const orderController = require('../controllers/orderController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const { uuidParam } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);
router.param('id', uuidParam);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Оформить заказ из корзины
 *     description: В одной транзакции создаются заказ и позиции с фиксацией цены, корзина очищается. Бесплатный заказ сразу получает статус paid. Пустая корзина или недоступный, собственный и купленный ранее товар — 409.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Заказ с позициями
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', asyncHandler(orderController.createOrder));

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Собственные заказы
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница заказов
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', asyncHandler(orderController.listOrders));

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Заказ с позициями (владелец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Заказ
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', asyncHandler(orderController.getOrder));

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Отменить заказ в статусе pending (владелец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Заказ отменён, незавершённые платежи помечены failed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/:id/cancel', asyncHandler(orderController.cancelOrder));

/**
 * @openapi
 * /api/orders/{id}/payments:
 *   post:
 *     tags: [Payments]
 *     summary: Создать платёжную операцию по своему заказу
 *     description: Только заказ в статусе pending с суммой больше нуля. Сумма берётся из заказа. Если незавершённый платёж уже есть, возвращается он (200).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Уже существующий платёж
 *       201:
 *         description: Платёж создан, в ответе paymentUrl для оплаты у провайдера
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/:id/payments', asyncHandler(orderController.createPayment));

/**
 * @openapi
 * /api/orders/{id}/payments:
 *   get:
 *     tags: [Payments]
 *     summary: Платежи заказа (владелец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Платежи заказа
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/payments', asyncHandler(orderController.listPayments));

module.exports = router;
