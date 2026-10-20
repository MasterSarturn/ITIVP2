const express = require('express');
const profileController = require('../controllers/profileController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /profile:
 *   get:
 *     tags: [Profile]
 *     summary: Получить профиль текущего пользователя
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/', asyncHandler(profileController.getProfile));

/**
 * @openapi
 * /profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Изменить имя и/или фамилию
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdate'
 *     responses:
 *       200:
 *         description: Обновлённый профиль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/', asyncHandler(profileController.updateProfile));

/**
 * @openapi
 * /profile/password:
 *   patch:
 *     tags: [Profile]
 *     summary: Сменить собственный пароль
 *     description: Все токены отзываются, возвращается новая пара (access в теле, refresh в cookie).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Неверный текущий пароль
 */
router.patch('/password', asyncHandler(profileController.changePassword));

/**
 * @openapi
 * /profile/email:
 *   patch:
 *     tags: [Profile]
 *     summary: Сменить собственный email
 *     description: Нужен текущий пароль. Подтверждения по почте нет. Email лежит в JWT, поэтому токены отзываются и выдаются заново.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, email]
 *             properties:
 *               currentPassword: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Неверный текущий пароль
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/email', asyncHandler(profileController.changeEmail));

/**
 * @openapi
 * /profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Удалить профиль (мягкое удаление)
 *     description: Статус deleted, товары архивируются, pending-заказы отменяются, все токены отзываются. Email остаётся занятым.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Профиль удалён
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/', asyncHandler(profileController.deleteProfile));

module.exports = router;
