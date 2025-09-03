import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'mini_crm_session'

export type SessionPayload = {
  sub: string // user id
  role: 'ADMIN' | 'SELLER'
  username: string
  name: string
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload, ttlHours = 24) {
  const key = getSecretKey()
  const now = Math.floor(Date.now() / 1000)
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlHours * 3600)
    .sign(key)
  return token
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const key = getSecretKey()
    const { payload } = await jwtVerify(token, key)
    const { sub, role, username, name } = payload as any
    if (!sub || !role || !username || !name) return null
    return { sub, role, username, name }
  } catch {
    return null
  }
}

