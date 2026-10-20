const cartService = require('../services/cartService');
const wishlistService = require('../services/wishlistService');
const { parseUuid, parsePage } = require('../utils/validators');

async function getCart(req, res) {
  res.status(200).json(await cartService.getCart(req.user.id));
}

async function clearCart(req, res) {
  await cartService.clearCart(req.user.id);
  res.status(204).send();
}

async function addCartItem(req, res) {
  res.status(201).json(await cartService.addItem(req.user, req.body));
}

async function removeCartItem(req, res) {
  await cartService.removeItem(req.user.id, parseUuid(req.params.productId, 'productId'));
  res.status(204).send();
}

async function getWishlist(req, res) {
  res.status(200).json(await wishlistService.list(req.user.id, parsePage(req.query.page)));
}

async function addToWishlist(req, res) {
  const { productId, created } = await wishlistService.add(req.user.id, req.body);
  res.status(created ? 201 : 200).json({ productId });
}

async function removeFromWishlist(req, res) {
  await wishlistService.remove(req.user.id, req.params.productId);
  res.status(204).send();
}

module.exports = {
  getCart,
  clearCart,
  addCartItem,
  removeCartItem,
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
