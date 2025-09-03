import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const shiftId = params.id
  if (!shiftId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })

  const sales = await prisma.sale.findMany({
    where: { shiftId, status: 'COMPLETED' },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
    take: 1000,
  })

  // aggregate by product (by productId if present, otherwise by nameSnapshot)
  const map = new Map<string, { key: string; productId?: string; name: string; qty: number; revenue: number }>()
  for (const s of sales) {
    for (const it of s.items) {
      const key = it.productId || it.nameSnapshot
      const v = map.get(key) || { key, productId: it.productId || undefined, name: it.nameSnapshot, qty: 0, revenue: 0 }
      v.qty += it.qty
      v.revenue += it.subtotal
      map.set(key, v)
    }
  }
  const items = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  const totals = { checks: sales.length, qty: items.reduce((s, x) => s + x.qty, 0), revenue: items.reduce((s, x) => s + x.revenue, 0) }

  return NextResponse.json({ items, totals })
}

