'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductAuthors', {
      productId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      authorId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        references: { model: 'Authors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      }
    });

    await queryInterface.addIndex('ProductAuthors', ['authorId'], { name: 'product_authors_author_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProductAuthors');
  }
};
