const accountService = require('../services/accountService');
const { sendTokens, clearRefreshCookie } = require('../utils/authCookies');

async function getProfile(req, res) {
  res.status(200).json(accountService.toProfile(await accountService.findActiveUser(req.user.id)));
}

async function updateProfile(req, res) {
  res.status(200).json(await accountService.updateProfile(req.user.id, req.body));
}

async function changePassword(req, res) {
  sendTokens(res, await accountService.changePassword(req.user.id, req.body));
}

async function changeEmail(req, res) {
  sendTokens(res, await accountService.changeEmail(req.user.id, req.body));
}

async function deleteProfile(req, res) {
  await accountService.deleteAccount(req.user.id);
  clearRefreshCookie(res);
  res.status(204).send();
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  deleteProfile
};
