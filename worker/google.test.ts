import { describe, expect, it } from 'vitest'
import { googleAuthUrl, idTokenEmail } from './google'

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const token = (payload: object) => `${b64url('{"alg":"RS256"}')}.${b64url(JSON.stringify(payload))}.sig`

describe('googleAuthUrl', () => {
  it('sends the browser to Google with the callback on the same origin', () => {
    const u = new URL(googleAuthUrl('client-1', 'http://localhost:5173', 'st4te'))
    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(u.searchParams.get('client_id')).toBe('client-1')
    expect(u.searchParams.get('redirect_uri')).toBe('http://localhost:5173/api/auth/google/callback')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('scope')).toBe('openid email')
    expect(u.searchParams.get('state')).toBe('st4te')
  })
})

describe('idTokenEmail', () => {
  it('returns the lowercased email of a verified token', () => {
    expect(idTokenEmail(token({ email: 'Priya@Example.com', email_verified: true }))).toBe('priya@example.com')
  })
  it('rejects unverified emails', () => {
    expect(idTokenEmail(token({ email: 'priya@example.com', email_verified: false }))).toBeNull()
  })
  it('rejects malformed tokens', () => {
    expect(idTokenEmail('not-a-jwt')).toBeNull()
    expect(idTokenEmail(`${b64url('{}')}.%%%.sig`)).toBeNull()
  })
})
