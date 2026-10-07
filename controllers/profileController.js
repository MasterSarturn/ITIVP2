const { User } = require('../models');
const authService = require('../services/authService');
const createHttpError = require('../utils/httpError');

const editableFields = ['firstName', 'lastName'];

async function findActiveUser(userId) {
  const user = await User.findByPk(userId, { include: 'account' });

  if (!user || !user.account || user.account.status === 'deleted') {
    throw createHttpError(404, 'Профиль не найден');
  }

  return user;
}

function toProfile(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.account.email,
    status: user.account.status,
    lastLoginAt: user.account.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function validateProfileData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw createHttpError(400, 'Тело запроса должно быть JSON-объектом');
  }

  const changes = {};

  for (const field of editableFields) {
    if (data[field] === undefined) {
      continue;
    }

    if (data[field] !== null && typeof data[field] !== 'string') {
      throw createHttpError(400, `Поле ${field} должно быть строкой`);
    }

    changes[field] = data[field] === null ? null : data[field].trim() || null;
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нужно передать хотя бы одно из полей: firstName, lastName');
  }

  return changes;
}

async function getProfile(req, res) {
  const user = await findActiveUser(req.user.id);
  res.status(200).json(toProfile(user));
}

async function updateProfile(req, res) {
  const changes = validateProfileData(req.body);
  const user = await findActiveUser(req.user.id);

  await user.update(changes);
  res.status(200).json(toProfile(user));
}

async function deleteProfile(req, res) {
  const user = await findActiveUser(req.user.id);

  await user.account.update({ status: 'deleted' });
  await authService.revokeAllTokens(user.id);
  res.status(204).send();
}

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile
};
