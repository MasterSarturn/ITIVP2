const multer = require('multer');
const createHttpError = require('../utils/httpError');

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE) || 50 * 1024 * 1024;

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 }
}).single('file');

// multipart/form-data: поле file с файлом, остальные поля формы попадают в req.body
function uploadFile(req, res, next) {
  parser(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message = status === 413
        ? `Размер файла не должен превышать ${MAX_UPLOAD_SIZE} байт`
        : 'Некорректная загрузка файла: нужно передать один файл в поле file';
      return next(createHttpError(status, message));
    }

    if (error) {
      return next(error);
    }

    if (!req.file) {
      return next(createHttpError(400, 'Нужно передать файл в поле file (multipart/form-data)'));
    }

    next();
  });
}

module.exports = uploadFile;
