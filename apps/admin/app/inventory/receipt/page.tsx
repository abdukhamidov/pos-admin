"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, toast } from '@mini/ui'

type Warehouse = { id: string; name: string; branch?: { id: string; name: string } }
type Product = { id: string; name: string; sku?: string | null }
type Row = { product: Product; qty: number; note?: string }

export default function ReceiptPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [query, setQuery] = useState('')
  const [lookup, setLookup] = useState<Product[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/admin/warehouses').then(r => r.json()).then(setWarehouses) }, [])
  useEffect(() => {
    const ac = new AbortController()
    if (!query) { setLookup([]); return () => ac.abort() }
    fetch('/api/admin/products?status=active&' + new URLSearchParams({ query }), { signal: ac.signal })
      .then(r => r.ok ? r.json() : [])
      .then((xs) => { if (!ac.signal.aborted) setLookup(xs?.map((x: any) => ({ id: x.id, name: x.name, sku: x.sku })) ?? []) })
      .catch((err) => { if (err?.name !== 'AbortError') console.error(err) })
    return () => ac.abort()
  }, [query])

  function addProduct(p: Product) {
    setRows((xs) => {
      const i = xs.findIndex((r) => r.product.id === p.id)
      if (i >= 0) { const cp = [...xs]; cp[i] = { ...cp[i], qty: cp[i].qty + 1 }; return cp }
      return [...xs, { product: p, qty: 1 }]
    })
    setQuery('')
    setLookup([])
  }

  async function submit() {
    if (!warehouseId) return alert('Выберите склад')
    if (rows.length === 0) return alert('Добавьте хотя бы одну позицию')
    setLoading(true)
    const payload = { warehouseId, items: rows.map(r => ({ productId: r.product.id, qty: r.qty, note: r.note })) }
    const res = await fetch('/api/admin/inventory/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLoading(false)
    if (!res.ok) {
      const j = await res.json().catch(()=>({error:'ERROR'}))
      toast.error({ title: 'Ошибка приёмки', description: j.error || 'RECEIPT_FAILED' })
      return
    }
    setRows([])
    toast.success({ title: 'Приёмка проведена', description: 'Остатки обновлены' })
  }

  const totalLines = rows.length

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Приёмка товара</h1>
      <div className="flex items-center gap-2">
        <select className="h-9 rounded-md border px-3 text-sm" value={warehouseId} onChange={(e)=>setWarehouseId(e.target.value)}>
          <option value="">Выберите склад</option>
          {warehouses.map(w => (<option key={w.id} value={w.id}>{w.branch?.name ? `${w.branch.name} — ${w.name}` : w.name}</option>))}
        </select>
        <div className="flex-1" />
        <Button onClick={submit} disabled={!warehouseId || totalLines===0 || loading}>{loading ? 'Сохраняем...' : 'Провести приёмку'}</Button>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Поиск товара..." value={query} onChange={(e)=>setQuery(e.target.value)} className="w-80" />
      </div>
      {!!lookup.length && (
        <div className="rounded-md border max-h-56 overflow-auto">
          <table className="min-w-full text-sm">
            <tbody>
              {lookup.map(p => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-accent/20 cursor-pointer" onClick={()=>addProduct(p)}>
                  <td className="py-1 px-3">{p.name}</td>
                  <td className="py-1 px-3 text-muted-foreground">{p.sku || '-'}</td>
                  <td className="py-1 px-3 text-right"><Button size="sm" variant="outline">Добавить</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-md border overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-accent/40">
              <th className="py-2 px-3">Товар</th>
              <th className="py-2 px-3">SKU</th>
              <th className="py-2 px-3">Количество</th>
              <th className="py-2 px-3">Комментарий</th>
              <th className="py-2 px-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.product.id} className="border-b last:border-0">
                <td className="py-1 px-3 whitespace-nowrap">{r.product.name}</td>
                <td className="py-1 px-3">{r.product.sku || '-'}</td>
                <td className="py-1 px-3 w-40">
                  <Input type="number" min={1} value={r.qty} onChange={(e)=>{
                    const v = Math.max(1, Number(e.target.value)||1); setRows(xs=>{ const cp=[...xs]; cp[idx]={...cp[idx], qty:v}; return cp })
                  }} />
                </td>
                <td className="py-1 px-3"><Input placeholder="Примечание" value={r.note||''} onChange={(e)=>{ const v=e.target.value; setRows(xs=>{ const cp=[...xs]; cp[idx]={...cp[idx], note:v}; return cp }) }} /></td>
                <td className="py-1 px-3 text-right"><Button size="sm" variant="destructive" onClick={()=>setRows(xs=>xs.filter(x=>x.product.id!==r.product.id))}>Удалить</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
