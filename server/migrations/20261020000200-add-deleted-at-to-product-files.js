'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProductFiles', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ProductFiles', 'deletedAt');
  }
};
