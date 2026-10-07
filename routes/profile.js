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
 * /profile:
 *   delete:
 *     tags: [Profile]
 *     summary: Удалить профиль (мягкое удаление, все токены отзываются)
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
