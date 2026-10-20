'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'paid', 'cancelled', 'refunded'),
        defaultValue: 'pending'
      },
      totalAmount: { allowNull: false, type: Sequelize.DECIMAL(12, 2) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('Orders', {
      fields: ['totalAmount'],
      type: 'check',
      where: { totalAmount: { [Sequelize.Op.gte]: 0 } },
      name: 'orders_total_amount_non_negative'
    });
    await queryInterface.addIndex('Orders', ['userId', 'createdAt'], { name: 'orders_user_id_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_status";');
  }
};
