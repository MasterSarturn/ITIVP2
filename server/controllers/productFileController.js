const productFileService = require('../services/productFileService');
const productImageService = require('../services/productImageService');

async function listFiles(req, res) {
  res.status(200).json(await productFileService.listFiles(req.user, req.params.productId));
}

async function uploadFile(req, res) {
  res.status(201).json(await productFileService.uploadFile(req.user, req.params.productId, req.file, req.body));
}

async function replaceFile(req, res) {
  const { productId, fileId } = req.params;
  res.status(201).json(await productFileService.replaceFile(req.user, productId, fileId, req.file, req.body));
}

async function deleteFile(req, res) {
  await productFileService.deleteFile(req.user, req.params.productId, req.params.fileId);
  res.status(204).send();
}

async function setImage(req, res) {
  res.status(200).json(await productImageService.setImage(req.user, req.params.productId, req.file));
}

async function deleteImage(req, res) {
  await productImageService.removeImage(req.user, req.params.productId);
  res.status(204).send();
}

async function getImage(req, res) {
  const { stream, size, mimeType } = await productImageService.getImage(req.params.productId, req.user);
  res.set({
    'Content-Type': mimeType,
    'Content-Length': size,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff'
  });
  stream.pipe(res);
}

module.exports = { listFiles, uploadFile, replaceFile, deleteFile, setImage, deleteImage, getImage };
