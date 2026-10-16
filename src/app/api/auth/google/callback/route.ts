import { cookies } from 'next/headers'
import { createSession, hostForEmail } from '@worker/db'
import { exchangeCode } from '@worker/google'
import { NextResponse } from 'next/server'
import { env, OAUTH_COOKIE, OAUTH_PATH, route, setSession } from '@/lib/server'

export const GET = route(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const jar = await cookies()
  const expected = jar.get(OAUTH_COOKIE)?.value
  jar.delete({ name: OAUTH_COOKIE, path: OAUTH_PATH })
  const email = code && state && expected === state ? await exchangeCode(env(), url.origin, code) : null
  if (!email) return NextResponse.redirect(new URL('/?error=' + encodeURIComponent("Google sign-in didn't go through. Try again."), url))
  await setSession(await createSession(env(), (await hostForEmail(env(), email)).id))
  return NextResponse.redirect(new URL('/app', url))
})
