import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const sellerId = session.sub
  const current = await prisma.shift.findFirst({ where: { sellerId, endedAt: null } })
  if (!current) return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 400 })

  const openSales = await prisma.sale.count({ where: { sellerId, shiftId: current.id, status: 'OPEN' } })
  if (openSales > 0) return NextResponse.json({ error: 'OPEN_SALES_EXIST' }, { status: 400 })

  const { closingNote, closingCash } = (await req.json().catch(() => ({}))) as any
  const shift = await prisma.shift.update({
    where: { id: current.id },
    data: { endedAt: new Date(), closingNote, closingCash },
  })
  await audit('SHIFT_CLOSE', sellerId, { shiftId: shift.id, closingCash })
  return NextResponse.json(shift)
}
