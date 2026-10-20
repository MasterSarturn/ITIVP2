'use strict';

module.exports = (sequelize, DataTypes) => {
  const WishlistItem = sequelize.define('WishlistItem', {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  }, {
    updatedAt: false
  });

  return WishlistItem;
};
