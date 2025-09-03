"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent } from '@mini/ui'
import { Modal } from '@/components/Modal'
import { EditWarehouseForm } from '@/components/EditWarehouseForm'

type Warehouse = { id: string; name: string; branchId: string; isDefault: boolean; branch?: { id: string; name: string } }
type Branch = { id: string; name: string }

export default function WarehousesPage() {
  const [items, setItems] = useState<Warehouse[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null)

  async function load() {
    setLoading(true)
    const [ws, br] = await Promise.all([
      fetch('/api/admin/warehouses', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/admin/branches', { cache: 'no-store' }).then(r => r.json()),
    ])
    setItems(ws); setBranches(br); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create() {
    const name = prompt('Название склада:')?.trim(); if (!name) return
    const idx = prompt('Филиал (номер):\n' + branches.map((b,i)=>`${i+1}) ${b.name}`).join('\n')); if (!idx) return
    const i = Number(idx); if (Number.isNaN(i) || i < 1 || i > branches.length) return
    const isDefault = confirm('Сделать склад основным в выбранном филиале?')
    const res = await fetch('/api/admin/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, branchId: branches[i-1].id, isDefault }) })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка')
  }
  async function setDefault(w: Warehouse) {
    const res = await fetch(`/api/admin/warehouses/${w.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка')
  }
  async function remove(id: string) {
    if (!confirm('Удалить склад?')) return
    let res = await fetch(`/api/admin/warehouses/${id}`, { method: 'DELETE' })
    if (res.ok) { load(); return }
    const data = await res.json().catch(() => ({}))
    if (data?.error === 'HAS_STOCK') {
      const source = items.find(w => w.id === id)
      const candidates = items.filter(w => w.branchId === source?.branchId && w.id !== id)
      if (candidates.length === 0) { alert('Нельзя удалить склад с остатками: создайте другой склад и перенесите остатки.'); return }
      const pick = prompt('Выберите склад для переноса остатков:\n' + candidates.map((w,i)=>`${i+1}) ${w.name}`).join('\n'))
      const idx = Number(pick)
      if (!Number.isNaN(idx) && idx >= 1 && idx <= candidates.length) {
        const targetId = candidates[idx-1].id
        res = await fetch(`/api/admin/warehouses/${id}?targetWarehouseId=${encodeURIComponent(targetId)}`, { method: 'DELETE' })
        if (res.ok) load(); else alert((await res.json()).error || 'Ошибка удаления')
      }
      return
    }
    alert(data?.error || 'Ошибка')
  }
  function edit(w: Warehouse) { setEditWarehouse(w) }

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Склады</h1>
        <div className="ml-auto"><Button onClick={create}>Добавить</Button></div>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
      <div className="space-y-3 max-w-3xl">
        {items.map((w) => (
          <Card key={w.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">Филиал: {w.branch?.name || branches.find(b=>b.id===w.branchId)?.name}</div>
                {w.isDefault && <div className="text-xs rounded bg-accent inline-block px-2 mt-1">По умолчанию</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(w)}>Редактировать</Button>
                {!w.isDefault && <Button size="sm" variant="outline" onClick={() => setDefault(w)}>Сделать основным</Button>}
                <Button size="sm" variant="destructive" onClick={() => remove(w.id)}>Удалить</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Modal open={!!editWarehouse} onClose={() => setEditWarehouse(null)} title="Редактировать склад">
        {editWarehouse && (
          <EditWarehouseForm warehouse={editWarehouse} onSaved={() => { setEditWarehouse(null); load() }} onCancel={() => setEditWarehouse(null)} />
        )}
      </Modal>
    </main>
  )
}
