const multer = require('multer');
const createHttpError = require('../utils/httpError');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 }
}).single('image');

// multipart/form-data: поле image с картинкой до 5 МБ
function uploadImage(req, res, next) {
  parser(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(error.code === 'LIMIT_FILE_SIZE'
        ? createHttpError(413, 'Размер изображения не должен превышать 5 МБ')
        : createHttpError(400, 'Нужно передать одно изображение в поле image'));
    }

    if (error) {
      return next(error);
    }

    if (!req.file) {
      return next(createHttpError(400, 'Нужно передать изображение в поле image (multipart/form-data)'));
    }

    next();
  });
}

module.exports = uploadImage;
