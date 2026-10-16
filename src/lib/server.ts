// Server-only glue between Next route handlers / server components and the D1/R2 code in worker/.
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getProperty, hostForSession, type Host, type Property } from '@worker/db'

export const SESSION_COOKIE = 'sb_session'
export const OAUTH_COOKIE = 'sb_oauth'
export const OAUTH_PATH = '/api/auth/google'

export const env = () => getCloudflareContext().env as unknown as Env

export const json = (data: unknown, status = 200) => Response.json(data, { status })

/** Request body as T, or {} when it is missing or not JSON. */
export const body = <T extends object>(req: Request): Promise<Partial<T>> => req.json().then((b) => (b && typeof b === 'object' ? b : {}), () => ({}))

export const guestUrl = (slug: string) => `${env().APP_URL}/g/${slug}`

/** Memoised per request, so a layout and its page share one session lookup. */
export const currentHost = cache(async (): Promise<Host | null> => {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value
  return sid ? hostForSession(env(), sid) : null
})

export async function setSession(id: string) {
  ;(await cookies()).set(SESSION_COOKIE, id, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 86_400 })
}

/** The signed-in host's property with this id, or null (missing and not-yours look the same). */
export async function ownProperty(id: string): Promise<Property | null> {
  const host = await currentHost()
  const p = host ? await getProperty(env(), id) : null
  return p && host && p.host_id === host.id ? p : null
}

type Ctx<P> = { params: Promise<P> }

/** Route handler that answers JSON 500 instead of an HTML error page. */
export const route = <P = object>(fn: (req: Request, params: P) => Promise<Response>) =>
  async (req: Request, ctx: Ctx<P>) => {
    try {
      return await fn(req, await ctx.params)
    } catch (e) {
      console.error(e)
      return json({ error: 'Something went wrong' }, 500)
    }
  }

/** Route handler for /api/properties/[id]/…: 401 when signed out, 404 unless the host owns the property. */
export const propertyRoute = <P extends { id: string }>(fn: (p: Property, req: Request, params: P) => Promise<Response>) =>
  route<P>(async (req, params) => {
    const host = await currentHost()
    if (!host) return json({ error: 'Sign in first' }, 401)
    const p = await getProperty(env(), params.id)
    if (!p || p.host_id !== host.id) return json({ error: 'Not found' }, 404)
    return fn(p, req, params)
  })
