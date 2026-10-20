'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Accounts', 'role', {
      allowNull: false,
      type: Sequelize.ENUM('user', 'admin'),
      defaultValue: 'user'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Accounts', 'role');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Accounts_role";');
  }
};
