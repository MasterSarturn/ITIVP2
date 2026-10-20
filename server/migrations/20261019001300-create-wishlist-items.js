'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WishlistItems', {
      userId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addIndex('WishlistItems', ['productId'], { name: 'wishlist_items_product_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('WishlistItems');
  }
};
