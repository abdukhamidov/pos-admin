"use client"
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mini/ui'
import { AddUserForm } from '@/components/AddUserForm'

type User = { id: string; username: string; name: string; role: 'ADMIN' | 'SELLER'; createdAt: string }

export function UsersManager() {
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      setItems(data)
    } catch (e) {
      setError('Не удалось загрузить пользователей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function onDelete(id: string) {
    if (!confirm('Удалить пользователя?')) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) setItems((xs) => xs.filter((x) => x.id !== id))
    else alert((await res.json()).error || 'Ошибка удаления')
  }

  async function onEdit(u: User) {
    const username = prompt('Логин:', u.username)?.trim()
    if (username === undefined) return
    const name = prompt('Имя (ФИО):', u.name)?.trim()
    const role = prompt('Роль (ADMIN/SELLER):', u.role)?.trim().toUpperCase()
    const password = prompt('Новый пароль (Enter — без изменений):', '')
    const body: any = {}
    if (username && username !== u.username) body.username = username
    if (name && name !== u.name) body.name = name
    if (role === 'ADMIN' || role === 'SELLER') body.role = role
    if (password) body.password = password
    if (!Object.keys(body).length) return
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    if (res.ok) load()
    else alert((await res.json()).error || 'Ошибка сохранения')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader><CardTitle>Добавить пользователя</CardTitle></CardHeader>
        <CardContent>
          <AddUserForm onCreated={load} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Пользователи</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          <div className="grid grid-cols-5 text-sm font-medium border-b pb-2">
            <div>Логин</div>
            <div>Имя</div>
            <div>Роль</div>
            <div>Создан</div>
            <div className="text-right">Действия</div>
          </div>
          {items.map((u) => (
            <div key={u.id} className="grid grid-cols-5 items-center text-sm border-b py-2 gap-2">
              <div className="truncate">{u.username}</div>
              <div className="truncate">{u.name}</div>
              <div>{u.role}</div>
              <div>{new Date(u.createdAt).toLocaleString()}</div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(u)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(u.id)}>Удалить</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

