const createHttpError = require('./httpError');

const MAX_STRING = 255;

const str = (value, key) => {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > MAX_STRING) {
    throw createHttpError(400, `attributes.${key} должен быть непустой строкой до ${MAX_STRING} символов`);
  }

  return value.trim();
};

const int = (min) => (value, key) => {
  if (!Number.isInteger(value) || value < min) {
    throw createHttpError(400, `attributes.${key} должен быть целым числом не меньше ${min}`);
  }

  return value;
};

const strArray = (value, key) => {
  if (!Array.isArray(value) || value.length > 10) {
    throw createHttpError(400, `attributes.${key} должен быть массивом строк (до 10 элементов)`);
  }

  return value.map((item) => str(item, `${key}[]`));
};

// Допустимые характеристики по slug категории
const SCHEMAS = {
  books: { isbn: str, pages: int(1), language: str, format: str },
  music: { durationSec: int(0), genre: str, bitrate: int(1) },
  software: { version: str, os: strArray, license: str }
};

// Возвращает очищенный объект attributes. Неизвестные ключи — 400
function parseAttributes(value, category) {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw createHttpError(400, 'Поле attributes должно быть объектом');
  }

  const keys = Object.keys(value);

  if (keys.length === 0) {
    return {};
  }

  if (!category) {
    throw createHttpError(400, 'Чтобы передать attributes, укажите category');
  }

  const rules = SCHEMAS[category];
  const result = {};

  for (const key of keys) {
    if (!Object.hasOwn(rules, key)) {
      throw createHttpError(
        400,
        `Характеристика ${key} недопустима для категории ${category}. Доступны: ${Object.keys(rules).join(', ')}`
      );
    }

    result[key] = rules[key](value[key], key);
  }

  return result;
}

module.exports = { parseAttributes };
