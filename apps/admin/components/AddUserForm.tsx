"use client"
import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Branch = { id: string; name: string }

export function AddUserForm({ onCreated }: { onCreated?: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [form, setForm] = useState({ username: '', name: '', role: 'SELLER', password: '', branchId: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/admin/branches').then(r => r.json()).then(setBranches) }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }) }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setLoading(false)
    if (res.ok) { setForm({ username: '', name: '', role: 'SELLER', password: '', branchId: '' }); onCreated?.() } else setError((await res.json()).error || 'Ошибка')
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <div className="space-y-1"><Label>Логин</Label><Input value={form.username} onChange={e => set('username', e.target.value)} /></div>
      <div className="space-y-1"><Label>Имя</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
      <div className="space-y-1">
        <Label>Роль</Label>
        <select className="border rounded-md h-9 px-3 w-full" value={form.role} onChange={e => set('role', e.target.value as any)}>
          <option value="ADMIN">ADMIN</option>
          <option value="SELLER">SELLER</option>
        </select>
      </div>
      {form.role === 'SELLER' && (
        <div className="space-y-1">
          <Label>Филиал</Label>
          <select className="border rounded-md h-9 px-3 w-full" value={form.branchId} onChange={e => set('branchId', e.target.value)}>
            <option value="">— Выберите филиал —</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div className="space-y-1"><Label>Пароль</Label><Input type="password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Button type="submit" disabled={loading || form.password.length < 8 || !form.username || !form.name || (form.role === 'SELLER' && !form.branchId)}>
        {loading ? 'Сохранение…' : 'Добавить'}
      </Button>
    </form>
  )
}

