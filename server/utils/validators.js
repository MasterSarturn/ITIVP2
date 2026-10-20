const createHttpError = require('./httpError');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function parseUuid(value, label = 'ID') {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw createHttpError(400, `${label} должен быть в формате UUID`);
  }

  return value;
}

// router.param(name, uuidParam): проверяет формат UUID у всех :id в путях
function uuidParam(req, res, next, value, name) {
  try {
    parseUuid(value, `Параметр ${name}`);
    next();
  } catch (error) {
    next(error);
  }
}

function parsePage(value) {
  if (value === undefined) {
    return 1;
  }

  const page = Number(value);

  if (typeof value !== 'string' || value.trim() === '' || !Number.isInteger(page) || page < 1) {
    throw createHttpError(400, 'Номер страницы должен быть положительным целым числом');
  }

  return page;
}

function requireBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'Тело запроса должно быть JSON-объектом');
  }

  return body;
}

function parseRequiredString(value, field, maxLength = 255) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createHttpError(400, `Поле ${field} обязательно и должно быть непустой строкой`);
  }

  if (value.trim().length > maxLength) {
    throw createHttpError(400, `Поле ${field} не должно быть длиннее ${maxLength} символов`);
  }

  return value.trim();
}

// undefined — поле не передано, null или пустая строка — очистка значения
function parseOptionalString(value, field, maxLength = 10000) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw createHttpError(400, `Поле ${field} должно быть строкой`);
  }

  if (value.trim().length > maxLength) {
    throw createHttpError(400, `Поле ${field} не должно быть длиннее ${maxLength} символов`);
  }

  return value.trim() || null;
}

function parseEnum(value, allowed, field) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw createHttpError(400, `Поле ${field} должно быть одним из: ${allowed.join(', ')}`);
  }

  return value;
}

function parseOptionalEnum(value, allowed, field) {
  return value === undefined ? undefined : parseEnum(value, allowed, field);
}

function parseEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!EMAIL_PATTERN.test(email)) {
    throw createHttpError(400, 'Некорректный email');
  }

  return email;
}

function parsePassword(value, field = 'Пароль') {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `${field} должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`);
  }

  return value;
}

// Имя и фамилия: хотя бы одно поле, null и пустая строка очищают значение
function parseNameChanges(data) {
  requireBody(data);

  const changes = {};

  for (const field of ['firstName', 'lastName']) {
    const value = parseOptionalString(data[field], field, 255);

    if (value !== undefined) {
      changes[field] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нужно передать хотя бы одно из полей: firstName, lastName');
  }

  return changes;
}

// Экранирует % и _ , чтобы пользовательская строка искалась как обычный текст
function likePattern(value) {
  return `%${String(value).replace(/[\%_]/g, '\$&')}%`;
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  parseUuid,
  uuidParam,
  parsePage,
  requireBody,
  parseRequiredString,
  parseOptionalString,
  parseEnum,
  parseOptionalEnum,
  parseEmail,
  parsePassword,
  parseNameChanges,
  likePattern
};
