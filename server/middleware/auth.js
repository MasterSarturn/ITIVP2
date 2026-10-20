const jwt = require('jsonwebtoken');
const Token = require('../models/token');
const asyncHandler = require('./asyncHandler');
const createHttpError = require('../utils/httpError');

async function verifyAccessToken(req) {
  const header = req.headers.authorization;

  if (!header) {
    throw createHttpError(401, 'Токен не передан');
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw createHttpError(401, 'Заголовок Authorization должен иметь формат Bearer <token>');
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createHttpError(401, 'Срок действия токена истёк');
    }

    throw createHttpError(401, 'Некорректный токен');
  }

  const isStored = await Token.exists({ token, type: 'access' });

  if (!isStored) {
    throw createHttpError(401, 'Токен отозван');
  }

  req.user = decoded;
  req.token = token;
}

const authenticate = asyncHandler(async (req, res, next) => {
  await verifyAccessToken(req);
  next();
});

// Для публичных маршрутов, где авторизованный пользователь видит больше. Без токена идёт как гость,
// а невалидный токен по-прежнему даёт 401
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization) {
    await verifyAccessToken(req);
  }

  next();
});

module.exports = authenticate;
module.exports.optionalAuthenticate = optionalAuthenticate;
