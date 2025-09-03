import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'
import { audit } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const saleId = params.id

  // получаем продажу и проверяем статус/владельца
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  })
  if (!sale || sale.status !== 'OPEN') {
    return NextResponse.json({ error: 'SALE_NOT_OPEN' }, { status: 400 })
  }
  if (sale.sellerId !== session.sub) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  // проверяем, что у продавца есть активная смена
  const shift = await prisma.shift.findFirst({
    where: { sellerId: session.sub, endedAt: null },
  })
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 400 })
  }

  // проверяем остатки на складе по умолчанию для филиала продавца
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  const warehouse = user?.branchId
    ? await prisma.warehouse.findFirst({
        where: { branchId: user.branchId, isDefault: true },
      })
    : null

  if (!warehouse) {
    return NextResponse.json({ error: 'WAREHOUSE_NOT_FOUND' }, { status: 400 })
  }

  const productIds = Array.from(new Set(sale.items.map((i) => i.productId)))
  const inventories = await prisma.inventory.findMany({
    where: { warehouseId: warehouse.id, productId: { in: productIds } },
  })

  for (const pid of productIds) {
    const need = sale.items
      .filter((i) => i.productId === pid)
      .reduce((s, i) => s + i.qty, 0)

    const inv = inventories.find((x) => x.productId === pid)
    const available = inv?.qty ?? 0

    if (available < need) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_STOCK', productId: pid },
        { status: 400 }
      )
    }
  }

  // сумма продажи
  const total = sale.items.reduce((s, i) => s + i.subtotal, 0)

  // фиксация: списываем со склада и закрываем продажу
  await prisma.$transaction([
    ...productIds.map((pid) => {
      const need = sale.items
        .filter((i) => i.productId === pid)
        .reduce((s, i) => s + i.qty, 0)

      return prisma.inventory.update({
        where: { productId_warehouseId: { productId: pid, warehouseId: warehouse.id } },
        data: { qty: { decrement: need } },
      })
    }),

    prisma.sale.update({
      where: { id: sale.id },
      data: {
        total,
        status: 'COMPLETED',
        closedAt: new Date(),
        shiftId: shift.id,
      },
    }),
  ])

  await audit('SALE_COMPLETE', session.sub, { saleId, total })

  return NextResponse.json({ ok: true, total })
}
