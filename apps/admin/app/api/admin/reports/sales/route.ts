import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const seller = searchParams.get('seller') || undefined
  const branchId = searchParams.get('branchId') || undefined
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (from || to) where.createdAt = {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }
  if (seller) where.sellerId = seller
  if (branchId) where.branchId = branchId
  if (status) where.status = status as any

  const sales = await prisma.sale.findMany({
    where,
    include: { items: true, seller: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  const rows = sales.map((s) => ({
    id: s.id,
    number: s.number,
    day: s.day,
    date: s.createdAt,
    seller: s.seller.name,
    items: s.items.length,
    total: s.total,
    status: s.status,
  }))
  return NextResponse.json(rows)
}
