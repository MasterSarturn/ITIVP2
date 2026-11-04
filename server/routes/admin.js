// Администрирование: все маршруты только для роли admin
const express = require('express');
const adminController = require('../controllers/adminController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { uuidParam } = require('../utils/validators');

const router = express.Router();

router.use(authenticate, requireRole('admin'));
router.param('id', uuidParam);

/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Сводка для обзора админки
 *     description: Счётчики пользователей, товаров и заказов, выручка оплаченных заказов, динамика за 30 дней, топ-5 товаров и 5 последних заказов. Суммы - строки.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: days, in: query, schema: { type: integer, enum: [7, 30, 90], default: 30 }, description: Окно динамики, воронки и категорий }
 *     responses:
 *       200:
 *         description: Сводка
 */
router.get('/stats', asyncHandler(adminController.getStats));

/**
 * @openapi
 * /api/admin/users/export.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Экспорт CSV - пользователи
 *     description: Те же фильтры, что у списка, но все страницы (до 10 000 строк). UTF-8 с BOM, разделитель «;».
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: status, in: query, schema: { type: string, enum: [active, blocked, deleted] } }
 *       - { name: role, in: query, schema: { type: string, enum: [user, seller, admin] } }
 *       - { name: q, in: query, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Файл CSV
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/users/export.csv', asyncHandler(adminController.exportUsers));

/**
 * @openapi
 * /api/admin/orders/export.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Экспорт CSV - заказы
 *     description: Те же фильтры, что у списка, но все страницы (до 10 000 строк). UTF-8 с BOM, разделитель «;».
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: userId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Файл CSV
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/orders/export.csv', asyncHandler(adminController.exportOrders));

/**
 * @openapi
 * /api/admin/payments/export.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Экспорт CSV - платежи
 *     description: Те же фильтры, что у списка, но все страницы (до 10 000 строк). UTF-8 с BOM, разделитель «;».
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: orderId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Файл CSV
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/payments/export.csv', asyncHandler(adminController.exportPayments));

/**
 * @openapi
 * /api/admin/products/export.csv:
 *   get:
 *     tags: [Admin]
 *     summary: Экспорт CSV - товары
 *     description: Те же фильтры, что у списка, но все страницы (до 10 000 строк). UTF-8 с BOM, разделитель «;».
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { name: status, in: query, schema: { type: string } }
 *       - { name: sellerId, in: query, schema: { type: string, format: uuid } }
 *       - { name: q, in: query, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Файл CSV
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/products/export.csv', asyncHandler(adminController.exportProducts));

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Список пользователей
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: status, in: query, schema: { type: string, enum: [active, blocked, deleted] } }
 *       - { name: role, in: query, schema: { type: string, enum: [user, seller, admin] } }
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по имени - фамилии - email }
 *     responses:
 *       200:
 *         description: Страница пользователей
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', asyncHandler(adminController.listUsers));

/**
 * @openapi
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Профиль пользователя (id — User.id)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Профиль с email, ролью и статусом
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/users/:id', asyncHandler(adminController.getUser));

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Изменить имя и фамилию пользователя
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdate'
 *     responses:
 *       200:
 *         description: Обновлённый профиль
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/users/:id', asyncHandler(adminController.updateUser));

/**
 * @openapi
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Заблокировать или разблокировать пользователя
 *     description: После блокировки токены отзываются. Нельзя менять статус себе и оставлять систему без активного администратора (409).
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
 *               status: { type: string, enum: [active, blocked] }
 *     responses:
 *       200:
 *         description: Обновлённый профиль
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/users/:id/status', asyncHandler(adminController.setUserStatus));

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Сменить роль пользователя
 *     description: Токены пользователя отзываются, так как роль лежит в JWT. Себе роль менять нельзя (409).
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, seller, admin] }
 *     responses:
 *       200:
 *         description: Обновлённый профиль
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/users/:id/role', asyncHandler(adminController.setUserRole));

/**
 * @openapi
 * /api/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Удалить пользователя (мягко)
 *     description: Статус deleted, товары архивируются, pending-заказы отменяются, токены отзываются.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Пользователь удалён
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.delete('/users/:id', asyncHandler(adminController.deleteUser));

/**
 * @openapi
 * /api/admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: Все товары во всех статусах
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: status, in: query, schema: { type: string, enum: [draft, published, archived] } }
 *       - { name: sellerId, in: query, schema: { type: string, format: uuid } }
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по названию }
 *     responses:
 *       200:
 *         description: Страница товаров
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsPage'
 */
router.get('/products', asyncHandler(adminController.listProducts));

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Все заказы
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: status, in: query, schema: { type: string, enum: [pending, paid, cancelled, refunded] } }
 *       - { name: userId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Страница заказов
 */
router.get('/orders', asyncHandler(adminController.listOrders));

/**
 * @openapi
 * /api/admin/orders/{id}/refund:
 *   post:
 *     tags: [Admin]
 *     summary: Вернуть оплаченный заказ
 *     description: paid → refunded, платежи completed → refunded, доступ к скачиванию закрывается. Покупатель может купить товар заново.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Заказ после возврата
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/orders/:id/refund', asyncHandler(adminController.refundOrder));

/**
 * @openapi
 * /api/admin/payments:
 *   get:
 *     tags: [Admin]
 *     summary: Все платежи
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: status, in: query, schema: { type: string, enum: [pending, completed, failed, refunded] } }
 *       - { name: orderId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Страница платежей
 */
router.get('/payments', asyncHandler(adminController.listPayments));

/**
 * @openapi
 * /api/admin/downloads:
 *   get:
 *     tags: [Admin]
 *     summary: История всех скачиваний
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: userId, in: query, schema: { type: string, format: uuid } }
 *       - { name: productId, in: query, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Страница скачиваний
 */
router.get('/downloads', asyncHandler(adminController.listDownloads));

/**
 * @openapi
 * /api/admin/promo-codes:
 *   get:
 *     tags: [Admin]
 *     summary: Список промокодов
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: isActive, in: query, schema: { type: string, enum: ['true', 'false'] } }
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по коду }
 *     responses:
 *       200:
 *         description: Страница промокодов
 */
router.get('/promo-codes', asyncHandler(adminController.listPromoCodes));

/**
 * @openapi
 * /api/admin/promo-codes:
 *   post:
 *     tags: [Admin]
 *     summary: Создать промокод
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value]
 *             properties:
 *               code: { type: string, example: SALE10 }
 *               type: { type: string, enum: [percent, fixed] }
 *               value: { type: number, description: Процент (0.01-100) или сумма в BYN }
 *               minOrderAmount: { type: number, default: 0 }
 *               maxUses: { type: integer, nullable: true }
 *               expiresAt: { type: string, format: date-time, nullable: true }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Промокод создан
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/promo-codes', asyncHandler(adminController.createPromoCode));

/**
 * @openapi
 * /api/admin/promo-codes/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Изменить промокод
 *     description: Код и тип менять нельзя. Размер скидки - только пока код не использован.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Промокод обновлён
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/promo-codes/:id', asyncHandler(adminController.updatePromoCode));

/**
 * @openapi
 * /api/admin/promo-codes/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Удалить неиспользованный промокод
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Удалён
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Использован в заказах, отключите вместо удаления
 */
router.delete('/promo-codes/:id', asyncHandler(adminController.deletePromoCode));

module.exports = router;
