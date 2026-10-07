const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Регистрация пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Пользователь с таким email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Вход, выдача access-токена и refresh-cookie
 *     description: accessToken возвращается в теле, refresh-токен — в httpOnly-cookie refreshToken.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Аккаунт заблокирован администратором
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       423:
 *         description: Аккаунт временно заблокирован после неудачных попыток входа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', asyncHandler(authController.login));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Обновление пары токенов по refresh-токену
 *     description: Refresh-токен берётся из cookie refreshToken, тело запроса не нужно. Старый токен отзывается (ротация), новый ставится в cookie.
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tokens'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Выход, отзыв текущих токенов
 *     description: Отзывает access-токен и refresh-токен из cookie, cookie очищается. Тело запроса не нужно.
 *     security:
 *       - bearerAuth: []
 *         refreshCookie: []
 *     responses:
 *       204:
 *         description: Токены отозваны
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, asyncHandler(authController.logout));

module.exports = router;
