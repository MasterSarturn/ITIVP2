const express = require('express');
const paymentController = require('../controllers/paymentController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const { uuidParam } = require('../utils/validators');

// монтируется на /api: webhook лежит в /api/payments/webhook, симуляция - в /api/dev/payments/:id/simulate
const router = express.Router();

router.param('id', uuidParam);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Результат платежа от провайдера
 *     description: Защищён подписью HMAC-SHA256 тела запроса (заголовок X-Signature, общий секрет PAYMENT_WEBHOOK_SECRET), а не JWT. Идемпотентен по (provider, externalPaymentId). Единственный способ перевести заказ в paid.
 *     parameters:
 *       - { name: X-Signature, in: header, required: true, schema: { type: string }, description: HMAC-SHA256 hex сырого тела }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, externalPaymentId, status, amount]
 *             properties:
 *               provider: { type: string, example: mock }
 *               externalPaymentId: { type: string }
 *               status: { type: string, enum: [completed, failed] }
 *               amount: { type: string, example: '19.99' }
 *     responses:
 *       200:
 *         description: Результат применён (или уже был применён)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Неверная подпись
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/payments/webhook', asyncHandler(paymentController.webhook));

// Только для разработки: имитирует ответ провайдера без подписи
if (process.env.NODE_ENV !== 'production') {
  /**
   * @openapi
   * /api/dev/payments/{id}/simulate:
   *   post:
   *     tags: [Payments]
   *     summary: Имитация ответа провайдера (только при NODE_ENV не production)
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
   *             required: [status]
   *             properties:
   *               status: { type: string, enum: [completed, failed] }
   *     responses:
   *       200:
   *         description: Платёж после применения результата
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   */
  router.post('/dev/payments/:id/simulate', authenticate, asyncHandler(paymentController.simulate));
}

module.exports = router;
