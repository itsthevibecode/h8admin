import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeCallbackUrl } from '@/lib/auth-redirect'

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
  const referralMatch = pathname.match(/^\/join\/ref\/([^/]+)/)
  if (referralMatch?.[1]) {
    supabaseResponse.cookies.set(
      'referral_code',
      decodeURIComponent(referralMatch[1]).trim().toUpperCase(),
      {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    })
  }

  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/join/') ||
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

  // Redirect authenticated users away from /login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    const callbackUrl = getSafeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'))
    const destination = new URL(callbackUrl, request.nextUrl.origin)
    url.pathname = destination.pathname
    url.search = destination.search
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}