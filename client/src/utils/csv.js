// CSV для Excel: BOM, разделитель «;», кавычки удваиваются, значения-формулы нейтрализуются
function cell(value) {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(header, rows) {
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n')
}

export function saveBlob(fileName, blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function saveCsv(fileName, content) {
  saveBlob(fileName, new Blob([content], { type: 'text/csv;charset=utf-8' }))
}
