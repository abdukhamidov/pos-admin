import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().nullable().optional(),
  price: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const data: any = {}
  for (const k of Object.keys(parsed.data)) {
    const v = (parsed.data as any)[k]
    if (v !== undefined) data[k] = v
  }
  if (data.sku === null) data.sku = undefined
  try {
    const product = await prisma.product.update({ where: { id }, data })
    await audit('PRODUCT_UPDATE', session.sub, { id, data })
    return NextResponse.json(product)
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'DUPLICATE_SKU' }, { status: 409 })
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  await prisma.$transaction(async (tx) => {
    await tx.saleItem.deleteMany({ where: { productId: id } })
    await tx.stockMove.deleteMany({ where: { productId: id } })
    await tx.inventory.deleteMany({ where: { productId: id } })
    await tx.product.delete({ where: { id } })
  })
  await audit('PRODUCT_DELETE', session.sub, { id })
  return NextResponse.json({ ok: true })
}
