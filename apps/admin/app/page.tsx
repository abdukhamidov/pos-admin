import { Card, CardContent, CardHeader, CardTitle } from '@mini/ui'
import { headers } from 'next/headers'
import RecentSales from '@/components/RecentSales'
import LowStockList from '@/components/LowStockList'
import BranchToday from '@/components/BranchToday'

async function getStats() {
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = (h.get('x-forwarded-proto') || 'http').split(',')[0]
  const base = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${proto}://${host}` : `http://localhost:${process.env.PORT || '3000'}`)
  const res = await fetch(`${base}/api/admin/stats/today`, { cache: 'no-store', headers: { cookie: h.get('cookie') ?? '' } })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const stats = await getStats()
  return (
    <main className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Выручка (сегодня)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.revenue?.toLocaleString('ru-RU') ?? 0} сум</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Чеков</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.count ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Средний чек</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.avg ?? 0} сум</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Топ‑товар</CardTitle></CardHeader>
          <CardContent className="text-xl font-medium">{stats?.topProduct ?? '—'}</CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <RecentSales />
          <LowStockList />
        </div>
        <BranchToday />
      </div>
    </main>
  )
}
