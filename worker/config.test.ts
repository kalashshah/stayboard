import { describe, expect, it } from 'vitest'
import { defaultConfig, parseConfig } from './config'

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
