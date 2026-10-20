const createHttpError = require('../utils/httpError');

function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!roles.includes(req.user?.role)) {
      return next(createHttpError(403, 'Недостаточно прав для этого действия'));
    }

    next();
  };
}

module.exports = requireRole;
