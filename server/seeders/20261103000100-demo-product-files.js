'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROOT = path.resolve(process.env.STORAGE_DIR || './storage');
const DEMO_NAMES = ['Node.js для начинающих', 'Музыка для концентрации', 'Редактор изображений Pro'];

// Небольшое тело файла-заглушки: настоящий PDF для .pdf, иначе текст
function placeholderBody(fileName, productName) {
  if (fileName.endsWith('.pdf')) {
    return Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
      'trailer<</Root 1 0 R>>\n%%EOF\n'
    );
  }

  return Buffer.from(`Демонстрационный файл товара «${productName}».\n`, 'utf8');
}

module.exports = {
  // Создаёт на диске файлы-заглушки для сидовых товаров, чтобы скачивание работало в dev
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT pf."id", pf."fileName", pf."storageKey", p."name"
       FROM "ProductFiles" pf JOIN "Products" p ON p."id" = pf."productId"
       WHERE p."name" IN (:names) AND pf."deletedAt" IS NULL`,
      { replacements: { names: DEMO_NAMES } }
    );

    for (const row of rows) {
      const fullPath = path.resolve(ROOT, row.storageKey);

      if (!fullPath.startsWith(ROOT + path.sep) || fs.existsSync(fullPath)) {
        continue;
      }

      const body = placeholderBody(row.fileName, row.name);
      await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.promises.writeFile(fullPath, body);
      await queryInterface.sequelize.query(
        'UPDATE "ProductFiles" SET "fileSize" = :size WHERE "id" = :id',
        { replacements: { size: body.length, id: row.id } }
      );
    }
  },

  async down() {
    // файлы-заглушки остаются в storage/, их удаление не требуется
  }
};
