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

  const where: any = {}
  if (from || to) where.startedAt = {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }
  if (seller) where.sellerId = seller
  if (branchId) where.branchId = branchId

  const shifts = await prisma.shift.findMany({
    where,
    include: { seller: true, sales: true },
    orderBy: { startedAt: 'desc' },
    take: 200,
  })

  const rows = shifts.map((sh) => {
    const completed = sh.sales.filter((s) => s.status === 'COMPLETED')
    const cancelled = sh.sales.filter((s) => s.status === 'CANCELLED')
    const count = completed.length
    const sum = completed.reduce((acc, s) => acc + s.total, 0)
    const avg = count ? Math.round(sum / count) : 0
    const durationMs = (sh.endedAt ? +sh.endedAt : Date.now()) - +sh.startedAt
    return {
      id: sh.id,
      seller: sh.seller.name,
      startedAt: sh.startedAt,
      endedAt: sh.endedAt,
      durationMs,
      checks: count,
      sum,
      avg,
      cancelled: cancelled.length,
      openingNote: sh.openingNote,
      closingNote: sh.closingNote,
    }
  })
  return NextResponse.json(rows)
}
