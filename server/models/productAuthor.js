'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductAuthor = sequelize.define('ProductAuthor', {
    productId: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    authorId: {
      type: DataTypes.UUID,
      primaryKey: true
    }
  }, {
    timestamps: false
  });

  return ProductAuthor;
};
