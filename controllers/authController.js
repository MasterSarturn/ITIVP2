const authService = require('../services/authService');
const createHttpError = require('../utils/httpError');

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/auth';

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

function sendTokens(res, { refreshToken, refreshExpiresAt, ...publicTokens }) {
  setRefreshCookie(res, refreshToken, refreshExpiresAt);
  res.status(200).json(publicTokens);
}

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
