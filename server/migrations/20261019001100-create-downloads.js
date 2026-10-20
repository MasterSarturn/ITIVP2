'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Downloads', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      orderItemId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'OrderItems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      productFileId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'ProductFiles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      downloadedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      ipAddress: { allowNull: true, type: Sequelize.STRING(45) }
    });

    await queryInterface.addIndex('Downloads', ['orderItemId'], { name: 'downloads_order_item_id' });
    await queryInterface.addIndex('Downloads', ['productFileId'], { name: 'downloads_product_file_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Downloads');
  }
};
