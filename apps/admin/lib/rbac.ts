import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@mini/auth'

const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE || 'mini_crm_admin'

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return null
  return await verifySession(token)
}

export async function requireRole(req: NextRequest, roles: Array<'ADMIN' | 'SELLER'>) {
  const session = await getSessionFromRequest(req)
  if (!session || !roles.includes(session.role)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  return session
}
