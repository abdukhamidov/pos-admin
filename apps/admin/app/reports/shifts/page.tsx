"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@mini/ui'
import { Modal } from '@/components/Modal'

type Row = { id: string; seller: string; startedAt: string; endedAt?: string|null; durationMs: number; checks: number; sum: number; avg: number; cancelled: number }
type User = { id: string; name: string; role: 'ADMIN'|'SELLER' }

export default function ShiftsReportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [seller, setSeller] = useState('')
  const [sellers, setSellers] = useState<User[]>([])
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<{id:string;name:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [details, setDetails] = useState<{ items: { name: string; qty: number; revenue: number }[]; totals: { checks: number; qty: number; revenue: number } } | null>(null)

  async function openDetails(shiftId: string) {
    setDetailsOpen(true); setDetailsLoading(true); setDetails(null)
    try {
      const res = await fetch(`/api/admin/reports/shifts/${shiftId}/items`, { cache: 'no-store' })
      if (!res.ok) { setDetails({ items: [], totals: { checks: 0, qty: 0, revenue: 0 } }); return }
      const data = await res.json()
      setDetails(data)
    } finally { setDetailsLoading(false) }
  }

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    if (seller) sp.set('seller', seller)
    if (branchId) sp.set('branchId', branchId)
    try {
      const res = await fetch('/api/admin/reports/shifts' + (sp.toString()?`?${sp.toString()}`:''), { cache: 'no-store' })
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

  function fmtDur(ms: number) { const h=Math.floor(ms/3600000); const m=Math.round((ms%3600000)/60000); return `${h}ч ${m}м` }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Отчёт: Смены</h1>
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
        <CardHeader><CardTitle>Смены</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Продавец</th>
                  <th className="py-2 pr-4">Начало</th>
                  <th className="py-2 pr-4">Окончание</th>
                  <th className="py-2 pr-4">Длительность</th>
                  <th className="py-2 pr-4">Чеков</th>
                  <th className="py-2 pr-4">Сумма</th>
                  <th className="py-2 pr-4">Средний</th>
                  <th className="py-2 pr-4">Отменено</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-1 pr-4">{r.seller}</td>
                    <td className="py-1 pr-4 whitespace-nowrap">{new Date(r.startedAt).toLocaleString('ru-RU')}</td>
                    <td className="py-1 pr-4 whitespace-nowrap">{r.endedAt ? new Date(r.endedAt).toLocaleString('ru-RU') : '-'}</td>
                    <td className="py-1 pr-4">{fmtDur(r.durationMs)}</td>
                    <td className="py-1 pr-4">{r.checks}</td>
                    <td className="py-1 pr-4">{r.sum.toLocaleString('ru-RU')} сум</td>
                    <td className="py-1 pr-4">{r.avg.toLocaleString('ru-RU')} сум</td>
                    <td className="py-1 pr-4 whitespace-nowrap">
                      {r.cancelled}
                      <Button size="sm" variant="outline" className="ml-2" onClick={()=>openDetails(r.id)}>Детали</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Подробности смены">
        {detailsLoading && <div className="text-sm text-muted-foreground">Загружаем…</div>}
        {!detailsLoading && details && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Чеки: {details.totals.checks} · Кол-во: {details.totals.qty} · Выручка: {details.totals.revenue.toLocaleString('ru-RU')} сум</div>
            <div className="overflow-auto rounded-md border max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b bg-accent/40"><th className="py-2 px-3">Товар</th><th className="py-2 px-3">Кол-во</th><th className="py-2 px-3">Сумма</th></tr></thead>
                <tbody>
                  {details.items.map((i, idx) => (
                    <tr key={idx} className="border-b last:border-0"><td className="py-1 px-3">{i.name}</td><td className="py-1 px-3">{i.qty}</td><td className="py-1 px-3 whitespace-nowrap">{i.revenue.toLocaleString('ru-RU')} сум</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}
