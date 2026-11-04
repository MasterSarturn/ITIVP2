'use strict';

// Обложка товара: ключ файла в хранилище (сам файл лежит рядом с файлами товара)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'imageKey', { allowNull: true, type: Sequelize.STRING });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Products', 'imageKey');
  }
};
