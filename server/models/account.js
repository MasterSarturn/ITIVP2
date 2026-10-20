'use strict';

module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'deleted'),
      allowNull: false,
      defaultValue: 'active'
    },
    role: {
      type: DataTypes.ENUM('user', 'seller', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    defaultScope: {
      attributes: { exclude: ['passwordHash'] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ['passwordHash'] }
      }
    }
  });

  return Account;
};
