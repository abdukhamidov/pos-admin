import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'
import { formatDayKey } from '@mini/utils'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const day = formatDayKey(new Date())
  const sales = await prisma.sale.findMany({ where: { day, status: 'COMPLETED' }, select: { branchId: true, total: true } })
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } })
  const map = new Map<string, { id: string; name: string; checks: number; revenue: number }>()
  for (const b of branches) map.set(b.id, { id: b.id, name: b.name, checks: 0, revenue: 0 })
  for (const s of sales) {
    const rec = map.get(s.branchId)
    if (rec) { rec.checks += 1; rec.revenue += s.total }
  }
  const rows = Array.from(map.values()).map(r => ({ ...r, avg: r.checks ? Math.round(r.revenue / r.checks) : 0 }))
  return NextResponse.json(rows)
}

