"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@mini/ui'

type Row = { id: string; seller?: string; branch?: string; startedAt: string }

export function OpenShiftsInline() {
  const [rows, setRows] = useState<Row[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [branchId, setBranchId] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (branchId) sp.set('branchId', branchId)
    try {
      const res = await fetch('/api/admin/reports/open-shifts' + (sp.size ? `?${sp}` : ''), { cache: 'no-store' })
      if (!res.ok) { if (res.status === 401) window.location.href = '/login'; setRows([]); return }
      setRows(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch('/api/admin/branches').then(r => r.json()).then(setBranches) }, [])
  useEffect(() => { load() }, [branchId])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Открытые смены (сейчас)</CardTitle>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Филиал</Label>
          <select className="h-9 rounded-md border px-3 text-sm" value={branchId} onChange={(e)=>setBranchId(e.target.value)}>
            <option value="">Все</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <Button onClick={load} size="sm" disabled={loading}>{loading ? 'Обновляем…' : 'Обновить'}</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-accent/40">
                <th className="py-2 px-3">Продавец</th>
                <th className="py-2 px-3">Филиал</th>
                <th className="py-2 px-3">Открыта</th>
                <th className="py-2 px-3">Длительность</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const started = new Date(r.startedAt)
                const durMs = Date.now() - +started
                const hours = Math.floor(durMs / 3600000)
                const mins = Math.floor((durMs % 3600000) / 60000)
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-1 px-3">{r.seller || '-'}</td>
                    <td className="py-1 px-3">{r.branch || '-'}</td>
                    <td className="py-1 px-3 whitespace-nowrap">{started.toLocaleString('ru-RU')}</td>
                    <td className="py-1 px-3">{hours}ч {mins}м</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr><td className="py-3 text-muted-foreground px-3" colSpan={4}>Нет открытых смен</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

