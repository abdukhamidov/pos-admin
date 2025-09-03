"use client"
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@mini/ui'

type Row = { id: string; name: string; sku?: string|null; price: number; stock: number }

export default function LowStockList() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/admin/products/low-stock?threshold=5', { cache: 'no-store' })
        if (!r.ok) { if (r.status === 401) window.location.href = '/login'; return }
        const data = await r.json()
        setRows(Array.isArray(data) ? data.slice(0, 10) : [])
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <Card>
      <CardHeader><CardTitle>Низкие остатки</CardTitle></CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">Нет данных</div>}
        {!loading && rows.length > 0 && (
          <div className="space-y-1">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">SKU: {r.sku || '-'} • цена: {r.price.toLocaleString('ru-RU')} сум</div>
                </div>
                <div className="text-xs font-medium text-rose-600">{r.stock}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

