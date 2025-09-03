import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const sellerId = session.sub
  const user = await prisma.user.findUnique({ where: { id: sellerId } })
  if (!user?.branchId) return NextResponse.json({ error: 'NO_BRANCH_ASSIGNED' }, { status: 400 })
  const current = await prisma.shift.findFirst({ where: { sellerId, endedAt: null } })
  if (current) return NextResponse.json({ error: 'SHIFT_ALREADY_OPEN' }, { status: 400 })

  const { openingNote, openingCash } = (await req.json().catch(() => ({}))) as any
  const shift = await prisma.shift.create({ data: { sellerId, branchId: user.branchId, openingNote, openingCash } })
  await audit('SHIFT_OPEN', sellerId, { shiftId: shift.id, openingCash })
  return NextResponse.json(shift)
}
