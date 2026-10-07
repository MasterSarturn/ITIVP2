const createHttpError = require('../utils/httpError');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(createHttpError(403, 'Доступно только администратору'));
  }

  next();
}

module.exports = requireAdmin;
