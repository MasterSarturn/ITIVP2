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

module.exports = { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie, sendTokens };
