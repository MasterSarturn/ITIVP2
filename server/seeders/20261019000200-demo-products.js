'use strict';

const crypto = require('crypto');
require('dotenv').config();

const demoProducts = [
  {
    name: 'Node.js для начинающих',
    categorySlug: 'books',
    description: 'Электронная книга об основах разработки на Node.js.',
    price: 799,
    author: 'Иван Иванов',
    file: { fileName: 'nodejs-for-beginners.pdf', mimeType: 'application/pdf', fileSize: 4194304 }
  },
  {
    name: 'Музыка для концентрации',
    categorySlug: 'music',
    description: 'Цифровой музыкальный альбом для работы и учебы.',
    price: 299,
    author: 'Digital Waves',
    file: { fileName: 'focus-music.zip', mimeType: 'application/zip', fileSize: 73400320 }
  },
  {
    name: 'Редактор изображений Pro',
    categorySlug: 'software',
    description: 'Лицензия на программное обеспечение для обработки изображений.',
    price: 2490,
    author: 'Pixel Forge',
    file: { fileName: 'image-editor-pro.zip', mimeType: 'application/zip', fileSize: 157286400 }
  }
];

module.exports = {
  // Товары принадлежат администратору, поэтому сидер должен идти после admin-user
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const [admins] = await queryInterface.sequelize.query(
      'SELECT "userId" FROM "Accounts" WHERE email = :email',
      { replacements: { email } }
    );

    if (admins.length === 0) {
      throw new Error('Администратор не найден: сначала выполните сидер admin-user');
    }

    const sellerId = admins[0].userId;
    const [categories] = await queryInterface.sequelize.query('SELECT id, slug FROM "Categories"');
    const categoryIds = new Map(categories.map((row) => [row.slug, row.id]));
    const now = new Date();

    for (const item of demoProducts) {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM "Products" WHERE name = :name AND "sellerId" = :sellerId',
        { replacements: { name: item.name, sellerId } }
      );

      if (existing.length > 0) {
        continue;
      }

      const categoryId = categoryIds.get(item.categorySlug);

      if (!categoryId) {
        throw new Error(`Категория ${item.categorySlug} не найдена: сначала выполните сидер categories`);
      }

      const productId = crypto.randomUUID();
      const authorId = crypto.randomUUID();

      await queryInterface.bulkInsert('Products', [{
        id: productId,
        sellerId,
        categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        status: 'published',
        createdAt: now,
        updatedAt: now
      }]);
      await queryInterface.bulkInsert('Authors', [{
        id: authorId,
        name: item.author,
        description: null,
        createdAt: now,
        updatedAt: now
      }]);
      await queryInterface.bulkInsert('ProductAuthors', [{ productId, authorId }]);
      await queryInterface.bulkInsert('ProductFiles', [{
        id: crypto.randomUUID(),
        productId,
        fileName: item.file.fileName,
        storageKey: `products/${productId}/v1/${item.file.fileName}`,
        fileSize: item.file.fileSize,
        mimeType: item.file.mimeType,
        version: '1.0',
        createdAt: now,
        updatedAt: now
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    const names = demoProducts.map((item) => item.name);
    const authors = demoProducts.map((item) => item.author);
    const [products] = await queryInterface.sequelize.query(
      'SELECT id FROM "Products" WHERE name IN (:names)',
      { replacements: { names } }
    );
    const productIds = products.map((row) => row.id);

    if (productIds.length > 0) {
      await queryInterface.bulkDelete('ProductFiles', { productId: { [Sequelize.Op.in]: productIds } });
      await queryInterface.bulkDelete('ProductAuthors', { productId: { [Sequelize.Op.in]: productIds } });
      await queryInterface.bulkDelete('Products', { id: { [Sequelize.Op.in]: productIds } });
    }

    await queryInterface.bulkDelete('Authors', { name: { [Sequelize.Op.in]: authors } });
  }
};
