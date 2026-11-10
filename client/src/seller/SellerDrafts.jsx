import { useState } from 'react'
import * as admin from '../api/admin'
import { seller } from '../api/seller'
import { useLoad, usePagedList } from '../hooks/usePagedList'
import DataTable, { SearchInput } from '../ui/DataTable'
import { ConfirmDialog, ErrorNote, Modal, PageHead, useToast } from '../ui/Feedback'
import { SelectField, TextField } from '../ui/Field'
import Icon from '../ui/Icon'
import { formatDateTime, formatMoney, parsePrice } from '../utils/format'

const CATEGORIES = [
  { value: 'books', label: 'Книги' },
  { value: 'music', label: 'Музыка' },
  { value: 'software', label: 'Программы' },
]

// Характеристики по категориям: совпадают с белым списком на сервере (utils/draftAttributes.js)
// kind: text - строка, int - целое число, list - значения через запятую
const ATTRIBUTES = {
  books: [
    { key: 'isbn', label: 'ISBN', kind: 'text' },
    { key: 'pages', label: 'Страниц', kind: 'int' },
    { key: 'language', label: 'Язык', kind: 'text' },
    { key: 'format', label: 'Формат', kind: 'text' },
  ],
  music: [
    { key: 'durationSec', label: 'Длительность, сек', kind: 'int' },
    { key: 'genre', label: 'Жанр', kind: 'text' },
    { key: 'bitrate', label: 'Битрейт, кбит/с', kind: 'int' },
  ],
  software: [
    { key: 'version', label: 'Версия', kind: 'text' },
    { key: 'os', label: 'Платформы (через запятую)', kind: 'list' },
    { key: 'license', label: 'Лицензия', kind: 'text' },
  ],
}

const categoryLabel = (value) => CATEGORIES.find((c) => c.value === value)?.label ?? '—'

// Значения атрибутов черновика -> строки для полей формы
function attributesToForm(draft) {
  const result = {}
  for (const field of ATTRIBUTES[draft?.category] ?? []) {
    const value = draft.attributes?.[field.key]
    if (value !== undefined && value !== null) result[field.key] = Array.isArray(value) ? value.join(', ') : String(value)
  }
  return result
}

// Строки формы -> attributes для API; пустые поля пропускаются
function attributesToApi(category, values) {
  const result = {}
  for (const field of ATTRIBUTES[category] ?? []) {
    const raw = (values[field.key] ?? '').trim()
    if (!raw) continue
    if (field.kind === 'int') {
      if (!/^\d+$/.test(raw)) throw new Error(`Поле «${field.label}» должно быть целым числом`)
      result[field.key] = Number(raw)
    } else if (field.kind === 'list') {
      result[field.key] = raw.split(',').map((item) => item.trim()).filter(Boolean)
    } else {
      result[field.key] = raw
    }
  }
  return result
}

function DraftForm({ draft, authors, onClose, onSaved }) {
  const toast = useToast()
  const [name, setName] = useState(draft?.name ?? '')
  const [description, setDescription] = useState(draft?.description ?? '')
  const [category, setCategory] = useState(draft?.category ?? '')
  const [price, setPrice] = useState(draft?.price != null ? String(draft.price) : '')
  const [tags, setTags] = useState(draft?.tags.join(', ') ?? '')
  const [authorIds, setAuthorIds] = useState(draft?.authorIds ?? [])
  const [attrs, setAttrs] = useState(attributesToForm(draft))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const toggleAuthor = (id) => setAuthorIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  function changeCategory(value) {
    setCategory(value)
    setAttrs({}) // у другой категории другие характеристики
  }

  async function submit() {
    setError(null)
    if (!name.trim()) return setError('Укажите название')

    let parsedPrice = null
    if (price.trim()) {
      parsedPrice = parsePrice(price)
      if (parsedPrice === null) return setError('Цена — число не меньше нуля, не более двух знаков после запятой')
    }

    let attributes
    try {
      attributes = attributesToApi(category, attrs)
    } catch (e) {
      return setError(e.message)
    }

    const body = {
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category: category || null,
      authorIds,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      attributes,
    }

    setBusy(true)
    try {
      if (draft) await seller.drafts.update(draft.id, body)
      else await seller.drafts.create(body)
      toast.success(draft ? 'Черновик сохранён' : 'Черновик создан')
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={draft ? 'Редактирование черновика' : 'Новый черновик'}
      onClose={busy ? () => {} : onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
        </>
      )}
    >
      <TextField label="Название" required value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Описание" multiline value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="form-grid">
        <SelectField label="Категория" value={category} onChange={(e) => changeCategory(e.target.value)} placeholder="Не выбрана" options={CATEGORIES} />
        <TextField label="Цена, BYN" inputMode="decimal" mono value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
      </div>
      <TextField label="Теги" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="через запятую" />
      {(ATTRIBUTES[category] ?? []).length > 0 && (
        <div className="form-grid">
          {ATTRIBUTES[category].map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              inputMode={field.kind === 'int' ? 'numeric' : undefined}
              value={attrs[field.key] ?? ''}
              onChange={(e) => setAttrs((current) => ({ ...current, [field.key]: e.target.value }))}
            />
          ))}
        </div>
      )}
      {authors.length > 0 && (
        <div className="field">
          <span className="field-label">Авторы</span>
          <div className="chips">
            {authors.map((author) => (
              <button type="button" key={author.id} className={`chip ${authorIds.includes(author.id) ? 'on' : ''}`} aria-pressed={authorIds.includes(author.id)} onClick={() => toggleAuthor(author.id)}>
                {author.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function SellerDrafts() {
  const toast = useToast()
  const list = usePagedList(seller.drafts.list, ['q', 'tag'])
  const authors = useLoad(() => admin.listAll(admin.authors), [])
  const [editing, setEditing] = useState(null) // null - закрыто, {} - новый, {...} - редактирование
  const [removing, setRemoving] = useState(null)

  const authorNames = (ids) => ids.map((id) => authors.data?.find((a) => a.id === id)?.name).filter(Boolean).join(', ')

  const columns = [
    {
      key: 'name',
      header: 'Черновик',
      render: (d) => (
        <>
          <div className="cell-title">{d.name}</div>
          <div className="cell-sub">{authorNames(d.authorIds) || 'Автор не указан'}</div>
        </>
      ),
    },
    { key: 'category', header: 'Категория', render: (d) => categoryLabel(d.category) },
    {
      key: 'tags',
      header: 'Теги',
      render: (d) => (d.tags.length ? <div className="chips">{d.tags.map((t) => <button key={t} type="button" className="chip" onClick={(e) => { e.stopPropagation(); list.setFilter('tag', t) }}>{t}</button>)}</div> : '—'),
    },
    { key: 'price', header: 'Цена, BYN', className: 'right', render: (d) => (d.price == null ? '—' : <span className="mono">{formatMoney(d.price)}</span>) },
    { key: 'updated', header: 'Изменён', className: 'nowrap', render: (d) => formatDateTime(d.updatedAt) },
    {
      key: 'actions',
      header: '',
      className: 'right nowrap',
      render: (d) => (
        <button className="btn btn-sm btn-danger" aria-label="Удалить черновик" onClick={(e) => { e.stopPropagation(); setRemoving(d) }}>
          <Icon name="trash" />
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Черновики"
        subtitle="Заготовки карточек товаров с характеристиками по категориям"
        actions={<button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" />Новый черновик</button>}
      />
      <div className="card">
        <div className="toolbar">
          <SearchInput value={list.filters.q} onChange={(v) => list.setFilter('q', v)} placeholder="Поиск по названию" />
          {list.filters.tag && (
            <button className="chip on" onClick={() => list.setFilter('tag', '')}>тег: {list.filters.tag} ✕</button>
          )}
        </div>
        <DataTable columns={columns} list={list} onRowClick={(d) => setEditing(d)} emptyText="Черновиков пока нет" />
      </div>
      {editing && (
        <DraftForm
          draft={editing.id ? editing : null}
          authors={authors.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={list.reload}
        />
      )}
      {removing && (
        <ConfirmDialog
          danger
          title="Удалить черновик?"
          text={`«${removing.name}» будет удалён без возможности восстановления.`}
          confirmLabel="Удалить"
          onConfirm={async () => {
            await seller.drafts.remove(removing.id)
            toast.success('Черновик удалён')
            list.reload()
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}
