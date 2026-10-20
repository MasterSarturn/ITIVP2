'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0.01 }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    externalPaymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return Payment;
};
