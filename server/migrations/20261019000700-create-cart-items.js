'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CartItems', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      cartId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Carts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('CartItems', {
      fields: ['cartId', 'productId'],
      type: 'unique',
      name: 'cart_items_cart_id_product_id_unique'
    });
    await queryInterface.addIndex('CartItems', ['productId'], { name: 'cart_items_product_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CartItems');
  }
};
