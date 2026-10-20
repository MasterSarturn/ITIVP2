'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

module.exports = {
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('Задайте ADMIN_EMAIL и ADMIN_PASSWORD в .env');
    }

    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM "Accounts" WHERE email = :email',
      { replacements: { email } }
    );

    if (existing.length > 0) {
      return;
    }

    const now = new Date();
    const userId = crypto.randomUUID();

    await queryInterface.bulkInsert('Users', [
      { id: userId, firstName: 'Admin', lastName: null, createdAt: now, updatedAt: now }
    ]);
    await queryInterface.bulkInsert('Accounts', [{
      id: crypto.randomUUID(),
      userId,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now
    }]);
  },

  async down(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

    await queryInterface.sequelize.query(
      'DELETE FROM "Users" WHERE id IN (SELECT "userId" FROM "Accounts" WHERE email = :email AND role = \'admin\')',
      { replacements: { email } }
    );
  }
};
