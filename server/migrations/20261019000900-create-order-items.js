'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('OrderItems', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      orderId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      unitPrice: { allowNull: false, type: Sequelize.DECIMAL(10, 2) },
      createdAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('OrderItems', {
      fields: ['unitPrice'],
      type: 'check',
      where: { unitPrice: { [Sequelize.Op.gte]: 0 } },
      name: 'order_items_unit_price_non_negative'
    });
    await queryInterface.addConstraint('OrderItems', {
      fields: ['orderId', 'productId'],
      type: 'unique',
      name: 'order_items_order_id_product_id_unique'
    });
    await queryInterface.addIndex('OrderItems', ['productId'], { name: 'order_items_product_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OrderItems');
  }
};
