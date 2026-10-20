'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      orderId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      amount: { allowNull: false, type: Sequelize.DECIMAL(12, 2) },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      provider: { allowNull: false, type: Sequelize.STRING },
      externalPaymentId: { allowNull: true, type: Sequelize.STRING },
      paidAt: { allowNull: true, type: Sequelize.DATE },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('Payments', {
      fields: ['amount'],
      type: 'check',
      where: { amount: { [Sequelize.Op.gt]: 0 } },
      name: 'payments_amount_positive'
    });
    await queryInterface.addConstraint('Payments', {
      fields: ['provider', 'externalPaymentId'],
      type: 'unique',
      name: 'payments_provider_external_payment_id_unique'
    });
    await queryInterface.addIndex('Payments', ['orderId'], { name: 'payments_order_id' });
    // не более одного успешного платежа на заказ
    await queryInterface.addIndex('Payments', ['orderId'], {
      name: 'payments_order_id_completed_unique',
      unique: true,
      where: { status: 'completed' }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Payments_status";');
  }
};
