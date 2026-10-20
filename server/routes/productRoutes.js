const express = require('express');
const productController = require('../controllers/productController');
const productFileController = require('../controllers/productFileController');
const reviewController = require('../controllers/reviewController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const { optionalAuthenticate } = authenticate;
const requireRole = require('../middleware/requireRole');
const uploadFile = require('../middleware/upload');
const { uuidParam } = require('../utils/validators');

const router = express.Router();
const sellerOrAdmin = requireRole('seller', 'admin');

router.param('id', uuidParam);
router.param('productId', uuidParam);
router.param('fileId', uuidParam);

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Каталог опубликованных товаров (постранично, по 20)
 *     description: Товары заблокированного и удалённого продавца в каталог не попадают.
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: categorySlug, in: query, schema: { type: string }, description: slug категории }
 *       - { name: authorId, in: query, schema: { type: string, format: uuid } }
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по названию и описанию }
 *     responses:
 *       200:
 *         description: Страница товаров и общее число страниц
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsPage'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/', asyncHandler(productController.getProducts));

/**
 * @openapi
 * /api/products/mine:
 *   get:
 *     tags: [Products]
 *     summary: Собственные товары во всех статусах (продавец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: status, in: query, schema: { type: string, enum: [draft, published, archived] } }
 *     responses:
 *       200:
 *         description: Страница товаров
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductsPage'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// маршрут объявлен раньше /:id, иначе «mine» будет принят за UUID
router.get('/mine', authenticate, sellerOrAdmin, asyncHandler(productController.getMyProducts));

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Просмотр товара
 *     description: Гость и пользователь видят только опубликованные товары. Владелец и администратор — любой статус. Скрытый товар для остальных — 404.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', optionalAuthenticate, asyncHandler(productController.getProductById));

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Создать товар (продавец, администратор). Товар всегда создаётся черновиком
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', authenticate, sellerOrAdmin, asyncHandler(productController.createProduct));

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Обновить товар (владелец, администратор)
 *     description: Если передан authorIds, набор авторов заменяется целиком. Статус меняется через PATCH /status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Обновлённый товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', authenticate, sellerOrAdmin, asyncHandler(productController.updateProduct));

/**
 * @openapi
 * /api/products/{id}/status:
 *   patch:
 *     tags: [Products]
 *     summary: Публикация и снятие с публикации (владелец, администратор)
 *     description: draft ⇄ published (публикация требует хотя бы один активный файл, иначе 409). archived → draft — только администратор. В archived товар переводит DELETE.
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
 *               status: { type: string, enum: [draft, published] }
 *     responses:
 *       200:
 *         description: Товар с новым статусом
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.patch('/:id/status', authenticate, sellerOrAdmin, asyncHandler(productController.updateProductStatus));

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Архивировать товар (владелец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Товар переведён в archived
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, sellerOrAdmin, asyncHandler(productController.deleteProduct));

/**
 * @openapi
 * /api/products/{productId}/files:
 *   get:
 *     tags: [Files]
 *     summary: Список файлов товара (метаданные)
 *     description: Владелец и администратор видят активные файлы. Покупатель оплаченного заказа — активные и удалённые уже после его заказа.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *     responses:
 *       200:
 *         description: Файлы без storageKey
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductFile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:productId/files', authenticate, asyncHandler(productFileController.listFiles));

/**
 * @openapi
 * /api/products/{productId}/files:
 *   post:
 *     tags: [Files]
 *     summary: Загрузить файл товара (владелец, администратор)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               version: { type: string, description: Необязательная версия файла }
 *     responses:
 *       201:
 *         description: Файл загружен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductFile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       413:
 *         description: Файл больше допустимого размера
 *       415:
 *         description: Тип файла не поддерживается
 */
router.post('/:productId/files', authenticate, sellerOrAdmin, uploadFile, asyncHandler(productFileController.uploadFile));

/**
 * @openapi
 * /api/products/{productId}/files/{fileId}:
 *   put:
 *     tags: [Files]
 *     summary: Заменить файл новой версией (владелец, администратор)
 *     description: Создаётся новая запись, у старой ставится deletedAt. Старая запись физически остаётся, на неё ссылаются скачивания.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *       - $ref: '#/components/parameters/FileIdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               version: { type: string }
 *     responses:
 *       201:
 *         description: Новая версия файла
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductFile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.put(
  '/:productId/files/:fileId',
  authenticate,
  sellerOrAdmin,
  uploadFile,
  asyncHandler(productFileController.replaceFile)
);

/**
 * @openapi
 * /api/products/{productId}/files/{fileId}:
 *   delete:
 *     tags: [Files]
 *     summary: Удалить файл (мягкое удаление; владелец, администратор)
 *     description: Последний активный файл опубликованного товара удалить нельзя (409), сначала снимите товар с публикации.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdPath'
 *       - $ref: '#/components/parameters/FileIdPath'
 *     responses:
 *       204:
 *         description: Файл удалён
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.delete(
  '/:productId/files/:fileId',
  authenticate,
  sellerOrAdmin,
  asyncHandler(productFileController.deleteFile)
);

/**
 * @openapi
 * /api/products/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Отзывы товара
 *     description: Отзывы скрытого товара видят только владелец и администратор, остальным — 404.
 *     security:
 *       - {}
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница отзывов
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/reviews', optionalAuthenticate, asyncHandler(reviewController.listReviews));

/**
 * @openapi
 * /api/products/{id}/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Оставить отзыв на купленный товар
 *     description: Нужен оплаченный заказ с этим товаром, нельзя оценивать собственный товар. Один отзыв на товар (повтор — 409).
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
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               text: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Отзыв создан
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/:id/reviews', authenticate, asyncHandler(reviewController.createReview));

module.exports = router;
