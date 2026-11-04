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
    },
    // Ключ в хранилище наружу не отдаётся ни в каком JSON, в том числе у вложенных моделей:
    // геттер скрывает его, читать его можно только через getDataValue('imageKey')
    imageKey: {
      type: DataTypes.STRING,
      allowNull: true,
      get() {
        return undefined;
      }
    },
    imageUrl: {
      type: DataTypes.VIRTUAL,
      get() {
        const key = this.getDataValue('imageKey');
        // имя файла (uuid) меняется при каждой загрузке и служит версией для кэша браузера
        return key ? `/api/products/${this.getDataValue('id')}/image?v=${key.split('/').pop().split('.')[0]}` : null;
      }
    }
  });

  return Product;
};
