"use client"
import { useEffect, useMemo, useState } from 'react'
import { Button, Input } from '@mini/ui'
import { AddUserForm } from '@/components/AddUserForm'
import { Modal } from '@/components/Modal'
import { EditUserForm } from '@/components/EditUserForm'

type User = {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'SELLER'
  createdAt: string
  branchId?: string | null
  branchName?: string | null
  warehouseName?: string | null
}

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'ALL'|'ADMIN'|'SELLER'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/users', { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return items.filter(u => {
      if (role !== 'ALL' && u.role !== role) return false
      if (query) {
        const q = query.toLowerCase()
        if (!(`${u.name||''} ${u.username||''} ${u.branchName||''}`).toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [items, role, query])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const pageItems = useMemo(() => filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize), [filtered, page, pageSize])

  function onEdit(u: User) { setEditUser(u) }
  async function onDelete(id: string) {
    if (!confirm('Удалить пользователя?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) load(); else alert((await res.json()).error || 'Ошибка удаления')
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <div className="ml-auto flex items-center gap-2">
          <select className="h-9 rounded-md border px-3 text-sm" value={role} onChange={(e)=>{ setRole(e.target.value as any); setPage(1) }}>
            <option value="ALL">Все</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SELLER">SELLER</option>
          </select>
          <Input placeholder="Поиск по имени/логину..." className="w-64" value={query} onChange={(e)=>{ setQuery(e.target.value); setPage(1) }} />
          <Button onClick={() => setShowAdd(true)}>Добавить</Button>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-accent/40">
              <th className="py-2 px-3">Имя</th>
              <th className="py-2 px-3">Логин</th>
              <th className="py-2 px-3">Роль</th>
              <th className="py-2 px-3">Филиал</th>
              <th className="py-2 px-3">Склад (деф.)</th>
              <th className="py-2 px-3">Создан</th>
              <th className="py-2 px-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-accent/20">
                <td className="py-1 px-3 whitespace-nowrap">{u.name || '-'}</td>
                <td className="py-1 px-3">{u.username}</td>
                <td className="py-1 px-3">{u.role}</td>
                <td className="py-1 px-3">{u.branchName || '-'}</td>
                <td className="py-1 px-3">{u.warehouseName || '-'}</td>
                <td className="py-1 px-3 whitespace-nowrap">{new Date(u.createdAt).toLocaleString('ru-RU')}</td>
                <td className="py-1 px-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={()=>onEdit(u)}>Править</Button>{' '}
                  <Button size="sm" variant="destructive" onClick={()=>onDelete(u.id)}>Удалить</Button>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Добавить пользователя">
        <AddUserForm onCreated={() => { setShowAdd(false); load() }} />
      </Modal>
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Редактировать пользователя">
        {editUser && (
          <EditUserForm user={editUser} onSaved={() => { setEditUser(null); load() }} onCancel={() => setEditUser(null)} />
        )}
      </Modal>
    </main>
  )
}

