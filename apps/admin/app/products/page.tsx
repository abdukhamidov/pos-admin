"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button, Input } from '@mini/ui'
import { AddProductForm } from '@/components/AddProductForm'
import { Modal } from '@/components/Modal'
import { EditProductForm } from '@/components/EditProductForm'

type Category = { id: string; name: string }
type Warehouse = { id: string; name: string; branch: { id: string; name: string } }
type Product = { id: string; name: string; sku?: string | null; categoryId: string; price: number; stock: number; isActive: boolean; category?: Category }

function fmt(n: number) { return new Intl.NumberFormat('ru-RU').format(n) + ' сум' }

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL'|'active'|'inactive'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState<string>('')

  async function load() {
    setLoading(true)
    const sp = new URLSearchParams()
    if (query) sp.set('query', query)
    if (warehouseId) sp.set('warehouseId', warehouseId)
    if (status !== 'ALL') sp.set('status', status)
    const url = '/api/admin/products' + (sp.toString() ? `?${sp.toString()}` : '')
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [query, warehouseId, status])
  useEffect(() => { fetch('/api/admin/warehouses').then(r => r.json()).then(setWarehouses) }, [])

  function onEdit(p: Product) { setEditProduct(p) }
  async function onDelete(id: string) {
    if (!confirm('Удалить товар?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка удаления')
  }

  const filtered = items
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = useMemo(() => filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize), [filtered, page, pageSize])

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Товары</h1>
        <div className="ml-auto flex items-center gap-2">
          <select className="h-9 rounded-md border px-3 text-sm" value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1) }}>
            <option value="">Все склады</option>
            {warehouses.map(w => (<option key={w.id} value={w.id}>{w.branch?.name ? `${w.branch.name} — ${w.name}` : w.name}</option>))}
          </select>
          <select className="h-9 rounded-md border px-3 text-sm" value={status} onChange={(e)=>{ setStatus(e.target.value as any); setPage(1) }}>
            <option value="ALL">Все</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
          <Input placeholder="Поиск..." className="w-64" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
          <Button onClick={() => setShowAdd(true)}>Добавить</Button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-accent/40">
              <th className="py-2 px-3">Название</th>
              <th className="py-2 px-3">SKU</th>
              <th className="py-2 px-3">Категория</th>
              <th className="py-2 px-3">Цена</th>
              <th className="py-2 px-3">Остаток</th>
              <th className="py-2 px-3">Статус</th>
              <th className="py-2 px-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-accent/20">
                <td className="py-1 px-3 whitespace-nowrap">{p.name}</td>
                <td className="py-1 px-3">{p.sku || '-'}</td>
                <td className="py-1 px-3">{p.category?.name || '-'}</td>
                <td className="py-1 px-3 whitespace-nowrap">{fmt(p.price)}</td>
                <td className="py-1 px-3">{p.stock}</td>
                <td className="py-1 px-3">{p.isActive ? 'Активен' : 'Скрыт'}</td>
                <td className="py-1 px-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={()=>onEdit(p)}>Править</Button>{' '}
                  <Button size="sm" variant="destructive" onClick={()=>onDelete(p.id)}>Удалить</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Показано {pageItems.length} из {total}</div>
        <div className="flex items-center gap-2">
          <select className="h-9 rounded-md border px-3 text-sm" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1) }}>
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1}>Назад</Button>
            <div className="text-sm w-16 text-center">{page}/{pages}</div>
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}>Вперёд</Button>
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Добавить товар">
        <AddProductForm onCreated={() => { setShowAdd(false); load() }} />
      </Modal>
      <Modal open={!!editProduct} onClose={() => setEditProduct(null)} title="Редактировать товар">
        {editProduct && (
          <EditProductForm product={editProduct} onSaved={() => { setEditProduct(null); load() }} onCancel={() => setEditProduct(null)} />
        )}
      </Modal>
    </main>
  )
}

