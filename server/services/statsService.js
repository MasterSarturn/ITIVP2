const { QueryTypes } = require('sequelize');
const { sequelize, Order, OrderItem, Product, User, Account } = require('../models');
const { toCents, fromCents } = require('../utils/money');
const createHttpError = require('../utils/httpError');

const PERIODS = [7, 30, 90];
const DEFAULT_DAYS = 30;
const TOP_PRODUCTS = 5;
const RECENT_ORDERS = 5;

function query(sql) {
  return sequelize.query(sql, { type: QueryTypes.SELECT });
}

// { status: count } с нулями для статусов, по которым записей нет
function countsBy(rows, key, values) {
  const result = Object.fromEntries(values.map((value) => [value, 0]));

  for (const row of rows) {
    result[row[key]] = Number(row.count);
  }

  return result;
}

// Статусы считаются по всем аккаунтам, роли только по неудалённым
function countUsers(accounts) {
  const byStatus = { active: 0, blocked: 0, deleted: 0 };
  const byRole = { user: 0, seller: 0, admin: 0 };

  for (const row of accounts) {
    byStatus[row.status] += Number(row.count);

    if (row.status !== 'deleted') {
      byRole[row.role] += Number(row.count);
    }
  }

  return { byStatus, byRole };
}

// days: окно для динамики, воронки и разбивки по категориям (7, 30 или 90)
function parseDays(days) {
  const period = days === undefined ? DEFAULT_DAYS : Number(days);

  if (!PERIODS.includes(period)) {
    throw createHttpError(400, `Параметр days должен быть одним из: ${PERIODS.join(', ')}`);
  }

  return period;
}

// created - все заказы периода; paid - оплаченные и позже возвращённые (деньги были получены)
function toFunnel(rows) {
  const counts = countsBy(rows, 'status', ['pending', 'paid', 'cancelled', 'refunded']);
  const created = counts.pending + counts.paid + counts.cancelled + counts.refunded;
  const paid = counts.paid + counts.refunded;

  return {
    created,
    paid,
    cancelled: counts.cancelled,
    refunded: counts.refunded,
    conversion: created === 0 ? 0 : Math.round((paid / created) * 1000) / 10
  };
}

async function getStats(days) {
  const period = parseDays(days);
  const since = `CURRENT_DATE - ${period - 1}`;
  const [accounts, products, orders, daily, topProducts, recentOrders, funnel, byCategory] = await Promise.all([
    query(`SELECT "status", "role", COUNT(*) AS "count" FROM "Accounts" GROUP BY "status", "role"`),
    query(`SELECT "status", COUNT(*) AS "count" FROM "Products" GROUP BY "status"`),
    query(`SELECT "status", COUNT(*) AS "count", COALESCE(SUM("totalAmount"), 0) AS "amount" FROM "Orders" GROUP BY "status"`),
    // paid-заказы считаются по дате последнего изменения, как в salesService
    query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS "date",
             COALESCE(SUM(o."totalAmount"), 0) AS "revenue",
             COUNT(o."id") AS "orders"
      FROM generate_series(${since}, CURRENT_DATE, interval '1 day') AS d(day)
      LEFT JOIN "Orders" o ON o."status" = 'paid' AND o."updatedAt"::date = d.day::date
      GROUP BY d.day
      ORDER BY d.day
    `),
    query(`
      SELECT p."id", p."name", COUNT(oi."id") AS "sales", COALESCE(SUM(oi."unitPrice"), 0) AS "revenue"
      FROM "OrderItems" oi
      JOIN "Orders" o ON o."id" = oi."orderId" AND o."status" = 'paid'
      JOIN "Products" p ON p."id" = oi."productId"
      GROUP BY p."id", p."name"
      ORDER BY SUM(oi."unitPrice") DESC, p."name"
      LIMIT ${TOP_PRODUCTS}
    `),
    Order.findAll({
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: RECENT_ORDERS,
      include: [
        { model: OrderItem, as: 'items', attributes: ['id'], include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'], include: [{ model: Account, as: 'account', attributes: ['email'] }] }
      ]
    }),
    // воронка по заказам, созданным за период (корзины после оформления очищаются, поэтому этапа «корзина» нет)
    query(`
      SELECT "status", COUNT(*) AS "count" FROM "Orders"
      WHERE "createdAt"::date >= ${since}
      GROUP BY "status"
    `),
    query(`
      SELECT c."id", c."name", COUNT(oi."id") AS "sales", COALESCE(SUM(oi."unitPrice"), 0) AS "revenue"
      FROM "OrderItems" oi
      JOIN "Orders" o ON o."id" = oi."orderId" AND o."status" = 'paid' AND o."updatedAt"::date >= ${since}
      JOIN "Products" p ON p."id" = oi."productId"
      JOIN "Categories" c ON c."id" = p."categoryId"
      GROUP BY c."id", c."name"
      ORDER BY SUM(oi."unitPrice") DESC, c."name"
    `)
  ]);

  const byStatus = (rows) => Object.fromEntries(rows.map((row) => [row.status, row]));
  const orderRows = byStatus(orders);
  const amount = (status) => fromCents(toCents(orderRows[status]?.amount ?? 0));

  return {
    users: countUsers(accounts),
    products: countsBy(products, 'status', ['draft', 'published', 'archived']),
    orders: countsBy(orders, 'status', ['pending', 'paid', 'cancelled', 'refunded']),
    revenue: amount('paid'),
    refunded: amount('refunded'),
    daily: daily.map((row) => ({
      date: row.date,
      revenue: fromCents(toCents(row.revenue)),
      orders: Number(row.orders)
    })),
    topProducts: topProducts.map((row) => ({
      id: row.id,
      name: row.name,
      sales: Number(row.sales),
      revenue: fromCents(toCents(row.revenue))
    })),
    recentOrders,
    days: period,
    funnel: toFunnel(funnel),
    byCategory: byCategory.map((row) => ({
      id: row.id,
      name: row.name,
      sales: Number(row.sales),
      revenue: fromCents(toCents(row.revenue))
    }))
  };
}

module.exports = { getStats };
