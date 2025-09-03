import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({ productId: z.string().min(1), qty: z.number().int().min(1) })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const saleId = params.id
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })

  const sale = await prisma.sale.findUnique({ where: { id: saleId }, include: { items: true } })
  if (!sale || sale.status !== 'OPEN') return NextResponse.json({ error: 'SALE_NOT_OPEN' }, { status: 400 })
  if (sale.sellerId !== session.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
  if (!product || !product.isActive) return NextResponse.json({ error: 'PRODUCT_NOT_AVAILABLE' }, { status: 400 })

  // check stock in seller's default warehouse (by branch)
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  const warehouse = user?.branchId ? await prisma.warehouse.findFirst({ where: { branchId: user.branchId, isDefault: true } }) : null
  if (!warehouse) return NextResponse.json({ error: 'WAREHOUSE_NOT_FOUND' }, { status: 400 })
  const inv = await prisma.inventory.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } } })
  const available = inv?.qty ?? 0
  const existingQty = sale.items.filter(i => i.productId === product.id).reduce((s, i) => s + i.qty, 0)
  if (available < existingQty + parsed.data.qty) return NextResponse.json({ error: 'INSUFFICIENT_STOCK' }, { status: 400 })

  const item = await prisma.saleItem.create({
    data: {
      saleId,
      productId: product.id,
      nameSnapshot: product.name,
      price: product.price,
      qty: parsed.data.qty,
      subtotal: product.price * parsed.data.qty,
    },
  })
  await audit('SALE_ADD_ITEM', session.sub, { saleId, itemId: item.id, productId: product.id, qty: parsed.data.qty })
  return NextResponse.json(item)
}
