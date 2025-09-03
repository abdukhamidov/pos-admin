import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({ itemId: z.string().min(1) })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const saleId = params.id
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const sale = await prisma.sale.findUnique({ where: { id: saleId } })
  if (!sale || sale.status !== 'OPEN') return NextResponse.json({ error: 'SALE_NOT_OPEN' }, { status: 400 })
  if (sale.sellerId !== session.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  // Idempotent, sale-scoped delete to avoid P2025 on stale clients
  const { count } = await prisma.saleItem.deleteMany({ where: { id: parsed.data.itemId, saleId } })
  await audit('SALE_REMOVE_ITEM', session.sub, { saleId, itemId: parsed.data.itemId, deleted: count })
  return NextResponse.json({ ok: true, deleted: count })
}
