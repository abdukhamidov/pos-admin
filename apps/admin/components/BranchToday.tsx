"use client"
import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@mini/ui'

type Row = { id: string; name: string; checks: number; revenue: number; avg: number }

export default function BranchToday() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const r = await fetch('/api/admin/stats/by-branch-today', { cache: 'no-store' })
        if (!r.ok) { if (r.status === 401) window.location.href = '/login'; return }
        const data = await r.json()
        setRows(Array.isArray(data) ? data : [])
      } finally { setLoading(false) }
    })()
  }, [])
  return (
    <Card>
      <CardHeader><CardTitle>Сегодня по филиалам</CardTitle></CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
        {!loading && (
          <table className="min-w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2 pr-4">Филиал</th><th className="py-2 pr-4">Чеков</th><th className="py-2 pr-4">Выручка</th><th className="py-2 pr-4">Средний</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-1 pr-4">{r.name}</td>
                  <td className="py-1 pr-4">{r.checks}</td>
                  <td className="py-1 pr-4">{r.revenue.toLocaleString('ru-RU')} сум</td>
                  <td className="py-1 pr-4">{r.avg.toLocaleString('ru-RU')} сум</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

