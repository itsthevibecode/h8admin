import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'
import { sessionNeedsSecondFactor, hasVerifiedFactor } from '@/lib/session-mfa'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/join/') ||
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/api/')

  // Protect routes: Redirect unauthenticated users to /login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    const nextPath = `${pathname}${request.nextUrl.search}`
    url.searchParams.set('callbackUrl', nextPath)
    return NextResponse.redirect(url)
  }

  if (user) {
    const verified = hasVerifiedFactor(user)
    const needsSecondFactor = verified && (await sessionNeedsSecondFactor(supabase, user))
    const openWhilePending =
      pathname.startsWith('/join/') ||
      pathname.startsWith('/legal/') ||
      pathname === '/api/auth/can-register'
    const passwordRecovery = pathname === '/login/update-password'
    if (!verified) {
      if (pathname.startsWith('/api/') && !openWhilePending) {
        const denied = NextResponse.json({ error: 'Authenticator setup is required' }, { status: 401 })
        supabaseResponse.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie))
        return denied
      }
      if (
        pathname !== '/login/enroll' &&
        !passwordRecovery &&
        !openWhilePending &&
        !pathname.startsWith('/api/')
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login/enroll'
        url.search = ''
        return redirectWithSession(url, supabaseResponse)
      }
    } else if (needsSecondFactor) {
      if (pathname.startsWith('/api/') && !openWhilePending) {
        const denied = NextResponse.json({ error: 'Two-factor verification required' }, { status: 401 })
        supabaseResponse.cookies.getAll().forEach((cookie) => denied.cookies.set(cookie))
        return denied
      }
      if (
        pathname !== '/login/verify' &&
        !passwordRecovery &&
        !openWhilePending &&
        !pathname.startsWith('/api/')
      ) {
        const url = request.nextUrl.clone()
        const callback = pathname.startsWith('/login')
          ? getSafeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'))
          : `${pathname}${request.nextUrl.search}`
        url.pathname = '/login/verify'
        url.search = ''
        url.searchParams.set('callbackUrl', callback)
        return redirectWithSession(url, supabaseResponse)
      }
    } else if (pathname.startsWith('/login') && !passwordRecovery) {
      const url = request.nextUrl.clone()
      const callbackUrl = getSafeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'))
      const destination = new URL(callbackUrl, request.nextUrl.origin)
      url.pathname = destination.pathname
      url.search = destination.search
      return redirectWithSession(url, supabaseResponse)
    }
  }

  return supabaseResponse
}

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url)
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}