'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: { allowNull: false, type: Sequelize.STRING },
      category: {
        allowNull: false,
        type: Sequelize.ENUM('book', 'music', 'software')
      },
      description: { allowNull: false, type: Sequelize.TEXT },
      price: { allowNull: false, type: Sequelize.DECIMAL(10, 2) },
      author: { allowNull: false, type: Sequelize.STRING },
      downloadUrl: { allowNull: false, type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('Products', {
      fields: ['price'],
      type: 'check',
      where: { price: { [Sequelize.Op.gte]: 0 } },
      name: 'products_price_non_negative'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Products');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Products_category";');
  }
};