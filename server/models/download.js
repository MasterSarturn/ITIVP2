'use strict';

module.exports = (sequelize, DataTypes) => {
  const Download = sequelize.define('Download', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderItemId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    productFileId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    downloadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // 45 символов — максимум для IPv6
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    timestamps: false
  });

  return Download;
};
