// Справочники Category и Author
const { Op } = require('sequelize');
const { Sequelize, Category, Author, Product } = require('../models');
const { paginate } = require('../utils/pagination');
const {
  requireBody, parseRequiredString, parseOptionalString, likePattern
} = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseSlug(value) {
  const slug = parseRequiredString(value, 'slug', 100);

  if (!SLUG_PATTERN.test(slug)) {
    throw createHttpError(400, 'slug может содержать строчную латиницу, цифры и дефис');
  }

  return slug;
}

function rethrowConflict(error, message) {
  if (error instanceof Sequelize.UniqueConstraintError) {
    throw createHttpError(409, message);
  }

  if (error instanceof Sequelize.ForeignKeyConstraintError) {
    throw createHttpError(409, message);
  }

  throw error;
}

// ---------- Категории ----------

function listCategories(page) {
  return paginate(Category, page, { order: [['name', 'ASC'], ['id', 'ASC']] });
}

async function createCategory(body) {
  requireBody(body);

  try {
    return await Category.create({
      name: parseRequiredString(body.name, 'name'),
      slug: parseSlug(body.slug),
      description: parseOptionalString(body.description, 'description') ?? null
    });
  } catch (error) {
    return rethrowConflict(error, 'Категория с таким name или slug уже существует');
  }
}

async function updateCategory(id, body) {
  requireBody(body);

  const category = await Category.findByPk(id);

  if (!category) {
    throw createHttpError(404, 'Категория не найдена');
  }

  const changes = {};

  if (body.name !== undefined) {
    changes.name = parseRequiredString(body.name, 'name');
  }

  if (body.slug !== undefined) {
    changes.slug = parseSlug(body.slug);
  }

  const description = parseOptionalString(body.description, 'description');

  if (description !== undefined) {
    changes.description = description;
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нужно передать хотя бы одно из полей: name, slug, description');
  }

  try {
    return await category.update(changes);
  } catch (error) {
    return rethrowConflict(error, 'Категория с таким name или slug уже существует');
  }
}

async function deleteCategory(id) {
  const category = await Category.findByPk(id);

  if (!category) {
    throw createHttpError(404, 'Категория не найдена');
  }

  // считаются и архивные товары: Product.categoryId → RESTRICT
  if (await Product.count({ where: { categoryId: id } }) > 0) {
    throw createHttpError(409, 'Нельзя удалить категорию, в которой есть товары');
  }

  try {
    await category.destroy();
  } catch (error) {
    rethrowConflict(error, 'Нельзя удалить категорию, в которой есть товары');
  }
}

// ---------- Авторы ----------

function listAuthors({ page, q }) {
  const where = {};

  if (typeof q === 'string' && q.trim() !== '') {
    where.name = { [Op.iLike]: likePattern(q.trim()) };
  }

  return paginate(Author, page, { where, order: [['name', 'ASC'], ['id', 'ASC']] });
}

async function getAuthor(id) {
  const author = await Author.findByPk(id);

  if (!author) {
    throw createHttpError(404, 'Автор не найден');
  }

  return author;
}

function createAuthor(body) {
  requireBody(body);

  return Author.create({
    name: parseRequiredString(body.name, 'name'),
    description: parseOptionalString(body.description, 'description') ?? null
  });
}

async function updateAuthor(id, body) {
  requireBody(body);

  const author = await getAuthor(id);
  const changes = {};

  if (body.name !== undefined) {
    changes.name = parseRequiredString(body.name, 'name');
  }

  const description = parseOptionalString(body.description, 'description');

  if (description !== undefined) {
    changes.description = description;
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нужно передать хотя бы одно из полей: name, description');
  }

  return author.update(changes);
}

async function deleteAuthor(id) {
  const author = await getAuthor(id);

  try {
    await author.destroy();
  } catch (error) {
    rethrowConflict(error, 'Нельзя удалить автора, привязанного к товарам');
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor
};
