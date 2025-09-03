import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@mini/auth'

const POS_COOKIE = process.env.POS_SESSION_COOKIE || 'mini_crm_pos'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(POS_COOKIE)?.value
  const session = token ? await verifySession(token) : null
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  if (session.role !== 'SELLER' && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|assets|images).*)'],
}
