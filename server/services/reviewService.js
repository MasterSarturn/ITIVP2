const { Sequelize, Review, User, Product } = require('../models');
const productService = require('./productService');
const { hasPurchased } = require('./accessService');
const { paginate, DESC } = require('../utils/pagination');
const { requireBody, parseOptionalString } = require('../utils/validators');
const audit = require('../utils/audit');
const createHttpError = require('../utils/httpError');

const reviewInclude = [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }];

function parseRating(value) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw createHttpError(400, 'rating должен быть целым числом от 1 до 5');
  }

  return value;
}

// Отзывы скрытого товара видят только владелец и Admin: это проверяет findVisibleProduct
async function listReviews(viewer, productId, page) {
  await productService.findVisibleProduct(productId, viewer);
  return paginate(Review, page, { where: { productId }, include: reviewInclude, order: DESC });
}

async function createReview(user, productId, body) {
  requireBody(body);

  const rating = parseRating(body.rating);
  const text = parseOptionalString(body.text, 'text', 10000);
  const product = await Product.findByPk(productId);

  if (!product) {
    throw createHttpError(404, 'Товар не найден');
  }

  if (product.sellerId === user.id) {
    throw createHttpError(409, 'Нельзя оставить отзыв на собственный товар');
  }

  if (!await hasPurchased(user.id, productId)) {
    throw createHttpError(403, 'Отзыв можно оставить только на купленный товар');
  }

  try {
    const review = await Review.create({ userId: user.id, productId, rating, text: text ?? null });
    return Review.findByPk(review.id, { include: reviewInclude });
  } catch (error) {
    if (error instanceof Sequelize.UniqueConstraintError) {
      throw createHttpError(409, 'Вы уже оставили отзыв на этот товар');
    }

    throw error;
  }
}

// Редактировать можно только собственный отзыв, в том числе Admin
async function updateReview(user, id, body) {
  requireBody(body);

  const review = await Review.findByPk(id);

  if (!review) {
    throw createHttpError(404, 'Отзыв не найден');
  }

  if (review.userId !== user.id) {
    throw createHttpError(403, 'Можно редактировать только собственный отзыв');
  }

  const changes = {};

  if (body.rating !== undefined) {
    changes.rating = parseRating(body.rating);
  }

  const text = parseOptionalString(body.text, 'text', 10000);

  if (text !== undefined) {
    changes.text = text;
  }

  if (Object.keys(changes).length === 0) {
    throw createHttpError(400, 'Нужно передать rating и/или text');
  }

  await review.update(changes);
  return Review.findByPk(id, { include: reviewInclude });
}

async function deleteReview(user, id) {
  const review = await Review.findByPk(id);

  if (!review) {
    throw createHttpError(404, 'Отзыв не найден');
  }

  if (review.userId !== user.id) {
    if (user.role !== 'admin') {
      throw createHttpError(403, 'Можно удалить только собственный отзыв');
    }

    audit(user, 'review.delete', { reviewId: id, authorId: review.userId });
  }

  await review.destroy();
}

module.exports = { listReviews, createReview, updateReview, deleteReview };
