import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as api from '../api/admin'
import { useImageSrc } from '../hooks/useImageSrc'
import { useLoad } from '../hooks/usePagedList'
import { ConfirmDialog, ErrorNote, PageHead, Skeleton, useToast } from '../ui/Feedback'
import { SelectField, TextField } from '../ui/Field'
import Icon from '../ui/Icon'
import Lightbox from '../ui/Lightbox'
import StatusBadge from '../ui/StatusBadge'
import { formatDateTime, formatSize, fullName, parsePrice } from '../utils/format'

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024 // совпадает с лимитом сервера
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// ---------- Обложка ----------

// Выбор обложки: файл уходит на сервер вместе с формой, поэтому работает и при создании товара.
// value - выбранный файл, null - без изменений, false - удалить текущую
function ImagePicker({ currentUrl, value, onChange, onError }) {
  const input = useRef(null)
  const [preview, setPreview] = useState(null)
  const [zoomed, setZoomed] = useState(false)
  const { src: current } = useImageSrc(currentUrl, true) // у черновика картинка доступна только с токеном

  useEffect(() => {
    if (!(value instanceof File)) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  function pick(file) {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) return onError('Подойдут изображения PNG, JPEG или WebP')
    if (file.size > MAX_IMAGE_SIZE) return onError('Изображение больше 5 МБ')
    onChange(file)
  }

  const shown = value === false ? null : preview ?? current

  return (
    <div className="field span-2">
      <span className="field-label">Обложка</span>
      <div className="image-picker">
        {shown ? (
          <button type="button" className="image-preview-btn" onClick={() => setZoomed(true)} aria-label="Открыть обложку на весь экран">
            <img className="image-preview" src={shown} alt="Обложка товара" />
          </button>
        ) : <div className="image-preview empty">Без обложки: в каталоге будет заглушка</div>}
        <div className="stack" style={{ gap: 8, alignItems: 'flex-start' }}>
          <div className="row">
            <button type="button" className="btn" onClick={() => input.current.click()}><Icon name="upload" />{shown ? 'Заменить' : 'Выбрать изображение'}</button>
            {value === false && <button type="button" className="btn" onClick={() => onChange(null)}>Вернуть текущую</button>}
            {value instanceof File && <button type="button" className="btn" onClick={() => onChange(null)}>{currentUrl ? 'Отменить выбор' : 'Убрать'}</button>}
            {value === null && currentUrl && <button type="button" className="btn btn-danger" onClick={() => onChange(false)}>Убрать</button>}
          </div>
          <span className="field-hint">PNG, JPEG или WebP до 5 МБ. Лучше всего подходит 16:10, например 1280×800.</span>
        </div>
      </div>
      {zoomed && shown && <Lightbox src={shown} alt="Обложка товара" onClose={() => setZoomed(false)} />}
      <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

// ---------- Файлы товара ----------

function Files({ productId, onChange }) {
  const toast = useToast()
  const input = useRef(null)
  const replaceInput = useRef(null)
  const [replacing, setReplacing] = useState(null)
  const [version, setVersion] = useState('')
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(null)
  const files = useLoad(() => api.products.files(productId), [productId])

  async function upload(file) {
    if (!file) return
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`Файл «${file.name}» больше 50 МБ`)
      return
    }
    setBusy(true)
    try {
      await api.products.uploadFile(productId, file, version.trim())
      toast.success(`Файл «${file.name}» загружен`)
      setVersion('')
      files.reload()
      onChange()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function replace(file) {
    const target = replacing
    setReplacing(null)
    if (!file || !target) return
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`Файл «${file.name}» больше 50 МБ`)
      return
    }
    setBusy(true)
    try {
      await api.products.replaceFile(productId, target.id, file, version.trim())
      toast.success('Файл заменён новой версией')
      files.reload()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Файлы</h2>
        <span className="muted">Для публикации нужен хотя бы один файл</span>
      </div>
      <ErrorNote message={files.error} onRetry={files.reload} />
      {files.data && files.data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Файл</th><th>Версия</th><th className="right">Размер</th><th>Загружен</th><th /></tr></thead>
            <tbody>
              {files.data.map((file) => (
                <tr key={file.id}>
                  <td className="cell-title">{file.fileName}<div className="cell-sub">{file.mimeType}</div></td>
                  <td className="mono">{file.version ?? '—'}</td>
                  <td className="right nowrap">{formatSize(file.fileSize)}</td>
                  <td className="nowrap">{formatDateTime(file.createdAt)}</td>
                  <td className="right nowrap">
                    <button className="btn btn-sm" disabled={busy} onClick={() => { setReplacing(file); replaceInput.current.click() }}>Заменить</button>{' '}
                    <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => setRemoving(file)} aria-label="Удалить файл"><Icon name="trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {files.data?.length === 0 && <div className="empty"><strong>Файлов пока нет</strong><span>Загрузите файл, который получит покупатель.</span></div>}
      <div className="card-pad" style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TextField label="Версия (необязательно)" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="например, 1.2" />
        <div
          className={`dropzone ${over ? 'over' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => input.current.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files[0]) }}
        >
          <Icon name="upload" />
          <div>{busy ? 'Загрузка…' : 'Перетащите файл сюда или нажмите, чтобы выбрать'}</div>
        </div>
        <input ref={input} type="file" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = '' }} />
        <input ref={replaceInput} type="file" hidden onChange={(e) => { replace(e.target.files[0]); e.target.value = '' }} />
      </div>
      {removing && (
        <ConfirmDialog
          danger
          title="Удалить файл?"
          text={`«${removing.fileName}» перестанет выдаваться новым покупателям. Те, кто купил товар раньше, сохранят доступ.`}
          confirmLabel="Удалить"
          onConfirm={async () => {
            await api.products.removeFile(productId, removing.id)
            toast.success('Файл удалён')
            files.reload()
            onChange()
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </section>
  )
}

// ---------- Форма товара ----------

function ProductForm({ product, categories, authors: initialAuthors, base, onSaved }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState(product?.category?.slug ?? '')
  const [price, setPrice] = useState(product ? String(Number(product.price)) : '')
  const [authors, setAuthors] = useState(initialAuthors)
  const [newAuthor, setNewAuthor] = useState('')
  const [authorBusy, setAuthorBusy] = useState(false)
  const [authorIds, setAuthorIds] = useState(product?.authors.map((a) => a.id) ?? [])
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const toggleAuthor = (id) => setAuthorIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]))

  async function addAuthor() {
    const name = newAuthor.trim()
    if (!name) return
    setAuthorBusy(true)
    try {
      const created = await api.authors.create({ name })
      setAuthors((current) => [...current, created])
      setAuthorIds((current) => [...current, created.id])
      setNewAuthor('')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setAuthorBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError(null)
    const parsedPrice = parsePrice(price)
    if (parsedPrice === null) {
      setError('Цена — число не меньше нуля, не более двух знаков после запятой')
      return
    }
    if (!category) {
      setError('Выберите категорию')
      return
    }
    setBusy(true)
    const body = { name: name.trim(), description: description.trim(), category, price: parsedPrice, authorIds }
    let saved = product
    try {
      if (product) {
        await api.products.update(product.id, body)
      } else {
        saved = await api.products.create(body)
      }
    } catch (e) {
      setError(e.message)
      setBusy(false)
      return
    }

    // Товар уже сохранён: сбой с картинкой не должен выглядеть как провал всего сохранения
    let imageFailed = null
    try {
      if (image instanceof File) await api.products.setImage(saved.id, image)
      else if (image === false) await api.products.removeImage(saved.id)
    } catch (e) {
      imageFailed = e.message
    }

    try {
      if (imageFailed) toast.error(`Товар сохранён, но обложка не загружена: ${imageFailed}`)
      else toast.success(product ? 'Товар сохранён' : 'Товар создан как черновик: добавьте файл и опубликуйте')
      setImage(null)
      if (product) onSaved()
      else navigate(`${base}/${saved.id}`, { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card card-pad stack" style={{ gap: 16 }} onSubmit={submit}>
      <div className="form-grid">
        <TextField className="span-2" label="Название" required value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField
          label="Категория"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Выберите категорию"
          options={categories.map((c) => ({ value: c.slug, label: c.name }))}
        />
        <TextField label="Цена, BYN" required inputMode="decimal" mono value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" hint="Не более двух знаков после запятой" />
        <TextField className="span-2" label="Описание" required multiline value={description} onChange={(e) => setDescription(e.target.value)} />
        <ImagePicker currentUrl={product?.imageUrl} value={image} onChange={setImage} onError={toast.error} />
        <div className="field span-2">
          <span className="field-label">Авторы</span>
          {authors.length === 0 ? (
            <span className="field-hint">Авторов пока нет. Добавьте первого ниже.</span>
          ) : (
            <div className="chips">
              {authors.map((author) => (
                <button type="button" key={author.id} className={`chip ${authorIds.includes(author.id) ? 'on' : ''}`} aria-pressed={authorIds.includes(author.id)} onClick={() => toggleAuthor(author.id)}>
                  {author.name}
                </button>
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 8 }}>
            <input
              className="input"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAuthor() } }}
              placeholder="Новый автор"
              aria-label="Имя нового автора"
            />
            <button type="button" className="btn" onClick={addAuthor} disabled={authorBusy || !newAuthor.trim()}>Добавить</button>
          </div>
        </div>
      </div>
      <ErrorNote message={error} />
      <div className="row">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Сохранение…' : product ? 'Сохранить' : 'Создать товар'}</button>
        <Link className="btn" to={base}>Отмена</Link>
      </div>
    </form>
  )
}

// ---------- Страница ----------

// base - раздел, в котором открыт редактор: админка или кабинет продавца
export default function ProductEdit({ base = '/admin/products' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [dialog, setDialog] = useState(null)

  const refs = useLoad(async () => {
    const [categories, authors] = await Promise.all([api.listAll(api.categories), api.listAll(api.authors)])
    return { categories, authors }
  }, [])
  const product = useLoad(() => (id ? api.products.get(id) : Promise.resolve(null)), [id])

  const back = <div className="crumbs"><Link to={base}>← Товары</Link></div>
  const error = refs.error ?? product.error

  if (error) return <><PageHead title="Товар" back={back} /><ErrorNote message={error} onRetry={() => { refs.reload(); product.reload() }} /></>
  if (!refs.data || (id && !product.data)) return <><PageHead title="Товар" back={back} /><Skeleton height={320} /></>

  const item = product.data

  async function changeStatus(status, message) {
    try {
      await api.products.setStatus(item.id, status)
      toast.success(message)
      product.reload()
    } catch (e) {
      toast.error(e.status === 409 && status === 'published' ? 'Нельзя опубликовать товар без файлов: сначала загрузите файл' : e.message)
    }
  }

  const actions = item && (
    <>
      {item.status === 'draft' && <button className="btn btn-primary" onClick={() => changeStatus('published', 'Товар опубликован')}>Опубликовать</button>}
      {item.status === 'published' && <button className="btn" onClick={() => changeStatus('draft', 'Товар снят с публикации')}>Снять с публикации</button>}
      {item.status === 'archived' && <button className="btn" onClick={() => changeStatus('draft', 'Товар возвращён в черновики')}>Вернуть в черновики</button>}
      {item.status !== 'archived' && <button className="btn btn-danger" onClick={() => setDialog('archive')}>В архив</button>}
    </>
  )

  return (
    <div className="stack">
      <PageHead
        back={back}
        title={item ? item.name : 'Новый товар'}
        subtitle={item ? undefined : 'Товар создаётся черновиком: после загрузки файла его можно опубликовать'}
        actions={actions}
      />
      {item && (
        <div className="row">
          <StatusBadge kind="product" value={item.status} />
          <span className="muted">Продавец: {fullName(item.seller)} · обновлён {formatDateTime(item.updatedAt)}</span>
        </div>
      )}
      <div className={item ? 'grid-sidebar' : undefined} style={item ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' } : undefined}>
        <ProductForm product={item} categories={refs.data.categories} authors={refs.data.authors} base={base} onSaved={product.reload} />
        {item && <Files productId={item.id} onChange={() => {}} />}
      </div>
      {dialog === 'archive' && (
        <ConfirmDialog
          danger
          title="Отправить товар в архив?"
          text="Товар исчезнет из каталога. Те, кто его уже купил, сохранят доступ к файлам. Вернуть из архива можно в черновики."
          confirmLabel="В архив"
          onConfirm={async () => {
            await api.products.archive(item.id)
            toast.success('Товар отправлен в архив')
            navigate(base)
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
