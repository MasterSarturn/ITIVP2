// Справочники: /api/categories и /api/authors
const express = require('express');
const catalogController = require('../controllers/catalogController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { uuidParam } = require('../utils/validators');

const categories = express.Router();
const authors = express.Router();
const adminOnly = [authenticate, requireRole('admin')];

categories.param('id', uuidParam);
authors.param('id', uuidParam);

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags: [Catalog]
 *     summary: Список категорий
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *     responses:
 *       200:
 *         description: Страница категорий
 */
categories.get('/', asyncHandler(catalogController.listCategories));

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags: [Catalog]
 *     summary: Создать категорию (администратор)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string, example: Games }
 *               slug: { type: string, description: Строчная латиница - цифры - дефис, example: games }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Категория создана
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
categories.post('/', adminOnly, asyncHandler(catalogController.createCategory));

/**
 * @openapi
 * /api/categories/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Изменить категорию (администратор)
 *     description: Смена slug ломает клиентов, которые передают категорию в товаре по slug.
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
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Обновлённая категория
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
categories.patch('/:id', adminOnly, asyncHandler(catalogController.updateCategory));

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Удалить категорию (администратор)
 *     description: Если в категории есть товары (в том числе архивные) — 409.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Категория удалена
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
categories.delete('/:id', adminOnly, asyncHandler(catalogController.deleteCategory));

/**
 * @openapi
 * /api/authors:
 *   get:
 *     tags: [Catalog]
 *     summary: Список авторов
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - { name: q, in: query, schema: { type: string }, description: Поиск по имени }
 *     responses:
 *       200:
 *         description: Страница авторов
 */
authors.get('/', asyncHandler(catalogController.listAuthors));

/**
 * @openapi
 * /api/authors/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Просмотр автора
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200:
 *         description: Автор
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
authors.get('/:id', asyncHandler(catalogController.getAuthor));

/**
 * @openapi
 * /api/authors:
 *   post:
 *     tags: [Catalog]
 *     summary: Создать автора (продавец, администратор)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Robert C. Martin }
 *               description: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Автор создан
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
authors.post('/', authenticate, requireRole('seller', 'admin'), asyncHandler(catalogController.createAuthor));

/**
 * @openapi
 * /api/authors/{id}:
 *   patch:
 *     tags: [Catalog]
 *     summary: Изменить автора (администратор)
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
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Обновлённый автор
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
authors.patch('/:id', adminOnly, asyncHandler(catalogController.updateAuthor));

/**
 * @openapi
 * /api/authors/{id}:
 *   delete:
 *     tags: [Catalog]
 *     summary: Удалить автора (администратор)
 *     description: Если автор привязан к товарам — 409.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       204:
 *         description: Автор удалён
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
authors.delete('/:id', adminOnly, asyncHandler(catalogController.deleteAuthor));

module.exports = { categories, authors };
