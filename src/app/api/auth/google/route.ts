import { cookies } from 'next/headers'
import { newSecret } from '@worker/auth'
import { googleAuthUrl } from '@worker/google'
import { NextResponse } from 'next/server'
import { env, OAUTH_COOKIE, OAUTH_PATH, route } from '@/lib/server'

// Google sign-in. State lives in a short cookie scoped to these two routes; the callback redirects back into the app.
export const GET = route(async (req) => {
  const state = newSecret()
  ;(await cookies()).set(OAUTH_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', path: OAUTH_PATH, maxAge: 600 })
  return NextResponse.redirect(googleAuthUrl(env().GOOGLE_CLIENT_ID, new URL(req.url).origin, state))
})
