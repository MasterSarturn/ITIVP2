const authService = require('../services/authService');
const createHttpError = require('../utils/httpError');
const { REFRESH_COOKIE, clearRefreshCookie, sendTokens } = require('../utils/authCookies');

async function register(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json(user);
}

async function login(req, res) {
  sendTokens(res, await authService.login(req.body));
}

async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];

  if (!token) {
    throw createHttpError(401, 'Refresh-токен не передан');
  }

  try {
    sendTokens(res, await authService.refresh(token));
  } catch (error) {
    if (error.status === 401) {
      clearRefreshCookie(res);
    }

    throw error;
  }
}

async function logout(req, res) {
  await authService.logout(req.user.id, req.token, req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).send();
}

module.exports = {
  register,
  login,
  refresh,
  logout
};
