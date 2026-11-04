// Чистые правила промокодов без доступа к БД: ими пользуются корзина, заказ и админка
const { toCents, fromCents } = require('./money');

// Скидка в копейках: процент округляется до копейки, фиксированная не превышает сумму заказа
function computeDiscountCents(promo, subtotalCents) {
  const raw = promo.type === 'percent'
    ? Math.round((subtotalCents * Number(promo.value)) / 100)
    : toCents(promo.value);

  return Math.min(Math.max(raw, 0), subtotalCents);
}

// Возвращает { discountCents, problem }: при problem скидка нулевая, а текст можно показать пользователю
function evaluatePromo(promo, subtotalCents, now = new Date()) {
  let problem = null;

  if (!promo.isActive) {
    problem = 'Промокод отключён';
  } else if (promo.expiresAt && new Date(promo.expiresAt) <= now) {
    problem = 'Срок действия промокода истёк';
  } else if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    problem = 'Промокод исчерпан';
  } else if (subtotalCents <= 0) {
    problem = 'Промокод нельзя применить к бесплатному заказу';
  } else if (subtotalCents < toCents(promo.minOrderAmount)) {
    problem = `Промокод действует для заказов от ${fromCents(toCents(promo.minOrderAmount))} BYN`;
  }

  return { discountCents: problem ? 0 : computeDiscountCents(promo, subtotalCents), problem };
}

function describePromo(promo) {
  return { id: promo.id, code: promo.code, type: promo.type, value: promo.value };
}

module.exports = { computeDiscountCents, evaluatePromo, describePromo };
