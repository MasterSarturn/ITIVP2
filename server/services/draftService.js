const ProductDraft = require('../models/productDraft');
const { DRAFT_CATEGORIES } = ProductDraft;
const { Author } = require('../models');
const { PAGE_SIZE, toPage } = require('../utils/pagination');
const { parseAttributes } = require('../utils/draftAttributes');
const {
  parseUuid, requireBody, parseRequiredString, parseOptionalString, parseEnum
} = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const MAX_TAGS = 20;

function parsePrice(price) {
  if (price === undefined || price === null) {
    return null;
  }

  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw createHttpError(400, 'Цена должна быть числом, большим или равным нулю');
  }

  if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) {
    throw createHttpError(400, 'Цена должна содержать не более двух знаков после запятой');
  }

  return price;
}

function parseTags(tags) {
  if (tags === undefined) {
    return [];
  }

  if (!Array.isArray(tags) || tags.length > MAX_TAGS) {
    throw createHttpError(400, `tags должен быть массивом строк (не более ${MAX_TAGS})`);
  }

  return [...new Set(tags.map((tag) => parseRequiredString(tag, 'tags[]', 50).toLowerCase()))];
}

// authorIds — UUID авторов из справочника в SQL
async function parseAuthorIds(authorIds) {
  if (authorIds === undefined) {
    return [];
  }

  if (!Array.isArray(authorIds)) {
    throw createHttpError(400, 'authorIds должен быть массивом UUID');
  }

  const ids = [...new Set(authorIds.map((id) => parseUuid(id, 'authorIds[]')))];

  if (ids.length > 0 && await Author.count({ where: { id: ids } }) !== ids.length) {
    throw createHttpError(400, 'Некоторые авторы из authorIds не найдены');
  }

  return ids;
}

// Полный набор полей черновика: необязательные поля, которых нет в теле, получают значения по умолчанию
async function parseDraftBody(body) {
  requireBody(body);

  const category = body.category === undefined || body.category === null
    ? null
    : parseEnum(body.category, DRAFT_CATEGORIES, 'category');

  return {
    name: parseRequiredString(body.name, 'name'),
    description: parseOptionalString(body.description, 'description', 100000) ?? '',
    price: parsePrice(body.price),
    category,
    authorIds: await parseAuthorIds(body.authorIds),
    tags: parseTags(body.tags),
    attributes: parseAttributes(body.attributes, category)
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Продавец (и администратор тоже) видит только собственные черновики
async function listDrafts(user, { page, tag, q }) {
  const filter = { sellerId: user.id };

  if (typeof tag === 'string' && tag.trim() !== '') {
    filter.tags = tag.trim().toLowerCase();
  }

  if (typeof q === 'string' && q.trim() !== '') {
    filter.name = { $regex: escapeRegex(q.trim()), $options: 'i' };
  }

  const [items, totalItems] = await Promise.all([
    ProductDraft.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    ProductDraft.countDocuments(filter)
  ]);

  return toPage(items, totalItems, page);
}

async function createDraft(user, body) {
  const fields = await parseDraftBody(body);
  return ProductDraft.create({ ...fields, sellerId: user.id });
}

// PUT заменяет все поля черновика целиком. Чужой черновик выглядит несуществующим (404)
async function updateDraft(user, id, body) {
  const fields = await parseDraftBody(body);

  const draft = await ProductDraft.findOneAndUpdate(
    { _id: id, sellerId: user.id },
    { $set: fields },
    { returnDocument: 'after', runValidators: true }
  );

  if (!draft) {
    throw createHttpError(404, 'Черновик не найден');
  }

  return draft;
}

async function deleteDraft(user, id) {
  const draft = await ProductDraft.findOneAndDelete({ _id: id, sellerId: user.id });

  if (!draft) {
    throw createHttpError(404, 'Черновик не найден');
  }
}

module.exports = { listDrafts, createDraft, updateDraft, deleteDraft };
