import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const saleId = params.id
  const sale = await prisma.sale.findUnique({ where: { id: saleId } })
  if (!sale || sale.status !== 'OPEN') return NextResponse.json({ error: 'SALE_NOT_OPEN' }, { status: 400 })
  if (sale.sellerId !== session.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  await prisma.sale.update({ where: { id: saleId }, data: { status: 'CANCELLED', closedAt: new Date() } })
  await audit('SALE_CANCEL', session.sub, { saleId })
  return NextResponse.json({ ok: true })
}
