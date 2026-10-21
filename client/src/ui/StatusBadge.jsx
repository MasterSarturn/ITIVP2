const LABELS = {
  product: {
    draft: ['Черновик', ''],
    published: ['Опубликован', 'ok'],
    archived: ['В архиве', 'warn'],
  },
  order: {
    pending: ['Ожидает оплаты', 'warn'],
    paid: ['Оплачен', 'ok'],
    cancelled: ['Отменён', ''],
    refunded: ['Возврат', 'danger'],
  },
  payment: {
    pending: ['В обработке', 'warn'],
    completed: ['Завершён', 'ok'],
    failed: ['Ошибка', 'danger'],
    refunded: ['Возвращён', 'danger'],
  },
  account: {
    active: ['Активен', 'ok'],
    blocked: ['Заблокирован', 'danger'],
    deleted: ['Удалён', ''],
  },
  role: {
    user: ['Покупатель', ''],
    seller: ['Продавец', 'accent'],
    admin: ['Администратор', 'accent'],
  },
}

export const STATUS_OPTIONS = Object.fromEntries(
  Object.entries(LABELS).map(([kind, map]) => [kind, Object.entries(map).map(([value, [label]]) => ({ value, label }))]),
)

export function statusLabel(kind, value) {
  return LABELS[kind]?.[value]?.[0] ?? value
}

export default function StatusBadge({ kind, value }) {
  const [label, tone] = LABELS[kind]?.[value] ?? [value, '']
  return <span className={`badge ${tone}`}>{label}</span>
}
