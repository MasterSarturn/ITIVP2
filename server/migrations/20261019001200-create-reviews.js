'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reviews', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: { model: 'Products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      rating: { allowNull: false, type: Sequelize.INTEGER },
      text: { allowNull: true, type: Sequelize.TEXT },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addConstraint('Reviews', {
      fields: ['rating'],
      type: 'check',
      where: { rating: { [Sequelize.Op.between]: [1, 5] } },
      name: 'reviews_rating_range'
    });
    await queryInterface.addConstraint('Reviews', {
      fields: ['userId', 'productId'],
      type: 'unique',
      name: 'reviews_user_id_product_id_unique'
    });
    await queryInterface.addIndex('Reviews', ['productId'], { name: 'reviews_product_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Reviews');
  }
};
