'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);
const models = [
  'user', 'account', 'category', 'author', 'product', 'productAuthor', 'productFile',
  'cart', 'cartItem', 'order', 'orderItem', 'payment', 'download', 'review', 'wishlistItem'
];
const db = {};

for (const name of models) {
  const model = require(`./${name}`)(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

const {
  User, Account, Category, Author, Product, ProductAuthor, ProductFile,
  Cart, CartItem, Order, OrderItem, Payment, Download, Review, WishlistItem
} = db;

// Политика ON DELETE / ON UPDATE описана в db_structure.md
const cascade = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };
const restrict = { onDelete: 'RESTRICT', onUpdate: 'CASCADE' };

User.hasOne(Account, { foreignKey: 'userId', as: 'account', ...cascade });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Product, { foreignKey: 'sellerId', as: 'products', ...restrict });
Product.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', ...restrict });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Product.belongsToMany(Author, { through: ProductAuthor, foreignKey: 'productId', otherKey: 'authorId', as: 'authors' });
Author.belongsToMany(Product, { through: ProductAuthor, foreignKey: 'authorId', otherKey: 'productId', as: 'products' });

Product.hasMany(ProductFile, { foreignKey: 'productId', as: 'files', ...restrict });
ProductFile.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', ...cascade });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', ...cascade });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems', ...cascade });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders', ...restrict });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', ...cascade });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', ...restrict });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments', ...restrict });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderItem.hasMany(Download, { foreignKey: 'orderItemId', as: 'downloads', ...restrict });
Download.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });
ProductFile.hasMany(Download, { foreignKey: 'productFileId', as: 'downloads', ...restrict });
Download.belongsTo(ProductFile, { foreignKey: 'productFileId', as: 'productFile' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', ...cascade });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', ...restrict });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.belongsToMany(Product, { through: WishlistItem, foreignKey: 'userId', otherKey: 'productId', as: 'wishlist' });
Product.belongsToMany(User, { through: WishlistItem, foreignKey: 'productId', otherKey: 'userId', as: 'wishlistedBy' });

WishlistItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
