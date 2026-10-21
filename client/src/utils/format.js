const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const numberFormat = new Intl.NumberFormat('ru-RU')

// Деньги и размеры файлов приходят строками (DECIMAL, BIGINT)
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)
}

export function formatNumber(value) {
  return numberFormat.format(Number(value) || 0)
}

export function formatDate(value) {
  return value ? dateFormat.format(new Date(value)) : '—'
}

export function formatDateTime(value) {
  return value ? dateTimeFormat.format(new Date(value)) : '—'
}

export function formatSize(value) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} Б`
  const units = ['КБ', 'МБ', 'ГБ']
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`
}

export function fullName(person) {
  const name = [person?.firstName, person?.lastName].filter(Boolean).join(' ')
  return name || '—'
}

export function shortId(id) {
  return id ? id.slice(0, 8) : '—'
}

// Деньги, введённые пользователем ("12,5"), в число для API; null, если формат неверный
export function parsePrice(text) {
  const normalized = String(text).trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Number(normalized)
}
