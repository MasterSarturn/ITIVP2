// Черновики карточек товаров продавца (MongoDB)
const express = require('express');
const draftController = require('../controllers/draftController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { objectIdParam } = require('../utils/validators');

const router = express.Router();

router.use(authenticate, requireRole('seller', 'admin'));
router.param('id', objectIdParam);

/**
 * @openapi
 * /api/seller/drafts:
 *   get:
 *     tags: [Seller]
 *     summary: Собственные черновики товаров (MongoDB, постранично, по 20)
 *     description: Видны только черновики текущего пользователя, в том числе для администратора.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: tag, in: query, schema: { type: string }, description: Фильтр по тегу }
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по названию }
 *     responses:
 *       200:
 *         description: Страница черновиков
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDraftsPage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', asyncHandler(draftController.listDrafts));

/**
 * @openapi
 * /api/seller/drafts:
 *   post:
 *     tags: [Seller]
 *     summary: Создать черновик товара (MongoDB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductDraftInput'
 *     responses:
 *       201:
 *         description: Черновик создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDraft'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', asyncHandler(draftController.createDraft));

/**
 * @openapi
 * /api/seller/drafts/{id}:
 *   put:
 *     tags: [Seller]
 *     summary: Заменить черновик целиком (только свой)
 *     description: Поля, которых нет в теле, сбрасываются к значениям по умолчанию. Чужой черновик — 404.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ObjectId черновика
 *         schema: { type: string, example: 507f1f77bcf86cd799439011 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductDraftInput'
 *     responses:
 *       200:
 *         description: Обновлённый черновик
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductDraft'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', asyncHandler(draftController.updateDraft));

/**
 * @openapi
 * /api/seller/drafts/{id}:
 *   delete:
 *     tags: [Seller]
 *     summary: Удалить черновик (только свой, физическое удаление)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ObjectId черновика
 *         schema: { type: string, example: 507f1f77bcf86cd799439011 }
 *     responses:
 *       204:
 *         description: Черновик удалён
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', asyncHandler(draftController.deleteDraft));

module.exports = router;
