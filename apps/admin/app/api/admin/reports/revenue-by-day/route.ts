import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const branchId = searchParams.get('branchId') || undefined

  const where: any = { status: 'COMPLETED' as const }
  if (from || to) where.createdAt = {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }

  if (branchId) where.branchId = branchId
  const sales = await prisma.sale.findMany({ where, select: { day: true, total: true } })
  const map = new Map<string, { day: string; sum: number; count: number }>()
  for (const s of sales) {
    const k = s.day
    const v = map.get(k) || { day: k, sum: 0, count: 0 }
    v.sum += s.total
    v.count += 1
    map.set(k, v)
  }
  const rows = Array.from(map.values()).sort((a, b) => (a.day < b.day ? -1 : 1)).map((x) => ({
    date: x.day,
    sum: x.sum,
    checks: x.count,
    avg: x.count ? Math.round(x.sum / x.count) : 0,
  }))
  return NextResponse.json(rows)
}
