const { OrderItem, Order } = require('../models');

// Дата создания самого раннего оплаченного заказа пользователя на товар или null, если не покупал.
// Только статус paid: после возврата (refunded) доступ закрывается
async function purchasedSince(userId, productId) {
  const items = await OrderItem.findAll({
    where: { productId },
    attributes: [],
    include: [{ model: Order, as: 'order', where: { userId, status: 'paid' }, attributes: ['createdAt'], required: true }]
  });

  if (items.length === 0) {
    return null;
  }

  return new Date(Math.min(...items.map((item) => item.order.createdAt.getTime())));
}

async function hasPurchased(userId, productId) {
  return (await purchasedSince(userId, productId)) !== null;
}

module.exports = { purchasedSince, hasPurchased };
