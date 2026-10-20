'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // цена на момент покупки, не зависит от текущей Product.price
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    }
  }, {
    updatedAt: false,
    indexes: [{ unique: true, fields: ['orderId', 'productId'] }]
  });

  return OrderItem;
};
