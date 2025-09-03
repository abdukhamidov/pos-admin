"use client"
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@mini/ui'

type Row = { id: string; date: string; seller: string; total: number; items: number; status: string }

export default function RecentSales() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const url = '/api/admin/reports/sales?status=COMPLETED'
        const r = await fetch(url, { cache: 'no-store' })
        if (!r.ok) { if (r.status === 401) window.location.href = '/login'; return }
        const data = await r.json()
        setRows(Array.isArray(data) ? data.slice(0, 10) : [])
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <Card>
      <CardHeader><CardTitle>Недавние продажи</CardTitle></CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">Нет данных</div>}
        {!loading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <div className="min-w-0">
                  <div className="font-medium">{r.total.toLocaleString('ru-RU')} сум</div>
                  <div className="text-xs text-muted-foreground truncate">{new Date(r.date).toLocaleString('ru-RU')} • {r.seller} • позиций: {r.items}</div>
                </div>
                <div className="text-xs text-muted-foreground">{r.status}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

