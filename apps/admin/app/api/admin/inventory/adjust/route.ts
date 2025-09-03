import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const schema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  delta: z.number().int().refine((v) => v !== 0, { message: 'DELTA_NOT_ZERO' }),
  reason: z.enum(['count', 'damage', 'other']).default('other'),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const { warehouseId, productId, delta, reason, note } = parsed.data

  try {
    const qtyAfter = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({ where: { productId_warehouseId: { productId, warehouseId } } })
      const current = inv?.qty ?? 0
      const next = current + delta
      if (next < 0) {
        throw new Error('NEGATIVE_STOCK')
      }
      if (inv) {
        await tx.inventory.update({ where: { id: inv.id }, data: { qty: next } })
      } else {
        if (delta < 0) throw new Error('NEGATIVE_STOCK')
        await tx.inventory.create({ data: { productId, warehouseId, qty: next } })
      }
      // log move (best-effort)
      try {
        const sm: any = (tx as any).stockMove
        if (sm?.create) {
          await sm.create({ data: { productId, warehouseId, delta, type: 'ADJUSTMENT', reason, note, userId: (session as any).sub ?? undefined } })
        }
      } catch {}
      return next
    })

    await audit('INVENTORY_ADJUST', session.sub, { warehouseId, productId, delta, reason })
    return NextResponse.json({ warehouseId, productId, qtyAfter })
  } catch (e: any) {
    if (e?.message === 'NEGATIVE_STOCK') return NextResponse.json({ error: 'NEGATIVE_STOCK' }, { status: 400 })
    console.error('adjust failed', e)
    return NextResponse.json({ error: 'ADJUST_FAILED' }, { status: 500 })
  }
}
