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
    }
  });

  return Order;
};
