const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize, Sequelize, User, Account, Product } = require('../models');
const authService = require('./authService');
const orderService = require('./orderService');
const { paginate, DESC } = require('../utils/pagination');
const {
  requireBody, parseEmail, parsePassword, parseEnum, parseOptionalEnum, parseNameChanges, likePattern
} = require('../utils/validators');
const audit = require('../utils/audit');
const createHttpError = require('../utils/httpError');

const ROLES = ['user', 'seller', 'admin'];
const MANAGED_STATUSES = ['active', 'blocked'];
const ALL_STATUSES = ['active', 'blocked', 'deleted'];

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
    role: user.account.role,
    status: user.account.status,
    lastLoginAt: user.account.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// ---------- Собственный профиль ----------

async function updateProfile(userId, body) {
  const changes = parseNameChanges(body);
  const user = await findActiveUser(userId);

  await user.update(changes);
  return toProfile(user);
}

async function verifyCurrentPassword(userId, currentPassword) {
  const account = await Account.scope('withPassword').findOne({ where: { userId } });

  if (!account || account.status === 'deleted') {
    throw createHttpError(404, 'Профиль не найден');
  }

  if (typeof currentPassword !== 'string' || !await bcrypt.compare(currentPassword, account.passwordHash)) {
    throw createHttpError(403, 'Неверный текущий пароль');
  }

  return account;
}

// После смены пароля все токены отзываются, выдаётся новая пара
async function changePassword(userId, body) {
  requireBody(body);

  const newPassword = parsePassword(body.newPassword, 'Новый пароль');
  const account = await verifyCurrentPassword(userId, body.currentPassword);

  await account.update({ passwordHash: await bcrypt.hash(newPassword, authService.BCRYPT_SALT_ROUNDS) });
  await authService.revokeAllTokens(userId);

  return authService.issueTokens(account);
}

// Email лежит в JWT, поэтому токены отзываются и выдаются заново. Подтверждения по почте нет: почтового сервиса в проекте нет
async function changeEmail(userId, body) {
  requireBody(body);

  const email = parseEmail(body.email);
  const account = await verifyCurrentPassword(userId, body.currentPassword);

  if (await Account.findOne({ where: { email, userId: { [Op.ne]: userId } } })) {
    throw createHttpError(409, 'Пользователь с таким email уже существует');
  }

  try {
    await account.update({ email });
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Пользователь с таким email уже существует');
    }

    throw error;
  }

  await authService.revokeAllTokens(userId);
  return authService.issueTokens(account);
}

// ---------- Удаление ----------

// Нельзя оставить систему без активного администратора
async function assertAnotherAdminRemains(account) {
  if (account.role !== 'admin' || account.status !== 'active') {
    return;
  }

  const others = await Account.count({ where: { role: 'admin', status: 'active', userId: { [Op.ne]: account.userId } } });

  if (others === 0) {
    throw createHttpError(409, 'Нельзя оставить систему без активного администратора');
  }
}

// Мягкое удаление: товары архивируются, незавершённые заказы отменяются, токены отзываются
async function deleteAccount(userId) {
  const account = await Account.findOne({ where: { userId } });

  if (!account || account.status === 'deleted') {
    throw createHttpError(404, 'Профиль не найден');
  }

  await assertAnotherAdminRemains(account);

  await sequelize.transaction(async (transaction) => {
    await account.update({ status: 'deleted' }, { transaction });
    await Product.update(
      { status: 'archived' },
      { where: { sellerId: userId, status: { [Op.ne]: 'archived' } }, transaction }
    );
    await orderService.cancelPendingOrders(userId, transaction);
  });

  await authService.revokeAllTokens(userId);
}

// ---------- Администрирование пользователей ----------

function toAdminUser(user) {
  return { ...toProfile(user), failedLoginAttempts: user.account.failedLoginAttempts, lockUntil: user.account.lockUntil };
}

async function listUsers({ page, status, role, q }) {
  const conditions = [];
  const parsedStatus = parseOptionalEnum(status, ALL_STATUSES, 'status');
  const parsedRole = parseOptionalEnum(role, ROLES, 'role');

  if (parsedStatus !== undefined) {
    conditions.push({ '$account.status$': parsedStatus });
  }

  if (parsedRole !== undefined) {
    conditions.push({ '$account.role$': parsedRole });
  }

  if (typeof q === 'string' && q.trim() !== '') {
    const pattern = likePattern(q.trim());

    conditions.push({
      [Op.or]: [
        { firstName: { [Op.iLike]: pattern } },
        { lastName: { [Op.iLike]: pattern } },
        { '$account.email$': { [Op.iLike]: pattern } }
      ]
    });
  }

  const result = await paginate(User, page, {
    where: { [Op.and]: conditions },
    include: [{ model: Account, as: 'account', required: true }],
    subQuery: false,
    order: DESC
  });

  return { ...result, items: result.items.map(toAdminUser) };
}

async function findUser(userId) {
  const user = await User.findByPk(userId, { include: 'account' });

  if (!user || !user.account) {
    throw createHttpError(404, 'Пользователь не найден');
  }

  return user;
}

async function getUser(userId) {
  return toAdminUser(await findUser(userId));
}

function assertNotSelf(admin, userId, action) {
  if (admin.id === userId) {
    throw createHttpError(409, `Администратор не может ${action} самому себе`);
  }
}

function assertNotDeleted(user) {
  if (user.account.status === 'deleted') {
    throw createHttpError(409, 'Аккаунт удалён, его нельзя изменить');
  }
}

async function updateUser(userId, body) {
  const changes = parseNameChanges(body);
  const user = await findUser(userId);

  assertNotDeleted(user);
  await user.update(changes);

  return toAdminUser(user);
}

async function setStatus(admin, userId, body) {
  requireBody(body);

  const status = parseEnum(body.status, MANAGED_STATUSES, 'status');
  assertNotSelf(admin, userId, 'менять статус');

  const user = await findUser(userId);
  assertNotDeleted(user);

  if (user.account.status === status) {
    throw createHttpError(409, `Аккаунт уже в статусе ${status}`);
  }

  if (status === 'blocked') {
    await assertAnotherAdminRemains(user.account);
  }

  await user.account.update({ status });

  // без отзыва токенов заблокированный пользователь работал бы до истечения access-токена
  if (status === 'blocked') {
    await authService.revokeAllTokens(userId);
  }

  audit(admin, 'user.status', { userId, status });
  return toAdminUser(user);
}

async function setRole(admin, userId, body) {
  requireBody(body);

  const role = parseEnum(body.role, ROLES, 'role');
  assertNotSelf(admin, userId, 'менять роль');

  const user = await findUser(userId);
  assertNotDeleted(user);

  if (user.account.role === role) {
    throw createHttpError(409, `У пользователя уже роль ${role}`);
  }

  if (user.account.role === 'admin') {
    await assertAnotherAdminRemains(user.account);
  }

  await user.account.update({ role });
  // роль лежит в JWT: старые токены с прежней ролью отзываются
  await authService.revokeAllTokens(userId);

  audit(admin, 'user.role', { userId, role });
  return toAdminUser(user);
}

async function deleteUser(admin, userId) {
  assertNotSelf(admin, userId, 'удалить');

  const user = await findUser(userId);

  if (user.account.status === 'deleted') {
    throw createHttpError(409, 'Аккаунт уже удалён');
  }

  await deleteAccount(userId);
  audit(admin, 'user.delete', { userId });
}

module.exports = {
  findActiveUser,
  toProfile,
  updateProfile,
  changePassword,
  changeEmail,
  deleteAccount,
  listUsers,
  getUser,
  updateUser,
  setStatus,
  setRole,
  deleteUser
};
