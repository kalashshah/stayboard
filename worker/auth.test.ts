import { describe, expect, it } from 'vitest'
import { CODE_ALPHABET, loginCode, newSecret, randomCode, sha256, slugFor } from './auth'

describe('sign-in codes', () => {
  it('are six digits, zero-padded', () => {
    for (let i = 0; i < 200; i++) expect(loginCode()).toMatch(/^\d{6}$/)
  })
  it('hash the same code the same way and different codes differently', async () => {
    expect(await sha256('123456')).toBe(await sha256('123456'))
    expect(await sha256('123456')).not.toBe(await sha256('123457'))
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
