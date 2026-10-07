'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Accounts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        allowNull: false,
        unique: true,
        type: Sequelize.UUID,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      email: { allowNull: false, unique: true, type: Sequelize.STRING },
      passwordHash: { allowNull: false, type: Sequelize.STRING },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('active', 'blocked', 'deleted'),
        defaultValue: 'active'
      },
      lastLoginAt: { allowNull: true, type: Sequelize.DATE },
      failedLoginAttempts: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lockUntil: { allowNull: true, type: Sequelize.DATE },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Accounts');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Accounts_status";');
  }
};
