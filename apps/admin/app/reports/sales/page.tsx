"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'

type Row = { id: string; number: number; day: string; date: string; seller: string; items: number; total: number; status: string }
type User = { id: string; name: string; role: 'ADMIN'|'SELLER' }

export default function SalesReportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [seller, setSeller] = useState('')
  const [status, setStatus] = useState<'ALL'|'COMPLETED'|'CANCELLED'|'OPEN'>('ALL')
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<{id:string;name:string}[]>([])
  const [sellers, setSellers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (seller) sp.set('seller', seller)
    if (status !== 'ALL') sp.set('status', status)
    if (branchId) sp.set('branchId', branchId)
    try {
      const res = await fetch('/api/admin/reports/sales' + (sp.toString()?`?${sp.toString()}`:''), { cache: 'no-store' })
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
  useEffect(() => { fetch('/api/admin/users').then(r=> r.ok ? r.json() : []).then((us:User[])=> setSellers(Array.isArray(us)? us.filter(u=>u.role==='SELLER') : [])) }, [])
  useEffect(() => { fetch('/api/admin/branches').then(r=> r.ok ? r.json() : []).then((br:any)=> setBranches(Array.isArray(br)? br : [])) }, [])

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Отчёт: Продажи</h1>
      <Card>
        <CardHeader><CardTitle>Фильтры</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1"><Label>С даты</Label><Input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div className="space-y-1"><Label>По дату</Label><Input type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
          <div className="space-y-1"><Label>Продавец</Label>
            <select className="h-9 border rounded-md px-2" value={seller} onChange={e=>setSeller(e.target.value)}>
              <option value="">Все</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1"><Label>Статус</Label>
            <select className="h-9 border rounded-md px-2" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="ALL">Все</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="OPEN">OPEN</option>
            </select>
          </div>
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
        <CardHeader><CardTitle>Продажи</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Дата</th>
                  <th className="py-2 pr-4">День</th>
                  <th className="py-2 pr-4">№</th>
                  <th className="py-2 pr-4">Продавец</th>
                  <th className="py-2 pr-4">Позиций</th>
                  <th className="py-2 pr-4">Сумма</th>
                  <th className="py-2 pr-4">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-1 pr-4 whitespace-nowrap">{new Date(r.date).toLocaleString('ru-RU')}</td>
                    <td className="py-1 pr-4">{r.day}</td>
                    <td className="py-1 pr-4">{r.number}</td>
                    <td className="py-1 pr-4">{r.seller}</td>
                    <td className="py-1 pr-4">{r.items}</td>
                    <td className="py-1 pr-4">{r.total.toLocaleString('ru-RU')} сум</td>
                    <td className="py-1 pr-4">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
