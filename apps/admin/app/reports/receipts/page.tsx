"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'

type Row = { id: string; createdAt: string; productName: string; sku?: string | null; warehouseName: string; qty: number; userName?: string | null; note?: string | null }

export default function ReceiptsReportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [warehouseId, setWarehouseId] = useState<string>('')
  const [query, setQuery] = useState('')
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (from) sp.set('from', new Date(from).toISOString())
    if (to) sp.set('to', new Date(to).toISOString())
    if (warehouseId) sp.set('warehouseId', warehouseId)
    if (query) sp.set('query', query)
    try {
      const res = await fetch('/api/admin/reports/receipts' + (sp.size ? `?${sp}` : ''), { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/login'
        setRows([])
        return
      }
      const data = await res.json()
      setRows(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch('/api/admin/warehouses').then(r => r.json()).then(setWarehouses) }, [])
  useEffect(() => { load() }, [])

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Отчёт: Поступления</h1>
      <Card>
        <CardHeader><CardTitle>Фильтры</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1"><Label>С</Label><Input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label>По</Label><Input type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
          <div className="space-y-1"><Label>Склад</Label>
            <select className="h-9 border rounded-md px-2" value={warehouseId} onChange={e=>setWarehouseId(e.target.value)}>
              <option value="">Все</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-1"><Label>Поиск</Label><Input placeholder="товар/SKU" value={query} onChange={e=>setQuery(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={load} disabled={loading}>{loading? 'Загружаем...':'Показать'}</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Поступления</CardTitle></CardHeader>
        <CardContent>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Дата/время</th>
                <th className="py-2 pr-4">Товар</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Склад</th>
                <th className="py-2 pr-4">Кол-во</th>
                <th className="py-2 pr-4">Пользователь</th>
                <th className="py-2 pr-4">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-1 pr-4 whitespace-nowrap">{new Date(r.createdAt).toLocaleString('ru-RU')}</td>
                  <td className="py-1 pr-4">{r.productName}</td>
                  <td className="py-1 pr-4">{r.sku || '-'}</td>
                  <td className="py-1 pr-4">{r.warehouseName}</td>
                  <td className="py-1 pr-4">{r.qty}</td>
                  <td className="py-1 pr-4">{r.userName || '-'}</td>
                  <td className="py-1 pr-4">{r.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  )
}

