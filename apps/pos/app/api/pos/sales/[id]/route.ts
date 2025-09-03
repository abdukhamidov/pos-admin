import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const sale = await prisma.sale.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!sale || sale.sellerId !== session.sub) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json(sale)
}

