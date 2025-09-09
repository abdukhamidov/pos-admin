import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  // determine default warehouse for seller's branch
  const user = await prisma.user.findUnique({ where: { id: session.sub } })
  const warehouse = user?.branchId
    ? await prisma.warehouse.findFirst({ where: { branchId: user.branchId, isDefault: true } })
    : null
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const query = searchParams.get('query') || undefined
  const products = await prisma.product.findMany({
    where: {
      AND: [
        { isActive: true },
        categoryId ? { categoryId } : {},
        query
          ? {
              OR: [
                { name: { contains: query } },
                { sku: { contains: query } },
              ],
            }
          : {},
      ],
    },
    include: warehouse ? { inventory: { where: { warehouseId: warehouse.id } } } : undefined,
    orderBy: { name: 'asc' },
  })
  const mapped = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    categoryId: p.categoryId,
    isActive: p.isActive,
    stock: Array.isArray(p.inventory) ? (p.inventory[0]?.qty ?? 0) : undefined,
  }))
  return NextResponse.json(mapped)
}
