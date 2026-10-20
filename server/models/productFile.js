'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductFile = sequelize.define('ProductFile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    storageKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // BIGINT Sequelize возвращает строкой
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: { min: 0 }
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // мягкое удаление: на файл ссылаются Download, а покупатели сохраняют доступ
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return ProductFile;
};
