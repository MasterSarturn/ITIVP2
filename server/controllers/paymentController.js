const paymentService = require('../services/paymentService');

async function webhook(req, res) {
  const payment = await paymentService.handleWebhook(req.rawBody, req.get('x-signature'), req.body);
  res.status(200).json({ id: payment.id, status: payment.status });
}

async function simulate(req, res) {
  res.status(200).json(await paymentService.simulateResult(req.user, req.params.id, req.body));
}

module.exports = { webhook, simulate };
