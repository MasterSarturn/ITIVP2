const { QueryTypes } = require('sequelize');
const { sequelize, OrderItem, Order, Product } = require('../models');
const { paginate, DESC } = require('../utils/pagination');
const { parseUuid } = require('../utils/validators');
const { toCents, fromCents } = require('../utils/money');
const createHttpError = require('../utils/httpError');

const PERIODS = [7, 30, 90];
const TOP_PRODUCTS = 5;

// Оплаченные позиции по товарам продавца. Данные покупателя не отдаются
async function listSales(sellerId, page, { productId } = {}) {
  const productWhere = { sellerId };

  if (productId !== undefined) {
    productWhere.id = parseUuid(productId, 'productId');
  }

  const result = await paginate(OrderItem, page, {
    include: [
      { model: Product, as: 'product', where: productWhere, required: true, attributes: ['id', 'name'] },
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

// Сводка продавца: считаются только оплаченные заказы, дата - по updatedAt, как в listSales
async function getStats(sellerId, days) {
  const period = days === undefined ? 30 : Number(days);

  if (!PERIODS.includes(period)) {
    throw createHttpError(400, `Параметр days должен быть одним из: ${PERIODS.join(', ')}`);
  }

  const query = (sql) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { sellerId } });

  const [totals, daily, top, products] = await Promise.all([
    query(`
      SELECT COUNT(oi."id") AS "sales", COALESCE(SUM(oi."unitPrice"), 0) AS "revenue"
      FROM "OrderItems" oi
      JOIN "Orders" o ON o."id" = oi."orderId" AND o."status" = 'paid'
      JOIN "Products" p ON p."id" = oi."productId" AND p."sellerId" = :sellerId
    `),
    query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS "date",
             COUNT(x."id") AS "sales",
             COALESCE(SUM(x."unitPrice"), 0) AS "revenue"
      FROM generate_series(CURRENT_DATE - ${period - 1}, CURRENT_DATE, interval '1 day') AS d(day)
      LEFT JOIN (
        SELECT oi."id", oi."unitPrice", o."updatedAt"::date AS "day"
        FROM "OrderItems" oi
        JOIN "Orders" o ON o."id" = oi."orderId" AND o."status" = 'paid'
        JOIN "Products" p ON p."id" = oi."productId" AND p."sellerId" = :sellerId
      ) x ON x."day" = d.day::date
      GROUP BY d.day
      ORDER BY d.day
    `),
    query(`
      SELECT p."id", p."name", COUNT(oi."id") AS "sales", COALESCE(SUM(oi."unitPrice"), 0) AS "revenue"
      FROM "OrderItems" oi
      JOIN "Orders" o ON o."id" = oi."orderId" AND o."status" = 'paid'
      JOIN "Products" p ON p."id" = oi."productId" AND p."sellerId" = :sellerId
      GROUP BY p."id", p."name"
      ORDER BY SUM(oi."unitPrice") DESC, p."name"
      LIMIT ${TOP_PRODUCTS}
    `),
    query(`SELECT "status", COUNT(*) AS "count" FROM "Products" WHERE "sellerId" = :sellerId GROUP BY "status"`)
  ]);

  const productCounts = { draft: 0, published: 0, archived: 0 };

  for (const row of products) {
    productCounts[row.status] = Number(row.count);
  }

  return {
    days: period,
    sales: Number(totals[0].sales),
    revenue: fromCents(toCents(totals[0].revenue)),
    products: productCounts,
    daily: daily.map((row) => ({
      date: row.date,
      sales: Number(row.sales),
      revenue: fromCents(toCents(row.revenue))
    })),
    topProducts: top.map((row) => ({
      id: row.id,
      name: row.name,
      sales: Number(row.sales),
      revenue: fromCents(toCents(row.revenue))
    }))
  };
}

module.exports = { listSales, getStats };
