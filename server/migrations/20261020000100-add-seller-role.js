'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Accounts_role" ADD VALUE IF NOT EXISTS 'seller' AFTER 'user';`
    );
  },

  // Значение нельзя просто удалить из ENUM: тип пересоздаётся, продавцы становятся обычными пользователями
  async down(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(`UPDATE "Accounts" SET "role" = 'user' WHERE "role" = 'seller';`, { transaction });
      await sequelize.query('ALTER TABLE "Accounts" ALTER COLUMN "role" DROP DEFAULT;', { transaction });
      await sequelize.query('ALTER TYPE "enum_Accounts_role" RENAME TO "enum_Accounts_role_old";', { transaction });
      await sequelize.query(`CREATE TYPE "enum_Accounts_role" AS ENUM ('user', 'admin');`, { transaction });
      await sequelize.query(
        'ALTER TABLE "Accounts" ALTER COLUMN "role" TYPE "enum_Accounts_role" USING "role"::text::"enum_Accounts_role";',
        { transaction }
      );
      await sequelize.query(`ALTER TABLE "Accounts" ALTER COLUMN "role" SET DEFAULT 'user';`, { transaction });
      await sequelize.query('DROP TYPE "enum_Accounts_role_old";', { transaction });
    });
  }
};
