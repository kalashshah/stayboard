// Thin D1 helpers. Every function takes env and returns plain rows.
import { hashPassword, newId, newSecret, randomCode, slugFor } from './auth'
import { defaultConfig, upgradeConfig, type PropertyConfig } from './config'
import { deletePrefix } from './media'

export type Host = { id: string; email: string }
export type PropertyRow = { id: string; host_id: string; slug: string; config: string; updated_at: number; created_at: number }
export type Property = { id: string; host_id: string; slug: string; config: PropertyConfig; updated_at: number }
export type DeviceRow = {
  code: string; secret: string; property_id: string | null; label: string | null
  paired_at: number | null; last_seen_at: number | null; created_at: number
}
export type QuestionRow = {
  id: string; property_id: string; source: string; question: string; answer: string; answered: number; created_at: number
  reply: string | null; replied_at: number | null
}

const SESSION_DAYS = 30

export const toProperty = (r: PropertyRow): Property => ({
  id: r.id, host_id: r.host_id, slug: r.slug, config: upgradeConfig(JSON.parse(r.config)) as PropertyConfig, updated_at: r.updated_at,
})

// hosts + sessions
export async function createHost(env: Env, email: string, password: string): Promise<Host | null> {
  const { hash, salt } = await hashPassword(password)
  const id = newId()
  try {
    await env.DB.prepare('INSERT INTO hosts (id, email, pass_hash, salt, created_at) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(id, email, hash, salt, Date.now()).run()
  } catch (e) {
    if (String(e).includes('UNIQUE')) return null
    throw e
  }
  return { id, email }
}

/** Host for a Google-verified email. New emails get a password-less row (password login stays closed until one is set). An existing
 *  password account belongs to whoever Google just verified: email signup never checked the address, so a password set before that
 *  verification (and any session using it) is retired rather than left as a second key to the account. */
export async function hostForEmail(env: Env, email: string): Promise<Host> {
  await env.DB.prepare("INSERT OR IGNORE INTO hosts (id, email, pass_hash, salt, created_at) VALUES (?1, ?2, '', '', ?3)").bind(newId(), email, Date.now()).run()
  const row = (await env.DB.prepare('SELECT id, email, pass_hash FROM hosts WHERE email = ?1').bind(email).first<Host & { pass_hash: string }>())!
  if (row.pass_hash) {
    await env.DB.batch([
      env.DB.prepare("UPDATE hosts SET pass_hash = '', salt = '' WHERE id = ?1").bind(row.id),
      env.DB.prepare('DELETE FROM sessions WHERE host_id = ?1').bind(row.id),
    ])
  }
  return { id: row.id, email: row.email }
}

export const findHost = (env: Env, email: string) =>
  env.DB.prepare('SELECT id, email, pass_hash, salt FROM hosts WHERE email = ?1').bind(email)
    .first<{ id: string; email: string; pass_hash: string; salt: string }>()

export async function createSession(env: Env, hostId: string) {
  const id = newSecret()
  const now = Date.now()
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?1').bind(now), // expired rows are swept on the next sign-in
    env.DB.prepare('INSERT INTO sessions (id, host_id, expires_at) VALUES (?1, ?2, ?3)').bind(id, hostId, now + SESSION_DAYS * 86_400_000),
  ])
  return id
}

export const hostForSession = (env: Env, sessionId: string) =>
  env.DB.prepare(
    'SELECT h.id, h.email FROM sessions s JOIN hosts h ON h.id = s.host_id WHERE s.id = ?1 AND s.expires_at > ?2',
  ).bind(sessionId, Date.now()).first<Host>()

export const deleteSession = (env: Env, sessionId: string) =>
  env.DB.prepare('DELETE FROM sessions WHERE id = ?1').bind(sessionId).run()

// properties
export async function listProperties(env: Env, hostId: string) {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.config, p.updated_at,
       (SELECT COUNT(*) FROM devices d WHERE d.property_id = p.id) AS devices,
       (SELECT COUNT(*) FROM questions q WHERE q.property_id = p.id AND q.answered = 0) AS unanswered
     FROM properties p WHERE p.host_id = ?1 ORDER BY p.created_at ASC`,
  ).bind(hostId).all<{ id: string; slug: string; config: string; updated_at: number; devices: number; unanswered: number }>()
  return results.map((r) => {
    const config = upgradeConfig(JSON.parse(r.config)) as PropertyConfig
    return { id: r.id, slug: r.slug, name: config.name, config, updated_at: r.updated_at, devices: r.devices, unanswered: r.unanswered }
  })
}

export async function createProperty(env: Env, hostId: string, name: string): Promise<Property> {
  const id = newId()
  const slug = slugFor()
  const config = defaultConfig(name)
  const now = Date.now()
  await env.DB.prepare(
    'INSERT INTO properties (id, host_id, slug, config, updated_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)',
  ).bind(id, hostId, slug, JSON.stringify(config), now).run()
  return { id, host_id: hostId, slug, config, updated_at: now }
}

export async function getProperty(env: Env, id: string): Promise<Property | null> {
  const r = await env.DB.prepare('SELECT * FROM properties WHERE id = ?1').bind(id).first<PropertyRow>()
  return r ? toProperty(r) : null
}

export async function getPropertyBySlug(env: Env, slug: string): Promise<Property | null> {
  const r = await env.DB.prepare('SELECT * FROM properties WHERE slug = ?1').bind(slug).first<PropertyRow>()
  return r ? toProperty(r) : null
}

export async function updateConfig(env: Env, id: string, config: PropertyConfig) {
  const now = Date.now()
  await env.DB.prepare('UPDATE properties SET config = ?1, updated_at = ?2 WHERE id = ?3')
    .bind(JSON.stringify(config), now, id).run()
  return now
}

export async function deleteProperty(env: Env, id: string) {
  await deletePrefix(env, id)
  await env.DB.batch([
    env.DB.prepare('UPDATE devices SET property_id = NULL, paired_at = NULL WHERE property_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM questions WHERE property_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM properties WHERE id = ?1').bind(id),
  ])
}

// devices
export async function createDevice(env: Env) {
  // /tv/register is open to anyone and TVs that never pair would pile up: an unpaired row silent for a day (they poll every 5 s) goes.
  await env.DB.prepare('DELETE FROM devices WHERE property_id IS NULL AND COALESCE(last_seen_at, created_at) < ?1').bind(Date.now() - 86_400_000).run()
  const secret = newSecret()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(6)
    try {
      await env.DB.prepare('INSERT INTO devices (code, secret, created_at) VALUES (?1, ?2, ?3)').bind(code, secret, Date.now()).run()
      return { code, secret }
    } catch (e) {
      if (!String(e).includes('UNIQUE')) throw e
    }
  }
  throw new Error('could not allocate a pairing code')
}

export const deviceBySecret = (env: Env, secret: string) =>
  env.DB.prepare('SELECT * FROM devices WHERE secret = ?1').bind(secret).first<DeviceRow>()

export const touchDevice = (env: Env, code: string) =>
  env.DB.prepare('UPDATE devices SET last_seen_at = ?1 WHERE code = ?2').bind(Date.now(), code).run()

export const unpairDeviceRow = (env: Env, code: string) =>
  env.DB.prepare('UPDATE devices SET property_id = NULL, paired_at = NULL WHERE code = ?1').bind(code).run()

export async function pairDevice(env: Env, code: string, propertyId: string, label: string) {
  const r = await env.DB.prepare(
    'UPDATE devices SET property_id = ?1, paired_at = ?2, label = ?3 WHERE code = ?4 AND property_id IS NULL',
  ).bind(propertyId, Date.now(), label, code).run()
  return r.meta.changes > 0
}

export async function unpairDevice(env: Env, code: string, propertyId: string) {
  const r = await env.DB.prepare(
    'UPDATE devices SET property_id = NULL, paired_at = NULL WHERE code = ?1 AND property_id = ?2',
  ).bind(code, propertyId).run()
  return r.meta.changes > 0
}

export async function devicesFor(env: Env, propertyId: string) {
  const { results } = await env.DB.prepare(
    'SELECT code, label, paired_at, last_seen_at FROM devices WHERE property_id = ?1 ORDER BY paired_at DESC',
  ).bind(propertyId).all<Pick<DeviceRow, 'code' | 'label' | 'paired_at' | 'last_seen_at'>>()
  return results
}

// questions
export async function insertQuestion(env: Env, q: Omit<QuestionRow, 'id' | 'created_at'>) {
  const id = newId()
  await env.DB.prepare(
    'INSERT INTO questions (id, property_id, source, question, answer, answered, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
  ).bind(id, q.property_id, q.source, q.question, q.answer, q.answered, Date.now()).run()
  return id
}

export async function listQuestions(env: Env, propertyId: string) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM questions WHERE property_id = ?1 ORDER BY created_at DESC LIMIT 200',
  ).bind(propertyId).all<QuestionRow>()
  return results
}

/** The host answers a question themselves; it then counts as answered. */
export const replyQuestion = (env: Env, id: string, propertyId: string, reply: string) =>
  env.DB.prepare('UPDATE questions SET reply = ?1, replied_at = ?2, answered = 1 WHERE id = ?3 AND property_id = ?4')
    .bind(reply, Date.now(), id, propertyId).run()

/** Host replies to the given questions (ids the asking phone kept); unknown or unreplied ids are skipped. */
export async function repliesFor(env: Env, propertyId: string, ids: string[]) {
  if (!ids.length) return []
  const { results } = await env.DB.prepare(
    `SELECT id, reply, replied_at FROM questions WHERE property_id = ?1 AND reply IS NOT NULL AND id IN (${ids.map((_, i) => `?${i + 2}`).join(',')})`,
  ).bind(propertyId, ...ids).all<{ id: string; reply: string; replied_at: number }>()
  return results
}

/** Replies to questions asked on the TV in the last day, newest first; the TV shows them on its Ask screen. */
export async function recentTvReplies(env: Env, propertyId: string) {
  const { results } = await env.DB.prepare(
    "SELECT id, question, reply, replied_at FROM questions WHERE property_id = ?1 AND source = 'tv' AND reply IS NOT NULL AND replied_at > ?2 ORDER BY replied_at DESC LIMIT 5",
  ).bind(propertyId, Date.now() - 86_400_000).all<{ id: string; question: string; reply: string; replied_at: number }>()
  return results
}

export const deleteQuestion = (env: Env, id: string, propertyId: string) =>
  env.DB.prepare('DELETE FROM questions WHERE id = ?1 AND property_id = ?2').bind(id, propertyId).run()

/** Atomic counter with a cap; key is e.g. "2026-10-14" or "2026-10-14:slug". Keys start with the ISO date, so older days are swept on the way. */
export async function takeBudget(env: Env, key: string, cap: number): Promise<boolean> {
  const [, r] = await env.DB.batch([
    env.DB.prepare('DELETE FROM usage WHERE day < ?1').bind(key.slice(0, 10)),
    env.DB.prepare(
      `INSERT INTO usage (day, calls) VALUES (?1, 1)
       ON CONFLICT(day) DO UPDATE SET calls = calls + 1 WHERE calls < ?2
       RETURNING calls`,
    ).bind(key, cap),
  ])
  return r.results.length > 0
}
