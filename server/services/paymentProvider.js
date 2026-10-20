// Абстракция платёжного провайдера. Реальный провайдер в проекте не задан, поэтому подключена заглушка mock:
// она выдаёт ID платежа, ссылку на оплату и подписывает/проверяет webhook общим секретом (HMAC-SHA256)
const crypto = require('crypto');

const MOCK_PROVIDER = 'mock';

function webhookSecret() {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAYMENT_WEBHOOK_SECRET не задан');
  }

  return 'dev-webhook-secret';
}

function sign(rawBody) {
  return crypto.createHmac('sha256', webhookSecret()).update(rawBody).digest('hex');
}

function verifySignature(rawBody, signature) {
  if (!rawBody || typeof signature !== 'string') {
    return false;
  }

  const expected = Buffer.from(sign(rawBody), 'hex');
  const actual = Buffer.from(signature, 'hex');

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Регистрирует платёж у провайдера и возвращает его внешний ID
async function createPayment() {
  return { provider: MOCK_PROVIDER, externalPaymentId: `mock_${crypto.randomUUID()}` };
}

function checkoutUrl(payment) {
  return `https://pay.mock.local/checkout/${payment.externalPaymentId}`;
}

// Возврат денег у провайдера; у заглушки нечего возвращать
async function refund() {}

module.exports = { MOCK_PROVIDER, sign, verifySignature, createPayment, checkoutUrl, refund };
