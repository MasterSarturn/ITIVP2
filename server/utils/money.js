// Деньги считаем в копейках, чтобы не копить ошибки округления; DECIMAL приходит строкой
function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(cents) {
  return (cents / 100).toFixed(2);
}

module.exports = { toCents, fromCents };
