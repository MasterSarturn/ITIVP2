'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categories', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      name: { allowNull: false, unique: true, type: Sequelize.STRING },
      slug: { allowNull: false, unique: true, type: Sequelize.STRING },
      description: { allowNull: true, type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Categories');
  }
};
