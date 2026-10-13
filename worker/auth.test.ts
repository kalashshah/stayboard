import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, hashPassword, newSecret, randomCode, slugFor, verifyPassword } from './auth'

describe('passwords', () => {
  it('round-trips a password', async () => {
    const { hash, salt } = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', hash, salt)).toBe(true)
  })
  it('rejects a wrong password', async () => {
    const { hash, salt } = await hashPassword('right')
    expect(await verifyPassword('wrong', hash, salt)).toBe(false)
  })
  it('salts differ between calls', async () => {
    const a = await hashPassword('x')
    const b = await hashPassword('x')
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })
})

describe('codes', () => {
  it('pairing codes are 6 chars from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const c = randomCode(6)
      expect(c).toHaveLength(6)
      for (const ch of c) expect(CODE_ALPHABET).toContain(ch)
    }
    expect(CODE_ALPHABET).not.toMatch(/[0O1I]/)
  })
  it('device secrets are 43-char base64url', () => {
    expect(newSecret()).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })
  it('slugs are 8 lowercase alphanumerics', () => {
    expect(slugFor()).toMatch(/^[a-z0-9]{8}$/)
  })
})
