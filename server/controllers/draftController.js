const draftService = require('../services/draftService');
const { parsePage } = require('../utils/validators');

async function listDrafts(req, res) {
  const { tag, q } = req.query;
  res.status(200).json(await draftService.listDrafts(req.user, { page: parsePage(req.query.page), tag, q }));
}

async function createDraft(req, res) {
  res.status(201).json(await draftService.createDraft(req.user, req.body));
}

async function updateDraft(req, res) {
  res.status(200).json(await draftService.updateDraft(req.user, req.params.id, req.body));
}

async function deleteDraft(req, res) {
  await draftService.deleteDraft(req.user, req.params.id);
  res.status(204).send();
}

module.exports = { listDrafts, createDraft, updateDraft, deleteDraft };
