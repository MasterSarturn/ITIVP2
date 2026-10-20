const downloadService = require('../services/downloadService');
const { parsePage } = require('../utils/validators');

async function requestDownload(req, res) {
  res.status(201).json(await downloadService.requestDownload(req.user, req.body, req.ip));
}

async function getContent(req, res) {
  const { stream, size, fileName, mimeType } = await downloadService.openContent(req.user, req.params.id);

  res.set({
    'Content-Type': mimeType,
    'Content-Length': size,
    'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(fileName),
    'Cache-Control': 'private, no-store'
  });

  stream.on('error', (error) => res.destroy(error));
  stream.pipe(res);
}

async function listDownloads(req, res) {
  res.status(200).json(await downloadService.listOwn(req.user.id, parsePage(req.query.page)));
}

module.exports = { requestDownload, getContent, listDownloads };
