'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('Products', [
      {
        name: 'Node.js для начинающих',
        category: 'book',
        description: 'Электронная книга об основах разработки на Node.js.',
        price: 799,
        author: 'Иван Иванов',
        downloadUrl: 'https://example.com/products/nodejs-book',
        stockQuantity: 10,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Музыка для концентрации',
        category: 'music',
        description: 'Цифровой музыкальный альбом для работы и учебы.',
        price: 299,
        author: 'Digital Waves',
        downloadUrl: 'https://example.com/products/focus-music',
        stockQuantity: 25,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Редактор изображений Pro',
        category: 'software',
        description: 'Лицензия на программное обеспечение для обработки изображений.',
        price: 2490,
        author: 'Pixel Forge',
        downloadUrl: 'https://example.com/products/image-editor',
        stockQuantity: 5,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};