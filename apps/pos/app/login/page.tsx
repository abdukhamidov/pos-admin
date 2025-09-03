"use client"
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Input, Label, Button, Card, CardHeader, CardTitle, CardContent } from '@mini/ui'

const schema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(8, 'Минимум 8 символов'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const onSubmit = async (data: FormValues) => {
    setError(null)
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) window.location.href = '/pos'
    else setError('Неверные учетные данные')
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Вход в POS</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input id="username" autoFocus {...register('username')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" {...register('password')} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? 'Входим…' : 'Войти'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

