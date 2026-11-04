import { useState } from 'react'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable, { SearchInput, SelectFilter } from '../ui/DataTable'
import { ConfirmDialog, ErrorNote, Modal, PageHead, useToast } from '../ui/Feedback'
import { SelectField, TextField } from '../ui/Field'
import Icon from '../ui/Icon'
import { formatDateTime, formatMoney } from '../utils/format'

const TYPE_OPTIONS = [
  { value: 'percent', label: 'Процент от заказа' },
  { value: 'fixed', label: 'Фиксированная сумма, BYN' },
]
const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Включены' },
  { value: 'false', label: 'Отключены' },
]

// Состояние кода для таблицы: причина, по которой он сейчас не сработает, важнее флага isActive
function promoState(promo) {
  if (!promo.isActive) return ['Отключён', '']
  if (promo.expiresAt && new Date(promo.expiresAt) <= new Date()) return ['Истёк', 'warn']
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return ['Исчерпан', 'warn']
  return ['Действует', 'ok']
}

const formatDiscount = (promo) => (promo.type === 'percent' ? `${Number(promo.value)}%` : `${formatMoney(promo.value)} BYN`)

// <input type="datetime-local"> работает с локальным временем без пояса
function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function numberOrNull(text) {
  const normalized = String(text).trim().replace(',', '.')
  return normalized === '' ? null : Number(normalized)
}

function PromoDialog({ promo, onSaved, onClose }) {
  const editing = Boolean(promo)
  const used = promo?.usedCount > 0
  const [code, setCode] = useState(promo?.code ?? '')
  const [type, setType] = useState(promo?.type ?? 'percent')
  const [value, setValue] = useState(promo ? String(Number(promo.value)) : '')
  const [minOrderAmount, setMin] = useState(promo ? String(Number(promo.minOrderAmount)) : '')
  const [maxUses, setMaxUses] = useState(promo?.maxUses ?? '')
  const [expiresAt, setExpiresAt] = useState(toLocalInput(promo?.expiresAt))
  const [isActive, setIsActive] = useState(promo?.isActive ?? true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)

    const parsedValue = numberOrNull(value)
    if (!editing || !used) {
      if (parsedValue === null || Number.isNaN(parsedValue)) return setError('Укажите размер скидки числом')
    }

    const body = {
      minOrderAmount: numberOrNull(minOrderAmount) ?? 0,
      maxUses: numberOrNull(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive,
    }
    if (Number.isNaN(body.minOrderAmount) || Number.isNaN(body.maxUses)) return setError('Минимальная сумма и лимит должны быть числами')
    if (!editing || !used) body.value = parsedValue

    setBusy(true)
    try {
      if (editing) {
        await api.promoCodes.update(promo.id, body)
      } else {
        await api.promoCodes.create({ code: code.trim(), type, ...body })
      }
      onSaved(editing ? 'Промокод сохранён' : 'Промокод создан')
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? `Промокод ${promo.code}` : 'Новый промокод'}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" form="promo-form" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
        </>
      )}
    >
      <form id="promo-form" className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <div className="form-grid">
          <TextField
            label="Код"
            required
            mono
            disabled={editing}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            hint={editing ? 'Код нельзя менять' : 'Латиница, цифры, «-» и «_», 3-32 символа'}
            maxLength={32}
          />
          <SelectField label="Тип скидки" disabled={editing} value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
          <TextField
            label={type === 'percent' ? 'Скидка, %' : 'Скидка, BYN'}
            required={!used}
            disabled={used}
            inputMode="decimal"
            mono
            value={value}
            onChange={(e) => setValue(e.target.value)}
            hint={used ? 'Нельзя менять у использованного кода' : undefined}
          />
          <TextField label="Минимальная сумма заказа, BYN" inputMode="decimal" mono value={minOrderAmount} onChange={(e) => setMin(e.target.value)} placeholder="0" />
          <TextField label="Лимит использований" inputMode="numeric" mono value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Без ограничения" hint={used ? `Уже использован: ${promo.usedCount}` : undefined} />
          <TextField label="Действует до" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} hint="Пусто - без срока" />
        </div>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Код включён
        </label>
        <ErrorNote message={error} />
      </form>
    </Modal>
  )
}

export default function PromoCodes() {
  const toast = useToast()
  const list = usePagedList(api.promoCodes.list, ['q', 'isActive'])
  const [dialog, setDialog] = useState(null) // { promo } - создание или правка
  const [removing, setRemoving] = useState(null)

  async function toggle(promo) {
    try {
      await api.promoCodes.update(promo.id, { isActive: !promo.isActive })
      toast.success(promo.isActive ? 'Промокод отключён' : 'Промокод включён')
      list.reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const columns = [
    { key: 'code', header: 'Код', render: (p) => <span className="cell-title mono">{p.code}</span> },
    { key: 'discount', header: 'Скидка', render: (p) => <span className="mono">{formatDiscount(p)}</span> },
    { key: 'min', header: 'От суммы, BYN', className: 'right', render: (p) => <span className="mono">{Number(p.minOrderAmount) > 0 ? formatMoney(p.minOrderAmount) : '—'}</span> },
    { key: 'used', header: 'Использован', className: 'right', render: (p) => <span className="mono">{p.usedCount}{p.maxUses !== null ? ` / ${p.maxUses}` : ''}</span> },
    { key: 'expires', header: 'Действует до', className: 'nowrap', render: (p) => (p.expiresAt ? formatDateTime(p.expiresAt) : 'Без срока') },
    {
      key: 'state',
      header: 'Состояние',
      render: (p) => {
        const [label, tone] = promoState(p)
        return <span className={`badge ${tone}`}>{label}</span>
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'right nowrap',
      render: (p) => (
        <>
          <button className="btn btn-sm" onClick={() => setDialog({ promo: p })}>Изменить</button>{' '}
          <button className="btn btn-sm" onClick={() => toggle(p)}>{p.isActive ? 'Отключить' : 'Включить'}</button>{' '}
          {p.usedCount === 0 && (
            <button className="btn btn-sm btn-danger" onClick={() => setRemoving(p)} aria-label={`Удалить промокод ${p.code}`}><Icon name="trash" /></button>
          )}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Промокоды"
        subtitle="Один код на заказ: процент или фиксированная сумма, с лимитом, минимальной суммой и сроком"
        actions={<button className="btn btn-primary" onClick={() => setDialog({ promo: null })}><Icon name="plus" />Новый промокод</button>}
      />
      <div className="card">
        <div className="toolbar">
          <SearchInput value={list.filters.q} onChange={(v) => list.setFilter('q', v)} placeholder="Поиск по коду" />
          <SelectFilter label="Все" value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={ACTIVE_OPTIONS} />
        </div>
        <DataTable columns={columns} list={list} emptyText="Промокодов нет" />
      </div>
      {dialog && (
        <PromoDialog
          promo={dialog.promo}
          onSaved={(message) => { toast.success(message); list.reload() }}
          onClose={() => setDialog(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          danger
          title={`Удалить промокод ${removing.code}?`}
          text="Код ещё не использовался, поэтому его можно удалить. Использованные коды только отключаются."
          confirmLabel="Удалить"
          onConfirm={async () => {
            await api.promoCodes.remove(removing.id)
            toast.success('Промокод удалён')
            list.reload()
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}
