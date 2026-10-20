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

module.exports = router;
