import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { ask, GUEST_DAILY_CAP, today, TV_DAILY_CAP, validQuestion } from './ask'
import { newSecret, verifyPassword } from './auth'
import { parseConfig } from './config'
import {
  createDevice, createHost, createProperty, createSession, deleteProperty, deleteQuestion, deleteSession,
  deviceBySecret, devicesFor, findHost, getProperty, getPropertyBySlug, hostForEmail, hostForSession, listProperties,
  listQuestions, pairDevice, takeBudget, touchDevice, unpairDevice, unpairDeviceRow, updateConfig, type Host,
} from './db'
import { exchangeCode, googleAuthUrl } from './google'

const COOKIE = 'sb_session'
const OAUTH_COOKIE = 'sb_oauth'
const OAUTH_PATH = '/api/auth/google'
type Vars = { host: Host }

export const api = new Hono<{ Bindings: Env; Variables: Vars }>()

const guestUrl = (env: Env, slug: string) => `${env.APP_URL}/g/${slug}`

function setSession(c: { header: (n: string, v: string, o?: { append: boolean }) => void }, id: string) {
  setCookie(c as never, COOKIE, id, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 30 * 86_400 })
}

// ---- auth ----
api.post('/auth/signup', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as { email?: string; password?: string })
  const e = (email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return c.json({ error: 'Enter a valid email' }, 400)
  if (!password || password.length < 8) return c.json({ error: 'Password needs at least 8 characters' }, 400)
  const host = await createHost(c.env, e, password)
  if (!host) return c.json({ error: 'That email already has an account. Sign in instead.' }, 409)
  setSession(c, await createSession(c.env, host.id))
  return c.json({ host })
})

api.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}) as { email?: string; password?: string })
  const row = await findHost(c.env, (email ?? '').trim().toLowerCase())
  if (!row || !password || !(await verifyPassword(password, row.pass_hash, row.salt))) return c.json({ error: 'Wrong email or password' }, 401)
  setSession(c, await createSession(c.env, row.id))
  return c.json({ host: { id: row.id, email: row.email } })
})

// Google sign-in. State lives in a short cookie scoped to these two routes; the callback redirects back into the app.
api.get('/auth/google', (c) => {
  const state = newSecret()
  setCookie(c, OAUTH_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'Lax', path: OAUTH_PATH, maxAge: 600 })
  return c.redirect(googleAuthUrl(c.env.GOOGLE_CLIENT_ID, new URL(c.req.url).origin, state))
})

api.get('/auth/google/callback', async (c) => {
  const { code, state } = c.req.query()
  const expected = getCookie(c, OAUTH_COOKIE)
  deleteCookie(c, OAUTH_COOKIE, { path: OAUTH_PATH })
  const email = code && state && expected === state ? await exchangeCode(c.env, new URL(c.req.url).origin, code) : null
  if (!email) return c.redirect('/?error=' + encodeURIComponent("Google sign-in didn't go through. Try again."))
  setSession(c, await createSession(c.env, (await hostForEmail(c.env, email)).id))
  return c.redirect('/app')
})

api.post('/auth/logout', async (c) => {
  const sid = getCookie(c, COOKIE)
  if (sid) await deleteSession(c.env, sid)
  deleteCookie(c, COOKIE, { path: '/' })
  return c.json({ ok: true })
})

const requireHost = createMiddleware<{ Bindings: Env; Variables: Vars }>(async (c, next) => {
  const sid = getCookie(c, COOKIE)
  const host = sid ? await hostForSession(c.env, sid) : null
  if (!host) return c.json({ error: 'Sign in first' }, 401)
  c.set('host', host)
  await next()
})

api.use('/auth/me', requireHost)
api.use('/properties/*', requireHost)
api.use('/properties', requireHost)

api.get('/auth/me', (c) => c.json({ host: c.get('host') }))

// ---- properties (host) ----
api.get('/properties', async (c) => c.json({ properties: await listProperties(c.env, c.get('host').id) }))

api.post('/properties', async (c) => {
  const { name } = await c.req.json<{ name?: string }>().catch(() => ({}) as { name?: string })
  const n = (name ?? '').trim()
  if (!n || n.length > 80) return c.json({ error: 'Give the property a name' }, 400)
  const p = await createProperty(c.env, c.get('host').id, n)
  return c.json({ property: { id: p.id, slug: p.slug, config: p.config, updated_at: p.updated_at } })
})

async function ownProperty(c: { env: Env; get: (k: 'host') => Host; req: { param: (k: 'id') => string } }) {
  const p = await getProperty(c.env, c.req.param('id'))
  return p && p.host_id === c.get('host').id ? p : null
}

api.get('/properties/:id', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  return c.json({
    property: { id: p.id, slug: p.slug, config: p.config, updated_at: p.updated_at },
    devices: await devicesFor(c.env, p.id),
    guestUrl: guestUrl(c.env, p.slug),
  })
})

api.put('/properties/:id', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<{ config?: unknown }>().catch(() => ({}) as { config?: unknown })
  const r = parseConfig(body.config)
  if (!r.ok) return c.json({ error: r.error }, 400)
  return c.json({ updated_at: await updateConfig(c.env, p.id, r.config) })
})

api.delete('/properties/:id', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  await deleteProperty(c.env, p.id)
  return c.json({ ok: true })
})

api.post('/properties/:id/pair', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  const { code, label } = await c.req.json<{ code?: string; label?: string }>().catch(() => ({}) as { code?: string; label?: string })
  const k = (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (k.length !== 6) return c.json({ error: 'Pairing codes are 6 characters' }, 400)
  const ok = await pairDevice(c.env, k, p.id, (label ?? '').trim().slice(0, 60) || 'Living room TV')
  if (!ok) return c.json({ error: 'No TV is showing that code, or it is already paired' }, 404)
  return c.json({ devices: await devicesFor(c.env, p.id) })
})

api.delete('/properties/:id/devices/:code', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  await unpairDevice(c.env, c.req.param('code'), p.id)
  return c.json({ devices: await devicesFor(c.env, p.id) })
})

api.get('/properties/:id/questions', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  return c.json({ questions: await listQuestions(c.env, p.id) })
})

api.delete('/properties/:id/questions/:qid', async (c) => {
  const p = await ownProperty(c)
  if (!p) return c.json({ error: 'Not found' }, 404)
  await deleteQuestion(c.env, c.req.param('qid'), p.id)
  return c.json({ ok: true })
})

// ---- TV ----
api.post('/tv/register', async (c) => c.json(await createDevice(c.env)))

async function tvDevice(c: { env: Env; req: { header: (n: string) => string | undefined } }) {
  const auth = c.req.header('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return secret ? deviceBySecret(c.env, secret) : null
}

api.get('/tv/config', async (c) => {
  const d = await tvDevice(c)
  if (!d) return c.json({ error: 'Unknown device' }, 401)
  await touchDevice(c.env, d.code)
  const p = d.property_id ? await getProperty(c.env, d.property_id) : null
  if (!p) {
    if (d.property_id) await unpairDeviceRow(c.env, d.code) // property was deleted
    return c.json({ paired: false, code: d.code, pairUrl: `${c.env.APP_URL}/pair?code=${d.code}` })
  }
  return c.json({ paired: true, config: p.config, updatedAt: p.updated_at, slug: p.slug, guestUrl: guestUrl(c.env, p.slug) })
})

api.post('/tv/ask', async (c) => {
  const d = await tvDevice(c)
  if (!d) return c.json({ error: 'Unknown device' }, 401)
  const p = d.property_id ? await getProperty(c.env, d.property_id) : null
  if (!p) return c.json({ error: 'TV is not paired' }, 409)
  const body = await c.req.json<{ question?: unknown }>().catch(() => ({}) as { question?: unknown })
  const q = validQuestion(body.question)
  if (!q) return c.json({ error: 'Ask a question between 1 and 300 characters' }, 400)
  if (!(await takeBudget(c.env, `${today()}:tv:${p.id}`, TV_DAILY_CAP)))
    return c.json({ answered: false, answer: `This TV has asked a lot today. ${p.config.ask.fallback}` })
  return c.json(await ask(c.env, p, q, 'tv'))
})

// ---- guest phone page ----
api.get('/g/:slug', async (c) => {
  const p = await getPropertyBySlug(c.env, c.req.param('slug'))
  if (!p) return c.json({ error: 'Not found' }, 404)
  return c.json({ config: p.config, updatedAt: p.updated_at })
})

api.post('/g/:slug/ask', async (c) => {
  const p = await getPropertyBySlug(c.env, c.req.param('slug'))
  if (!p) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json<{ question?: unknown }>().catch(() => ({}) as { question?: unknown })
  const q = validQuestion(body.question)
  if (!q) return c.json({ error: 'Ask a question between 1 and 300 characters' }, 400)
  if (!(await takeBudget(c.env, `${today()}:${p.slug}`, GUEST_DAILY_CAP)))
    return c.json({ answered: false, answer: `The concierge has answered a lot today. ${p.config.ask.fallback}` })
  return c.json(await ask(c.env, p, q, 'phone'))
})
