const { OrderItem, Order, Product } = require('../models');
const { paginate, DESC } = require('../utils/pagination');

// Оплаченные позиции по товарам продавца. Данные покупателя не отдаются
async function listSales(sellerId, page) {
  const result = await paginate(OrderItem, page, {
    include: [
      { model: Product, as: 'product', where: { sellerId }, required: true, attributes: ['id', 'name'] },
      { model: Order, as: 'order', where: { status: 'paid' }, required: true, attributes: ['updatedAt'] }
    ],
    order: DESC
  });

  return {
    ...result,
    items: result.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      unitPrice: item.unitPrice,
      paidAt: item.order.updatedAt
    }))
  };
}

module.exports = { listSales };
