'use strict';

const crypto = require('crypto');

const categories = [
  { name: 'Books', slug: 'books', description: 'Электронные книги' },
  { name: 'Music', slug: 'music', description: 'Цифровая музыка' },
  { name: 'Software', slug: 'software', description: 'Программное обеспечение и лицензии' }
];

module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query('SELECT slug FROM "Categories"');
    const existingSlugs = new Set(existing.map((row) => row.slug));
    const now = new Date();

    const rows = categories
      .filter((category) => !existingSlugs.has(category.slug))
      .map((category) => ({ id: crypto.randomUUID(), ...category, createdAt: now, updatedAt: now }));

    if (rows.length > 0) {
      await queryInterface.bulkInsert('Categories', rows);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', {
      slug: { [Sequelize.Op.in]: categories.map((category) => category.slug) }
    });
  }
};
