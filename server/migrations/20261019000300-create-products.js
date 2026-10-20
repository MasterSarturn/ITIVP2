'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      sellerId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      categoryId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: { allowNull: false, type: Sequelize.STRING },
      description: { allowNull: false, type: Sequelize.TEXT },
      price: { allowNull: false, type: Sequelize.DECIMAL(10, 2) },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('Products', {
      fields: ['price'],
      type: 'check',
      where: { price: { [Sequelize.Op.gte]: 0 } },
      name: 'products_price_non_negative'
    });
    await queryInterface.addIndex('Products', ['sellerId'], { name: 'products_seller_id' });
    await queryInterface.addIndex('Products', ['categoryId'], { name: 'products_category_id' });
    await queryInterface.addIndex('Products', ['status', 'createdAt'], { name: 'products_status_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Products');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Products_status";');
  }
};
