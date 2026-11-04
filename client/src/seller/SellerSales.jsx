import { useState } from 'react'
import { seller } from '../api/seller'
import { usePagedList, useLoad } from '../hooks/usePagedList'
import DataTable from '../ui/DataTable'
import { PageHead, useToast } from '../ui/Feedback'
import { SelectField } from '../ui/Field'
import Icon from '../ui/Icon'
import { saveCsv, toCsv } from '../utils/csv'
import { formatDateTime, formatMoney } from '../utils/format'

const MAX_EXPORT_PAGES = 100

export default function SellerSales() {
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const list = usePagedList(seller.sales, ['productId'])
  const products = useLoad(async () => (await seller.products({ page: 1 })).items, [])
  const productId = list.filters.productId

  const columns = [
    { key: 'product', header: 'Товар', render: (s) => <span className="cell-title">{s.productName}</span> },
    { key: 'price', header: 'Цена, BYN', className: 'right', render: (s) => <span className="mono">{formatMoney(s.unitPrice)}</span> },
    { key: 'paid', header: 'Оплачено', className: 'nowrap', render: (s) => formatDateTime(s.paidAt) },
  ]

  // Выгружаются все страницы с текущим фильтром, а не только открытая
  async function exportCsv() {
    setExporting(true)
    try {
      const rows = []
      for (let page = 1; page <= MAX_EXPORT_PAGES; page += 1) {
        const data = await seller.sales({ page, productId })
        rows.push(...data.items)
        if (page >= data.totalPages) break
      }
      saveCsv('sales.csv', toCsv(['Товар', 'Цена, BYN', 'Оплачено'], rows.map((s) => [s.productName, s.unitPrice, s.paidAt])))
      toast.success(`Выгружено продаж: ${rows.length}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHead
        title="Продажи"
        subtitle="Оплаченные позиции по вашим товарам. Данные покупателей не показываются"
        actions={<button className="btn" onClick={exportCsv} disabled={exporting}><Icon name="download" />{exporting ? 'Выгрузка…' : 'Экспорт CSV'}</button>}
      />
      <div className="card">
        <div className="toolbar">
          <SelectField
            label="Товар"
            value={productId}
            onChange={(e) => list.setFilter('productId', e.target.value)}
            placeholder="Все товары"
            options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        <DataTable columns={columns} list={list} emptyText="Продаж пока нет" />
      </div>
    </>
  )
}
