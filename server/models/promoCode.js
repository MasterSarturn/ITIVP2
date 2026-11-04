'use strict';

module.exports = (sequelize, DataTypes) => {
  const PromoCode = sequelize.define('PromoCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // хранится в верхнем регистре
    code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('percent', 'fixed'),
      allowNull: false
    },
    // процент (1-100) или сумма в BYN; DECIMAL приходит строкой
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    // null - без ограничения
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1 }
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  });

  return PromoCode;
};
