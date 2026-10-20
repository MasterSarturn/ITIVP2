'use strict';

module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    updatedAt: false,
    indexes: [{ unique: true, fields: ['cartId', 'productId'] }]
  });

  return CartItem;
};
