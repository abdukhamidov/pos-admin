"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'

type Row = { id: string; name: string; sku?: string|null; price: number; stock: number }

export default function StockReportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [threshold, setThreshold] = useState(5)
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<{id:string;name:string}[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams({ threshold: String(threshold) })
    if (branchId) sp.set('branchId', branchId)
    try {
      const res = await fetch('/api/admin/products/low-stock?'+sp.toString(), { cache: 'no-store' })
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

  useEffect(() => { load() }, [])
  useEffect(() => { fetch('/api/admin/branches').then(r=> r.ok ? r.json() : []).then((br:any)=> setBranches(Array.isArray(br)? br : [])) }, [])

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Отчёт: Низкие остатки</h1>
      <Card>
        <CardHeader><CardTitle>Фильтры</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1"><Label>Порог остатка</Label><Input type="number" value={threshold} onChange={e=>setThreshold(Number(e.target.value||0))} /></div>
          <div className="space-y-1"><Label>Филиал</Label>
            <select className="h-9 border rounded-md px-2" value={branchId} onChange={e=>setBranchId(e.target.value)}>
              <option value="">Все</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-end"><Button onClick={load} disabled={loading}>{loading? 'Загрузка…':'Применить'}</Button></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Товары</CardTitle></CardHeader>
        <CardContent>
          <table className="min-w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2 pr-4">Название</th><th className="py-2 pr-4">SKU</th><th className="py-2 pr-4">Цена</th><th className="py-2 pr-4">Остаток</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0"><td className="py-1 pr-4">{r.name}</td><td className="py-1 pr-4">{r.sku||'-'}</td><td className="py-1 pr-4">{r.price.toLocaleString('ru-RU')} сум</td><td className="py-1 pr-4">{r.stock}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  )
}
