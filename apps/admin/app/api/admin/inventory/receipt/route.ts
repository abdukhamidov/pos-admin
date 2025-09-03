import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const schema = z.object({
  warehouseId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    qty: z.number().int().positive(),
    note: z.string().optional(),
  })).min(1),
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

  const { warehouseId, items } = parsed.data

  try {
    const results = await prisma.$transaction(async (tx) => {
      const res: Array<{ productId: string; qtyAfter: number }> = []
      for (const it of items) {
        // upsert inventory and increment by qty
        await tx.inventory.upsert({
          where: { productId_warehouseId: { productId: it.productId, warehouseId } },
          update: { qty: { increment: it.qty } },
          create: { productId: it.productId, warehouseId, qty: it.qty },
        })
        // read new qty
        const inv = await tx.inventory.findUniqueOrThrow({ where: { productId_warehouseId: { productId: it.productId, warehouseId } } })
        res.push({ productId: it.productId, qtyAfter: inv.qty })
        // log move (best-effort: tolerate missing client/model before migration)
        try {
          const sm: any = (tx as any).stockMove
          if (sm?.create) {
            await sm.create({ data: {
              productId: it.productId,
              warehouseId,
              delta: it.qty,
              type: 'RECEIPT',
              reason: 'receipt',
              note: it.note,
              userId: (session as any).sub ?? undefined,
            } })
          }
        } catch {}
      }
      return res
    })

    await audit('INVENTORY_RECEIPT', session.sub, { warehouseId, items: items.map(i => ({ productId: i.productId, qty: i.qty })) })
    return NextResponse.json({ warehouseId, results })
  } catch (e: any) {
    console.error('receipt failed', e)
    return NextResponse.json({ error: 'RECEIPT_FAILED' }, { status: 500 })
  }
}
