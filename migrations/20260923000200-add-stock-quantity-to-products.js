'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'stockQuantity', {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER
    });

    await queryInterface.addConstraint('Products', {
      fields: ['stockQuantity'],
      type: 'check',
      where: { stockQuantity: { [Sequelize.Op.gte]: 0 } },
      name: 'products_stock_quantity_non_negative'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('Products', 'products_stock_quantity_non_negative');
    await queryInterface.removeColumn('Products', 'stockQuantity');
  }
};