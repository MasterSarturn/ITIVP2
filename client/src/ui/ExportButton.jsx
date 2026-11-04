import { useState } from 'react'
import { request } from '../api/http'
import { saveBlob } from '../utils/csv'
import { useToast } from './Feedback'
import Icon from './Icon'

// Скачивает CSV с текущими фильтрами списка. Нужен Bearer, поэтому fetch -> blob, а не ссылка
export default function ExportButton({ path, params, fileName }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      const response = await request(path, { params, raw: true })
      saveBlob(fileName, await response.blob())
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button className="btn" onClick={run} disabled={busy}>
      <Icon name="download" />{busy ? 'Выгрузка…' : 'Экспорт CSV'}
    </button>
  )
}
