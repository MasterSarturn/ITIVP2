'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProductFiles', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      productId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fileName: { allowNull: false, type: Sequelize.STRING },
      storageKey: { allowNull: false, unique: true, type: Sequelize.STRING },
      fileSize: { allowNull: false, type: Sequelize.BIGINT },
      mimeType: { allowNull: false, type: Sequelize.STRING },
      version: { allowNull: true, type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('ProductFiles', {
      fields: ['fileSize'],
      type: 'check',
      where: { fileSize: { [Sequelize.Op.gte]: 0 } },
      name: 'product_files_file_size_non_negative'
    });
    await queryInterface.addIndex('ProductFiles', ['productId'], { name: 'product_files_product_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProductFiles');
  }
};
