// Потоковая выгрузка CSV для Excel: BOM, разделитель «;», кавычки удваиваются,
// значения, похожие на формулы, нейтрализуются префиксом «'» (CSV-инъекция)
const MAX_PAGES = 500;

function cell(value) {
  let text = value === null || value === undefined ? '' : value instanceof Date ? value.toISOString() : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function line(values) {
  return `${values.map(cell).join(';')}\r\n`;
}

function write(res, chunk) {
  return res.write(chunk) ? Promise.resolve() : new Promise((resolve) => res.once('drain', resolve));
}

// fetchPage(page) возвращает страницу { items, totalPages } существующего списка с теми же фильтрами.
// Первая страница читается до отправки заголовков, поэтому ошибка фильтра вернётся обычным JSON 400
async function sendCsv(res, fileName, header, fetchPage, toRow) {
  let data = await fetchPage(1);

  res.status(200);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Cache-Control': 'no-store'
  });
  await write(res, `﻿${line(header)}`);

  try {
    for (let page = 1; ; page += 1) {
      for (const item of data.items) {
        await write(res, line(toRow(item)));
      }

      if (page >= data.totalPages || page >= MAX_PAGES) {
        break;
      }

      data = await fetchPage(page + 1);
    }

    res.end();
  } catch (error) {
    // заголовки уже отправлены: оборвать соединение, чтобы клиент не принял неполный файл за целый
    res.destroy(error);
  }
}

module.exports = { sendCsv, cell };
