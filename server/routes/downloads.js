const express = require('express');
const downloadController = require('../controllers/downloadController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const { uuidParam } = require('../utils/validators');

const router = express.Router();

router.use(authenticate);
router.param('id', uuidParam);

/**
 * @openapi
 * /api/downloads:
 *   post:
 *     tags: [Downloads]
 *     summary: Запросить скачивание купленного файла
 *     description: Позиция должна принадлежать пользователю и входить в оплаченный заказ, файл — относиться к купленному товару и быть активным (либо удалённым после заказа). Создаёт запись Download и открывает короткое окно для получения файла.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderItemId, productFileId]
 *             properties:
 *               orderItemId: { type: string, format: uuid }
 *               productFileId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Идентификатор скачивания и время окончания окна
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', asyncHandler(downloadController.requestDownload));

/**
 * @openapi
 * /api/downloads:
 *   get:
 *     tags: [Downloads]
 *     summary: История собственных скачиваний
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница скачиваний
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', asyncHandler(downloadController.listDownloads));

/**
 * @openapi
 * /api/downloads/{id}/content:
 *   get:
 *     tags: [Downloads]
 *     summary: Получить файл по созданному запросу скачивания
 *     description: Только владелец и только в течение TTL (DOWNLOAD_TTL_SECONDS) после запроса. Для возвращённого заказа — 403, по истечении окна — 410.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Поток файла
 *         content:
 *           application/octet-stream:
 *             schema: { type: string, format: binary }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       410:
 *         description: Срок действия ссылки истёк
 */
router.get('/:id/content', asyncHandler(downloadController.getContent));

module.exports = router;
