import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { formatDayKey } from '@mini/utils'

export async function GET(_req: NextRequest) {
  const day = formatDayKey(new Date())

  const sales = await prisma.sale.findMany({
    where: { day, status: 'COMPLETED' },
    select: { total: true },
  })

  const revenue = sales.reduce((s, x) => s + x.total, 0)
  const count = sales.length
  const avg = count ? Math.round(revenue / count) : 0

  const top = await prisma.saleItem.groupBy({
    by: ['productId', 'nameSnapshot'],
    where: { sale: { is: { day, status: 'COMPLETED' } } },
    _sum: { subtotal: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: 1,
  })

  return NextResponse.json({ revenue, count, avg, topProduct: top[0]?.nameSnapshot ?? null })
}

