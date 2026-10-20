const { Op } = require('sequelize');
const {
  sequelize, Product, Category, Author, ProductFile, User, Account
} = require('../models');
const { paginate, DESC } = require('../utils/pagination');
const {
  parseUuid, requireBody, parseRequiredString, parseEnum, likePattern
} = require('../utils/validators');
const createHttpError = require('../utils/httpError');

const PRODUCT_STATUSES = ['draft', 'published', 'archived'];
const SELLER_ROLES = ['seller', 'admin'];

const productInclude = [
  { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
  { model: Author, as: 'authors', attributes: ['id', 'name'], through: { attributes: [] } },
  // публичная карточка продавца: email и статус аккаунта не отдаются
  { model: User, as: 'seller', attributes: ['id', 'firstName', 'lastName'] }
];

// Товары заблокированного и удалённого продавца в каталог не попадают
const ACTIVE_SELLERS = sequelize.literal(`(SELECT "userId" FROM "Accounts" WHERE "status" = 'active')`);

function isOwnerOrAdmin(product, viewer) {
  return Boolean(viewer) && (viewer.role === 'admin' || viewer.id === product.sellerId);
}

async function isPubliclyVisible(product) {
  if (product.status !== 'published') {
    return false;
  }

  const account = await Account.findOne({ where: { userId: product.sellerId }, attributes: ['status'] });
  return account?.status === 'active';
}

function loadProduct(id) {
  return Product.findByPk(id, { include: productInclude });
}

// Скрытый товар для остальных выглядит несуществующим (404)
async function findVisibleProduct(id, viewer) {
  const product = await loadProduct(id);

  if (!product || !(isOwnerOrAdmin(product, viewer) || await isPubliclyVisible(product))) {
    throw createHttpError(404, 'Товар не найден');
  }

  return product;
}

// Менять товар может владелец или Admin. Чужой видимый — 403, чужой скрытый — 404
async function findManageableProduct(id, user) {
  const product = await Product.findByPk(id);

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  if (isOwnerOrAdmin(product, user)) {
    return product;
  }

  throw await isPubliclyVisible(product)
    ? createHttpError(403, 'Нельзя изменять чужой товар')
    : createHttpError(404, 'Товар не найден');
}

async function listCatalog({ page, categorySlug, authorId, q }) {
  const where = { status: 'published', sellerId: { [Op.in]: ACTIVE_SELLERS } };

  if (categorySlug !== undefined) {
    const category = await Category.findOne({ where: { slug: String(categorySlug) }, attributes: ['id'] });

    if (!category) {
      return paginate(Product, page, { where: { id: null } });
    }

    where.categoryId = category.id;
  }

  if (authorId !== undefined) {
    parseUuid(authorId, 'authorId');
    where.id = {
      [Op.in]: sequelize.literal(
        `(SELECT "productId" FROM "ProductAuthors" WHERE "authorId" = ${sequelize.escape(authorId)})`
      )
    };
  }

  if (typeof q === 'string' && q.trim() !== '') {
    where[Op.or] = [
      { name: { [Op.iLike]: likePattern(q.trim()) } },
      { description: { [Op.iLike]: likePattern(q.trim()) } }
    ];
  }

  return paginate(Product, page, { where, include: productInclude, distinct: true });
}

function listBySeller(sellerId, { page, status }) {
  const where = { sellerId };

  if (status !== undefined) {
    where.status = parseEnum(status, PRODUCT_STATUSES, 'status');
  }

  return paginate(Product, page, { where, include: productInclude, distinct: true, order: DESC });
}

function listAll({ page, status, sellerId }) {
  const where = {};

  if (status !== undefined) {
    where.status = parseEnum(status, PRODUCT_STATUSES, 'status');
  }

  if (sellerId !== undefined) {
    where.sellerId = parseUuid(sellerId, 'sellerId');
  }

  return paginate(Product, page, { where, include: productInclude, distinct: true, order: DESC });
}

function parsePrice(price) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw createHttpError(400, 'Цена должна быть числом, большим или равным нулю');
  }

  // в БД цена хранится с точностью до копеек
  if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) {
    throw createHttpError(400, 'Цена должна содержать не более двух знаков после запятой');
  }

  return price;
}

async function parseAuthorIds(authorIds) {
  if (authorIds === undefined) {
    return undefined;
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

// Категория передаётся slug'ом (books, music, software) и заменяется на categoryId
async function parseProductBody(body) {
  requireBody(body);

  const slug = parseRequiredString(body.category, 'category');
  const category = await Category.findOne({ where: { slug } });

  if (!category) {
    throw createHttpError(400, `Категория ${slug} не найдена`);
  }

  return {
    fields: {
      name: parseRequiredString(body.name, 'name'),
      description: parseRequiredString(body.description, 'description', 100000),
      price: parsePrice(body.price),
      categoryId: category.id
    },
    authorIds: await parseAuthorIds(body.authorIds)
  };
}

// Admin может создать товар от имени другого продавца, остальные всегда продают от себя
async function resolveSellerId(user, requestedSellerId) {
  if (user.role !== 'admin' || requestedSellerId === undefined) {
    return user.id;
  }

  const sellerId = parseUuid(requestedSellerId, 'sellerId');
  const account = await Account.findOne({ where: { userId: sellerId } });

  if (!account || account.status !== 'active' || !SELLER_ROLES.includes(account.role)) {
    throw createHttpError(400, 'Продавцом может быть только активный пользователь с ролью seller или admin');
  }

  return sellerId;
}

async function createProduct(user, body) {
  const { fields, authorIds } = await parseProductBody(body);
  const sellerId = await resolveSellerId(user, body.sellerId);

  const product = await sequelize.transaction(async (transaction) => {
    // товар всегда создаётся черновиком, status из тела игнорируется
    const created = await Product.create({ ...fields, sellerId, status: 'draft' }, { transaction });

    if (authorIds?.length) {
      await created.setAuthors(authorIds, { transaction });
    }

    return created;
  });

  return loadProduct(product.id);
}

async function updateProduct(user, id, body) {
  const product = await findManageableProduct(id, user);
  const { fields, authorIds } = await parseProductBody(body);

  await sequelize.transaction(async (transaction) => {
    await product.update(fields, { transaction });

    if (authorIds !== undefined) {
      await product.setAuthors(authorIds, { transaction });
    }
  });

  return loadProduct(id);
}

function countActiveFiles(productId, transaction) {
  return ProductFile.count({ where: { productId, deletedAt: null }, transaction });
}

// draft ⇄ published — владелец и Admin, archived → draft — только Admin. В archived переводит DELETE
async function setStatus(user, id, body) {
  requireBody(body);

  const product = await findManageableProduct(id, user);
  const status = parseEnum(body.status, PRODUCT_STATUSES, 'status');

  if (status === product.status) {
    throw createHttpError(409, `Товар уже имеет статус ${status}`);
  }

  if (status === 'archived') {
    throw createHttpError(409, 'Для архивации используйте DELETE /api/products/:id');
  }

  if (product.status === 'archived' && user.role !== 'admin') {
    throw createHttpError(403, 'Вернуть товар из архива может только администратор');
  }

  if (status === 'published' && await countActiveFiles(product.id) === 0) {
    throw createHttpError(409, 'Нельзя опубликовать товар без файлов');
  }

  await product.update({ status });
  return loadProduct(id);
}

async function archiveProduct(user, id) {
  const product = await findManageableProduct(id, user);
  await product.update({ status: 'archived' });
}

module.exports = {
  PRODUCT_STATUSES,
  findVisibleProduct,
  findManageableProduct,
  isPubliclyVisible,
  countActiveFiles,
  listCatalog,
  listBySeller,
  listAll,
  createProduct,
  updateProduct,
  setStatus,
  archiveProduct
};
