const productFileService = require('../services/productFileService');

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

module.exports = { listFiles, uploadFile, replaceFile, deleteFile };
