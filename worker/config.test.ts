import { describe, expect, it } from 'vitest'
import { defaultConfig, headlineFor, parseConfig, wifiQr } from './config'

describe('property config', () => {
  it('default config validates and names the property', () => {
    const r = parseConfig(defaultConfig('Ocean View Loft'))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.config.name).toBe('Ocean View Loft')
  })

  it('strips unknown keys', () => {
    const r = parseConfig({ ...defaultConfig('X'), bogus: 1, wifi: { ssid: 'a', password: 'b', evil: true } })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect('bogus' in r.config).toBe(false)
      expect('evil' in r.config.wifi).toBe(false)
    }
  })

  it('rejects an over-long headline with its path', () => {
    const c = defaultConfig('X')
    c.welcome.headline = 'x'.repeat(81)
    const r = parseConfig(c)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('welcome.headline')
  })

  it('rejects lists longer than 40', () => {
    const c = defaultConfig('X')
    c.rules = Array.from({ length: 41 }, (_, i) => `rule ${i}`)
    expect(parseConfig(c).ok).toBe(false)
  })

  it('rejects a non-hex accent', () => {
    const c = defaultConfig('X')
    c.appearance.accent = 'red'
    expect(parseConfig(c).ok).toBe(false)
  })
})

describe('headlineFor', () => {
  const base = defaultConfig('X')
  const with_ = (headline: string, guestName: string) => ({ ...base, welcome: { ...base.welcome, headline, guestName } })
  it('substitutes the bare name', () => {
    expect(headlineFor(with_('Hi {guest}!', 'Sam'))).toBe('Hi Sam!')
    expect(headlineFor(with_('Welcome, {guest}', 'Sam'))).toBe('Welcome, Sam')
  })
  it('drops the placeholder and dangling punctuation when there is no guest', () => {
    expect(headlineFor(with_('Welcome, {guest}', ''))).toBe('Welcome')
    expect(headlineFor(with_('Hi {guest}!', ''))).toBe('Hi!')
    expect(headlineFor(with_('{guest}, welcome home', ''))).toBe('Welcome home')
  })
  it('default headline reads well with and without a guest', () => {
    expect(headlineFor(with_(base.welcome.headline, 'Sam'))).toBe('Welcome, Sam')
    expect(headlineFor(with_(base.welcome.headline, ''))).toBe('Welcome')
  })
})

describe('wifiQr', () => {
  it('encodes WPA networks and escapes specials', () => {
    const c = { ...defaultConfig('X'), wifi: { ssid: 'Loft;Net', password: 'p:a,s"s' } }
    expect(wifiQr(c)).toBe('WIFI:T:WPA;S:Loft\\;Net;P:p\\:a\\,s\\"s;;')
  })
  it('marks open networks as nopass', () => {
    const c = { ...defaultConfig('X'), wifi: { ssid: 'CafeFree', password: '' } }
    expect(wifiQr(c)).toBe('WIFI:T:nopass;S:CafeFree;;')
  })
})

describe('required names', () => {
  it('rejects an empty property or host name', () => {
    expect(parseConfig({ ...defaultConfig('X'), name: '  ' }).ok).toBe(false)
    expect(parseConfig({ ...defaultConfig('X'), hostName: '' }).ok).toBe(false)
  })
})
