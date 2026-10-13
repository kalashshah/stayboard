// Password hashing (PBKDF2-SHA256 via Web Crypto) and random identifiers.

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ITERATIONS = 100_000

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function pbkdf2(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: ITERATIONS },
    key,
    256,
  )
  return b64url(new Uint8Array(bits))
}

export async function hashPassword(password: string) {
  const salt = newSecret()
  return { hash: await pbkdf2(password, salt), salt }
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const got = await pbkdf2(password, salt)
  if (got.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ hash.charCodeAt(i)
  return diff === 0
}

export function randomCode(n: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(n))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export const newSecret = () => b64url(crypto.getRandomValues(new Uint8Array(32)))
export const newId = () => crypto.randomUUID()

export function slugFor() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
