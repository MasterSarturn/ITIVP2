'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PromoCodes', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4 },
      code: { allowNull: false, unique: true, type: Sequelize.STRING(32) },
      type: { allowNull: false, type: Sequelize.ENUM('percent', 'fixed') },
      value: { allowNull: false, type: Sequelize.DECIMAL(12, 2) },
      minOrderAmount: { allowNull: false, type: Sequelize.DECIMAL(12, 2), defaultValue: 0 },
      maxUses: { allowNull: true, type: Sequelize.INTEGER },
      usedCount: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      expiresAt: { allowNull: true, type: Sequelize.DATE },
      isActive: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    // Код выбранного промокода хранится в корзине, применённый - в заказе (вместе со снимком кода и суммы скидки)
    await queryInterface.addColumn('Carts', 'promoCodeId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'PromoCodes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('Orders', 'promoCodeId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'PromoCodes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('Orders', 'promoCode', { type: Sequelize.STRING(32), allowNull: true });
    await queryInterface.addColumn('Orders', 'discountAmount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addIndex('Orders', ['promoCodeId'], { name: 'orders_promo_code_id' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Orders', 'orders_promo_code_id');
    await queryInterface.removeColumn('Orders', 'discountAmount');
    await queryInterface.removeColumn('Orders', 'promoCode');
    await queryInterface.removeColumn('Orders', 'promoCodeId');
    await queryInterface.removeColumn('Carts', 'promoCodeId');
    await queryInterface.dropTable('PromoCodes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PromoCodes_type";');
  }
};
