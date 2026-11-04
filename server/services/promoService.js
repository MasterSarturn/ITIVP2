const { Op } = require('sequelize');
const { sequelize, Sequelize, PromoCode, Order } = require('../models');
const cartService = require('./cartService');
const { paginate, DESC } = require('../utils/pagination');
const { evaluatePromo } = require('../utils/promo');
const { parseUuid, requireBody, parseEnum, likePattern } = require('../utils/validators');
const audit = require('../utils/audit');
const createHttpError = require('../utils/httpError');

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
const TYPES = ['percent', 'fixed'];

function parseCode(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!CODE_PATTERN.test(code)) {
    throw createHttpError(400, 'Промокод: 3-32 символа, латинские буквы, цифры, «-» и «_»');
  }

  return code;
}

function parseMoney(value, field, { min }) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw createHttpError(400, `Поле ${field} должно быть числом не меньше ${min}`);
  }

  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) {
    throw createHttpError(400, `Поле ${field}: не более двух знаков после запятой`);
  }

  return value;
}

function parseMaxUses(value) {
  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw createHttpError(400, 'Поле maxUses должно быть целым числом не меньше 1 или null');
  }

  return value;
}

function parseExpiresAt(value) {
  if (value === null) {
    return null;
  }

  const date = typeof value === 'string' ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    throw createHttpError(400, 'Поле expiresAt должно быть датой в формате ISO или null');
  }

  return date;
}

function parseValue(type, value) {
  const parsed = parseMoney(value, 'value', { min: 0.01 });

  if (type === 'percent' && parsed > 100) {
    throw createHttpError(400, 'Процентная скидка не может быть больше 100');
  }

  return parsed;
}

// ---------- Покупатель: промокод в корзине ----------

async function applyToCart(user, body) {
  requireBody(body);

  const code = parseCode(body.code);
  const promo = await PromoCode.findOne({ where: { code } });

  if (!promo) {
    throw createHttpError(404, 'Промокод не найден');
  }

  const cart = await cartService.getOrCreateCart(user.id);
  const { totalCents } = await cartService.summarize(cart.id);
  const { problem } = evaluatePromo(promo, totalCents);

  if (problem) {
    throw createHttpError(409, problem);
  }

  await cart.update({ promoCodeId: promo.id });
  return cartService.getCart(user.id);
}

async function removeFromCart(userId) {
  const cart = await cartService.getOrCreateCart(userId);
  await cart.update({ promoCodeId: null });
  return cartService.getCart(userId);
}

// Отмена заказа возвращает использование: вызывается внутри той же транзакции
async function release(orders, transaction) {
  const counts = new Map();

  for (const order of orders) {
    if (order.promoCodeId) {
      counts.set(order.promoCodeId, (counts.get(order.promoCodeId) ?? 0) + 1);
    }
  }

  for (const [id, count] of counts) {
    await PromoCode.update(
      { usedCount: sequelize.literal(`GREATEST("usedCount" - ${Number(count)}, 0)`) },
      { where: { id }, transaction }
    );
  }
}

// ---------- Администратор ----------

function list({ page, isActive, q }) {
  const where = {};

  if (isActive !== undefined) {
    where.isActive = parseEnum(isActive, ['true', 'false'], 'isActive') === 'true';
  }

  if (typeof q === 'string' && q.trim() !== '') {
    where.code = { [Op.iLike]: likePattern(q.trim()) };
  }

  return paginate(PromoCode, page, { where, order: DESC });
}

async function create(admin, body) {
  requireBody(body);

  const type = parseEnum(body.type, TYPES, 'type');
  const expiresAt = body.expiresAt === undefined ? null : parseExpiresAt(body.expiresAt);

  if (expiresAt && expiresAt <= new Date()) {
    throw createHttpError(400, 'Срок действия должен быть в будущем');
  }

  const data = {
    code: parseCode(body.code),
    type,
    value: parseValue(type, body.value),
    minOrderAmount: body.minOrderAmount === undefined ? 0 : parseMoney(body.minOrderAmount, 'minOrderAmount', { min: 0 }),
    maxUses: body.maxUses === undefined ? null : parseMaxUses(body.maxUses),
    expiresAt,
    isActive: body.isActive === undefined ? true : requireBoolean(body.isActive)
  };

  try {
    const promo = await PromoCode.create(data);
    audit(admin, 'promo.create', { promoCodeId: promo.id, code: promo.code });
    return promo;
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Промокод с таким кодом уже существует');
    }

    throw error;
  }
}

function requireBoolean(value) {
  if (typeof value !== 'boolean') {
    throw createHttpError(400, 'Поле isActive должно быть true или false');
  }

  return value;
}

async function findPromo(id) {
  const promo = await PromoCode.findByPk(parseUuid(id, 'ID'));

  if (!promo) {
    throw createHttpError(404, 'Промокод не найден');
  }

  return promo;
}

// Код и тип менять нельзя; размер скидки - только пока код не использован
async function update(admin, id, body) {
  requireBody(body);

  const promo = await findPromo(id);
  const changes = {};

  if (body.code !== undefined || body.type !== undefined) {
    throw createHttpError(400, 'Код и тип промокода менять нельзя: создайте новый');
  }

  if (body.value !== undefined) {
    if (promo.usedCount > 0) {
      throw createHttpError(409, 'Размер скидки нельзя менять у использованного промокода');
    }

    changes.value = parseValue(promo.type, body.value);
  }

  if (body.minOrderAmount !== undefined) {
    changes.minOrderAmount = parseMoney(body.minOrderAmount, 'minOrderAmount', { min: 0 });
  }

  if (body.maxUses !== undefined) {
    changes.maxUses = parseMaxUses(body.maxUses);

    if (changes.maxUses !== null && changes.maxUses < promo.usedCount) {
      throw createHttpError(400, `maxUses не может быть меньше числа использований (${promo.usedCount})`);
    }
  }

  if (body.expiresAt !== undefined) {
    changes.expiresAt = parseExpiresAt(body.expiresAt);
  }

  if (body.isActive !== undefined) {
    changes.isActive = requireBoolean(body.isActive);
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нет полей для изменения');
  }

  await promo.update(changes);
  audit(admin, 'promo.update', { promoCodeId: promo.id, fields: Object.keys(changes) });
  return promo;
}

async function remove(admin, id) {
  const promo = await findPromo(id);

  if (promo.usedCount > 0 || await Order.count({ where: { promoCodeId: promo.id } }) > 0) {
    throw createHttpError(409, 'Промокод использован в заказах: отключите его вместо удаления');
  }

  await promo.destroy();
  audit(admin, 'promo.delete', { promoCodeId: promo.id, code: promo.code });
}

module.exports = { applyToCart, removeFromCart, release, list, create, update, remove };
