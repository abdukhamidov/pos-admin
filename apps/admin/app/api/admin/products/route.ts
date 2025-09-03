import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0).optional(), // initial stock for selected warehouse
  warehouseId: z.string().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') || undefined
  const categoryId = searchParams.get('categoryId') || undefined
  const status = searchParams.get('status') || undefined // active | inactive
  const warehouseId = searchParams.get('warehouseId') || undefined

  const products = await prisma.product.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
        status === 'active' ? { isActive: true } : {},
        status === 'inactive' ? { isActive: false } : {},
      ],
    },
    include: { category: true, inventory: { where: warehouseId ? { warehouseId } : undefined, include: { warehouse: true } } },
    orderBy: { name: 'asc' },
  })
  // Compute total stock across all warehouses for each product
  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    isActive: p.isActive,
    categoryId: p.categoryId,
    category: p.category,
    stock: p.inventory.reduce((s, i) => s + i.qty, 0),
    inventories: p.inventory.map((i) => ({
      warehouseId: i.warehouseId,
      warehouseName: i.warehouse?.name ?? null,
      qty: i.qty,
    })),
    warehouseId: warehouseId ?? null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const { name, sku, price, stock = 0, warehouseId, isActive = true, categoryId } = parsed.data
  try {
    const product = await prisma.product.create({ data: { name, sku: sku ?? undefined, price, isActive, categoryId } })
    if (stock && warehouseId) {
      await prisma.inventory.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        update: { qty: stock },
        create: { productId: product.id, warehouseId, qty: stock },
      })
    }
    await audit('PRODUCT_CREATE', session.sub, { id: product.id, name })
    return NextResponse.json(product)
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'DUPLICATE_SKU' }, { status: 409 })
    }
    throw e
  }
}
