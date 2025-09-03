import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({ itemId: z.string().min(1), qty: z.number().int().min(1).optional() })

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
  const item = sale.items.find((i) => i.id === parsed.data.itemId)
  if (!item) return NextResponse.json({ error: 'ITEM_NOT_FOUND' }, { status: 404 })
  const product = await prisma.product.findUnique({ where: { id: item.productId } })
  if (!product) return NextResponse.json({ error: 'PRODUCT_NOT_FOUND' }, { status: 404 })

  // Проверяем остатки в складе по филиалу продавца, как и в add-item
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  const warehouse = user?.branchId
    ? await prisma.warehouse.findFirst({ where: { branchId: user.branchId, isDefault: true } })
    : null
  if (!warehouse) return NextResponse.json({ error: 'WAREHOUSE_NOT_FOUND' }, { status: 400 })

  const inv = await prisma.inventory.findUnique({
    where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
  })
  const available = inv?.qty ?? 0

  const otherQty = sale.items
    .filter((i) => i.productId === product.id && i.id !== item.id)
    .reduce((s, i) => s + i.qty, 0)
  const newQty = parsed.data.qty ?? item.qty
  if (available < otherQty + newQty)
    return NextResponse.json({ error: 'INSUFFICIENT_STOCK' }, { status: 400 })

  const updated = await prisma.saleItem.update({
    where: { id: item.id },
    data: { qty: newQty, subtotal: newQty * item.price },
  })
  await audit('SALE_UPDATE_ITEM', session.sub, { saleId, itemId: item.id, qty: newQty })
  return NextResponse.json(updated)
}
