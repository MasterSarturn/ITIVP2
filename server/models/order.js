'use strict';

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    // DECIMAL Sequelize возвращает строкой
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    // итог к оплате = сумма позиций - discountAmount; код хранится снимком, ссылка может обнулиться
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    promoCodeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    promoCode: {
      type: DataTypes.STRING(32),
      allowNull: true
    }
  });

  return Order;
};
