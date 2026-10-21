import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as api from '../api/admin'
import { usePagedList } from '../hooks/usePagedList'
import DataTable from '../ui/DataTable'
import { ConfirmDialog, ErrorNote, Modal, PageHead, useToast } from '../ui/Feedback'
import { TextField } from '../ui/Field'
import Icon from '../ui/Icon'
import { formatDate } from '../utils/format'

const KINDS = {
  categories: { title: 'Категории', one: 'категорию', api: api.categories, slug: true },
  authors: { title: 'Авторы', one: 'автора', api: api.authors, slug: false },
}

function EditDialog({ kind, item, onSaved, onClose }) {
  const config = KINDS[kind]
  const [name, setName] = useState(item?.name ?? '')
  const [slug, setSlug] = useState(item?.slug ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const body = { name: name.trim(), description: description.trim() }
    if (config.slug) body.slug = slug.trim()
    try {
      if (item) await config.api.update(item.id, body)
      else await config.api.create(body)
      onSaved(item ? 'Изменения сохранены' : 'Запись добавлена')
      onClose()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={item ? 'Редактирование' : `Добавить ${config.one}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" form="catalog-form" disabled={busy}>Сохранить</button>
        </>
      )}
    >
      <form id="catalog-form" className="stack" style={{ gap: 16 }} onSubmit={submit}>
        <TextField label="Название" required value={name} onChange={(e) => setName(e.target.value)} />
        {config.slug && (
          <TextField label="Slug" required mono value={slug} onChange={(e) => setSlug(e.target.value)} hint="Строчная латиница, цифры и дефис, например: e-books" />
        )}
        <TextField label="Описание" multiline value={description} onChange={(e) => setDescription(e.target.value)} />
        <ErrorNote message={error} />
      </form>
    </Modal>
  )
}

function Section({ kind }) {
  const config = KINDS[kind]
  const toast = useToast()
  const list = usePagedList(config.api.list)
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  const columns = [
    { key: 'name', header: 'Название', render: (r) => <span className="cell-title">{r.name}</span> },
    ...(config.slug ? [{ key: 'slug', header: 'Slug', render: (r) => <span className="mono">{r.slug}</span> }] : []),
    { key: 'description', header: 'Описание', render: (r) => <span className="muted">{r.description ?? '—'}</span> },
    { key: 'created', header: 'Создано', className: 'nowrap', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'right nowrap',
      render: (r) => (
        <>
          <button className="btn btn-sm" onClick={() => setEditing(r)} aria-label="Редактировать"><Icon name="edit" /></button>{' '}
          <button className="btn btn-sm btn-danger" onClick={() => setRemoving(r)} aria-label="Удалить"><Icon name="trash" /></button>
        </>
      ),
    },
  ]

  return (
    <div className="card">
      <div className="toolbar">
        <span className="muted" style={{ flex: 1 }}>{config.title}: {list.data?.totalItems ?? '…'}</span>
        <button className="btn btn-primary" onClick={() => setEditing({})}><Icon name="plus" />Добавить</button>
      </div>
      <DataTable columns={columns} list={list} emptyText="Записей пока нет" />
      {editing && (
        <EditDialog
          kind={kind}
          item={editing.id ? editing : null}
          onSaved={(message) => { toast.success(message); list.reload() }}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <ConfirmDialog
          danger
          title={`Удалить «${removing.name}»?`}
          text={kind === 'categories'
            ? 'Категорию нельзя удалить, пока в ней есть товары.'
            : 'Автор будет убран из всех товаров, где он указан.'}
          confirmLabel="Удалить"
          onConfirm={async () => {
            await config.api.remove(removing.id)
            toast.success('Запись удалена')
            list.reload()
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

export default function Catalog() {
  const [tab, setTab] = useState('categories')
  const [, setParams] = useSearchParams()
  // номер страницы одной вкладки не должен переезжать на другую
  const switchTab = (key) => { setParams({}, { replace: true }); setTab(key) }

  return (
    <>
      <PageHead title="Справочники" subtitle="Категории и авторы, которые выбираются в карточке товара" />
      <div className="tabs" role="tablist">
        {Object.entries(KINDS).map(([key, config]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => switchTab(key)}>
            {config.title}
          </button>
        ))}
      </div>
      <Section key={tab} kind={tab} />
    </>
  )
}
