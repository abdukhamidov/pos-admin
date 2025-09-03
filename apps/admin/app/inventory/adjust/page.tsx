"use client"
import { useEffect, useState } from 'react'
import { Button, Input, toast } from '@mini/ui'

type Warehouse = { id: string; name: string; branch?: { id: string; name: string } }
type Product = { id: string; name: string; sku?: string | null }

export default function AdjustPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [query, setQuery] = useState('')
  const [lookup, setLookup] = useState<Product[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [delta, setDelta] = useState<number>(0)
  const [reason, setReason] = useState<'count'|'damage'|'other'>('other')
  const [note, setNote] = useState('')
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

  async function submit() {
    if (!warehouseId) return alert('Выберите склад')
    if (!product) return alert('Выберите товар')
    if (!delta || delta === 0) return alert('Укажите изменение (может быть + или -)')
    setLoading(true)
    const payload = { warehouseId, productId: product.id, delta, reason, note: note || undefined }
    const res = await fetch('/api/admin/inventory/adjust', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setLoading(false)
    const j = await res.json().catch(()=>({}))
    if (!res.ok) { toast.error({ title: 'Ошибка корректировки', description: j.error || 'ADJUST_FAILED' }); return }
    toast.success({ title: 'Корректировка применена', description: `Новый остаток: ${j.qtyAfter}` })
    setProduct(null); setQuery(''); setLookup([]); setDelta(0); setReason('other'); setNote('')
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Корректировка остатков</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-sm">Склад</label>
          <select className="h-9 rounded-md border px-3 text-sm w-full" value={warehouseId} onChange={(e)=>setWarehouseId(e.target.value)}>
            <option value="">Выберите склад</option>
            {warehouses.map(w => (<option key={w.id} value={w.id}>{w.branch?.name ? `${w.branch.name} — ${w.name}` : w.name}</option>))}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-sm">Товар</label>
          {product ? (
            <div className="flex items-center gap-2">
              <div className="text-sm">{product.name} <span className="text-muted-foreground">{product.sku || '-'}</span></div>
              <Button variant="outline" size="sm" onClick={()=>{ setProduct(null); setQuery(''); }}>Сменить</Button>
            </div>
          ) : (
            <div>
              <Input placeholder="Поиск товара..." value={query} onChange={(e)=>setQuery(e.target.value)} />
              {!!lookup.length && (
                <div className="rounded-md border mt-2 max-h-56 overflow-auto">
                  <table className="min-w-full text-sm"><tbody>
                    {lookup.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-accent/20 cursor-pointer" onClick={()=>{ setProduct(p); setLookup([]) }}>
                        <td className="py-1 px-3">{p.name}</td>
                        <td className="py-1 px-3 text-muted-foreground">{p.sku || '-'}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <label className="text-sm">Изменение (delta)</label>
          <Input type="number" value={Number.isFinite(delta) ? delta : 0} onChange={(e)=>setDelta(parseInt(e.target.value || '0', 10))} />
          <div className="text-xs text-muted-foreground">Положительное значение — добавить, отрицательное — списать.</div>
        </div>
        <div className="space-y-3">
          <label className="text-sm">Причина</label>
          <select className="h-9 rounded-md border px-3 text-sm w-full" value={reason} onChange={(e)=>setReason(e.target.value as any)}>
            <option value="count">Инвентаризация</option>
            <option value="damage">Порча/бой</option>
            <option value="other">Другое</option>
          </select>
          <label className="text-sm">Комментарий</label>
          <Input placeholder="Примечание" value={note} onChange={(e)=>setNote(e.target.value)} />
        </div>
      </div>
      <div className="pt-2">
        <Button onClick={submit} disabled={!warehouseId || !product || !delta || loading}>{loading ? 'Сохраняем...' : 'Применить'}</Button>
      </div>
    </main>
  )
}
