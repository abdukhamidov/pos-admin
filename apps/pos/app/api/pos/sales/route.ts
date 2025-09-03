import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'
import { formatDayKey } from '@mini/utils'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status') || undefined

  const where: any = { sellerId: session.sub }
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
  if (status) where.status = status as any
  const sales = await prisma.sale.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true, seller: { select: { name: true, username: true } } },
  })
  return NextResponse.json(sales)
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  if (!user?.branchId) return NextResponse.json({ error: 'NO_BRANCH_ASSIGNED' }, { status: 400 })
  const day = formatDayKey(new Date())
  // next number per branch/day
  const last = await prisma.sale.findFirst({ where: { day, branchId: user.branchId }, orderBy: { number: 'desc' } })
  const number = (last?.number ?? 0) + 1
  const sale = await prisma.sale.create({ data: { day, number, sellerId: session.sub, status: 'OPEN', total: 0, branchId: user.branchId } })
  await audit('SALE_OPEN', session.sub, { saleId: sale.id, day, number })
  return NextResponse.json(sale)
}
