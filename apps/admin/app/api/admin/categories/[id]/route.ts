import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const data: any = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.description !== undefined) data.description = parsed.data.description
  try {
    const cat = await prisma.category.update({ where: { id }, data })
    await audit('CATEGORY_UPDATE', session.sub, { id, data })
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'DUPLICATE_NAME' }, { status: 409 })
    }
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const count = await prisma.product.count({ where: { categoryId: id } })
  if (count > 0) {
    return NextResponse.json({ error: 'CATEGORY_HAS_PRODUCTS' }, { status: 400 })
  }
  await prisma.category.delete({ where: { id } })
  await audit('CATEGORY_DELETE', session.sub, { id })
  return NextResponse.json({ ok: true })
}

