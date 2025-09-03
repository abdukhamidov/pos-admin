import { NextRequest } from 'next/server'
import { verifySession } from '@mini/auth'

const POS_COOKIE = process.env.POS_SESSION_COOKIE || 'mini_crm_pos'

export async function getSession(req: NextRequest) {
  const token = req.cookies.get(POS_COOKIE)?.value
  if (!token) return null
  return await verifySession(token)
}
