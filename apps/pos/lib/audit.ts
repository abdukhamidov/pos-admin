import { prisma } from '@mini/db'

export async function audit(action: string, userId: string | null, meta: any = {}) {
  try { await prisma.auditLog.create({ data: { action, userId: userId ?? undefined, meta } }) } catch {}
}

