"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'

type Row = { date: string; sum: number; checks: number; avg: number }

export default function RevenueReportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<{id:string;name:string}[]>([])

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (branchId) sp.set('branchId', branchId)
    try {
      const res = await fetch('/api/admin/reports/revenue-by-day' + (sp.toString()?`?${sp.toString()}`:''), { cache: 'no-store' })
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

  const selectedBranchName = branchId
    ? (branches.find(b => b.id === branchId)?.name ?? branchId)
    : 'Все филиалы'

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Отчёт: Выручка по дням</h1>
      <Card>
        <CardHeader><CardTitle>Фильтры</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1"><Label>С даты</Label><Input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label>По дату</Label><Input type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
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
        <CardHeader><CardTitle>Выручка</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">Филиал: {selectedBranchName}</div>
          <table className="min-w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2 pr-4">Дата</th><th className="py-2 pr-4">Чеков</th><th className="py-2 pr-4">Сумма</th><th className="py-2 pr-4">Средний чек</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.date} className="border-b last:border-0"><td className="py-1 pr-4">{r.date}</td><td className="py-1 pr-4">{r.checks}</td><td className="py-1 pr-4">{r.sum.toLocaleString('ru-RU')} сум</td><td className="py-1 pr-4">{r.avg.toLocaleString('ru-RU')} сум</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  )
}
