import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const shift = await prisma.shift.findFirst({ where: { sellerId: session.sub, endedAt: null } })
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  return NextResponse.json(shift ? { ...shift, sellerName: user?.name || user?.username || '' } : null)
}
