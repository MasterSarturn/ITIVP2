const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sequelize, Sequelize, User, Account } = require('../models');
const Token = require('../models/token');
const createHttpError = require('../utils/httpError');

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function validateOptionalName(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw createHttpError(400, `Поле ${field} должно быть строкой`);
  }

  return value.trim() || null;
}

function toPublicUser(user, account) {
  return {
    id: user.id,
    email: account.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt
  };
}

async function register({ email, password, firstName, lastName } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw createHttpError(400, 'Некорректный email');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw createHttpError(400, `Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов`);
  }

  const userData = {
    firstName: validateOptionalName(firstName, 'firstName'),
    lastName: validateOptionalName(lastName, 'lastName')
  };

  const existingAccount = await Account.findOne({ where: { email: normalizedEmail } });

  if (existingAccount) {
    throw createHttpError(409, 'Пользователь с таким email уже существует');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  try {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.create(userData, { transaction });
      const account = await Account.create(
        { userId: user.id, email: normalizedEmail, passwordHash },
        { transaction }
      );

      return toPublicUser(user, account);
    });
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Пользователь с таким email уже существует');
    }

    throw error;
  }
}

async function saveToken(userId, token, type) {
  const { exp } = jwt.decode(token);

  await Token.create({
    userId,
    token,
    type,
    expiresAt: new Date(exp * 1000)
  });
}

async function issueTokens(account) {
  const accessToken = jwt.sign(
    { id: account.userId, email: account.email, role: account.role, jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h' }
  );
  const refreshToken = jwt.sign(
    { id: account.userId, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  );

  await saveToken(account.userId, accessToken, 'access');
  await saveToken(account.userId, refreshToken, 'refresh');

  const { iat, exp } = jwt.decode(accessToken);

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: new Date(jwt.decode(refreshToken).exp * 1000),
    tokenType: 'Bearer',
    expiresIn: exp - iat
  };
}

async function login({ email, password } = {}) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || typeof password !== 'string') {
    throw createHttpError(400, 'Необходимо указать email и пароль');
  }

  const account = await Account.scope('withPassword').findOne({
    where: { email: normalizedEmail }
  });

  if (!account || account.status === 'deleted') {
    throw createHttpError(401, 'Неверный email или пароль');
  }

  if (account.status === 'blocked') {
    throw createHttpError(403, 'Аккаунт заблокирован администратором');
  }

  const now = new Date();

  if (account.lockUntil && account.lockUntil > now) {
    throw createHttpError(423, `Аккаунт заблокирован до ${account.lockUntil.toISOString()}`);
  }

  if (account.lockUntil) {
    account.failedLoginAttempts = 0;
    account.lockUntil = null;
  }

  const isPasswordValid = await bcrypt.compare(password, account.passwordHash);

  if (!isPasswordValid) {
    account.failedLoginAttempts += 1;

    if (account.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      account.lockUntil = new Date(now.getTime() + LOCK_TIME_MS);
      await account.save();
      throw createHttpError(
        423,
        `Слишком много неудачных попыток входа. Аккаунт заблокирован до ${account.lockUntil.toISOString()}`
      );
    }

    await account.save();
    throw createHttpError(401, 'Неверный email или пароль');
  }

  account.failedLoginAttempts = 0;
  account.lockUntil = null;
  account.lastLoginAt = now;
  await account.save();

  return issueTokens(account);
}

async function refresh(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken === '') {
    throw createHttpError(400, 'Необходимо передать refreshToken');
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw createHttpError(401, 'Некорректный или просроченный refresh-токен');
  }

  // Ротация: старый refresh-токен удаляется сразу, повторно его использовать нельзя
  const storedToken = await Token.findOneAndDelete({ token: refreshToken, type: 'refresh' });

  if (!storedToken) {
    throw createHttpError(401, 'Refresh-токен отозван или истёк');
  }

  const account = await Account.findOne({ where: { userId: decoded.id } });

  if (!account || account.status !== 'active') {
    throw createHttpError(401, 'Аккаунт недоступен');
  }

  return issueTokens(account);
}

async function logout(userId, accessToken, refreshToken) {
  const tokens = [accessToken, refreshToken].filter(Boolean);
  await Token.deleteMany({ userId, token: { $in: tokens } });
}

async function revokeAllTokens(userId) {
  await Token.deleteMany({ userId });
}

module.exports = {
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCK_TIME_MS,
  BCRYPT_SALT_ROUNDS,
  register,
  login,
  issueTokens,
  refresh,
  logout,
  revokeAllTokens
};
