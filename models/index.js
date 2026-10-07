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
const db = {
  Product: require('./product')(sequelize, Sequelize.DataTypes),
  User: require('./user')(sequelize, Sequelize.DataTypes),
  Account: require('./account')(sequelize, Sequelize.DataTypes)
};

db.User.hasOne(db.Account, { foreignKey: 'userId', as: 'account' });
db.Account.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
