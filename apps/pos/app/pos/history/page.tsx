"use client"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@mini/ui'

type Row = { id: string; number: number; createdAt: string; total: number; status: string }

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => {
    fetch('/api/pos/sales').then(r => r.json()).then((r) => setRows(r.map((x: any) => ({ id: x.id, number: x.number, createdAt: x.createdAt, total: x.total, status: x.status }))))
  }, [])
  return (
    <main className="p-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>История заказов</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 text-sm font-medium py-2 border-b">
            <div>№</div>
            <div>Дата/время</div>
            <div>Сумма</div>
            <div>Статус</div>
            <div>Действия</div>
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-5 text-sm py-2 border-b">
              <div>{r.number}</div>
              <div>{new Date(r.createdAt).toLocaleString()}</div>
              <div>{r.total}</div>
              <div>{r.status}</div>
              <div><a className="underline" href={`#/sale/${r.id}`}>Открыть</a></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}

