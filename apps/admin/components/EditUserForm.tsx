"use client"
import { useEffect, useState } from 'react'
import { Button, Input, Label } from '@mini/ui'

type Branch = { id: string; name: string }
type User = {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'SELLER'
  branchId?: string | null
}

export function EditUserForm({ user, onSaved, onCancel }: { user: User; onSaved?: () => void; onCancel?: () => void }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [form, setForm] = useState({ username: user.username, name: user.name, role: user.role, branchId: user.branchId || '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetch('/api/admin/branches').then(r => r.json()).then(setBranches) }, [])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: any = {}
    if (form.username !== user.username) body.username = form.username
    if (form.name !== user.name) body.name = form.name
    if (form.role !== user.role) body.role = form.role
    if ((form.role === 'SELLER' ? (form.branchId || '') : '') !== (user.branchId || '')) {
      if (form.role === 'SELLER') body.branchId = form.branchId
      else body.branchId = null as any
    }
    if (form.password) body.password = form.password
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) onSaved?.()
    else setError((await res.json()).error || 'Ошибка сохранения')
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
            <option value="">Выберите филиал</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div className="space-y-1"><Label>Новый пароль</Label><Input type="password" placeholder="Оставьте пустым без изменений" value={form.password} onChange={e => set('password', e.target.value)} /></div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={loading || !form.username || !form.name || (form.role === 'SELLER' && !form.branchId)}>
          {loading ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
    </form>
  )
}

