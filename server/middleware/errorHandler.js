function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const message = status === 500 ? 'Внутренняя ошибка сервера' : error.message;

  res.status(status).json({ error: message });
}

module.exports = errorHandler;