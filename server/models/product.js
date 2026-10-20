'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    }
  });

  return Product;
};
