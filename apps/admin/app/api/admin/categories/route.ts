import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  return NextResponse.json(categories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    productCount: c._count.products,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const { name, description } = parsed.data
  try {
    const cat = await prisma.category.create({ data: { name, description } })
    await audit('CATEGORY_CREATE', session.sub, { id: cat.id, name })
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'DUPLICATE_NAME' }, { status: 409 })
    }
    throw e
  }
}

