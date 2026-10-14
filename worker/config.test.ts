import { describe, expect, it } from 'vitest'
import { backdropFor, defaultConfig, headlineFor, layoutFor, parseConfig, tileSub, upgradeConfig, visibleTiles, wifiQr } from './config'

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

describe('upgradeConfig', () => {
  const legacy = { ...defaultConfig('Loft'), design: undefined, appearance: { accent: '#c2562e', theme: 'dark', backgroundUrl: 'https://x/a.jpg', tiles: { wifi: true, checkout: false, rules: true, guide: true, places: true, contacts: true, ask: true } } }
  it('moves backgroundUrl into a photo backdrop and tiles into visibility', () => {
    const r = parseConfig(upgradeConfig(legacy))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.config.design.backdrop).toMatchObject({ kind: 'photo', photos: ['https://x/a.jpg'] })
    expect(r.config.design.tiles.find((t) => t.key === 'checkout')?.visible).toBe(false)
    expect('backgroundUrl' in r.config.appearance).toBe(false)
  })
  it('is idempotent', () => {
    const once = upgradeConfig(legacy)
    expect(upgradeConfig(once)).toEqual(once)
  })
})

describe('design schema', () => {
  it('rejects a tile list missing a key', () => {
    const c = defaultConfig('Loft')
    c.design.tiles = c.design.tiles.slice(1)
    expect(parseConfig(c).ok).toBe(false)
  })
  it('rejects a duplicate tile key', () => {
    const c = defaultConfig('Loft')
    c.design.tiles[1] = { ...c.design.tiles[0] }
    expect(parseConfig(c).ok).toBe(false)
  })
  it('rejects overlay above 100 and a non-https video', () => {
    const c = defaultConfig('Loft')
    c.design.backdrop.overlay = 101
    expect(parseConfig(c).ok).toBe(false)
    const d = defaultConfig('Loft')
    d.design.backdrop.video = 'http://x/v.mp4'
    expect(parseConfig(d).ok).toBe(false)
  })
})

describe('layout helpers', () => {
  it('poster uses a bigger headline, a scrim and compact tiles', () => {
    const c = defaultConfig('Loft')
    c.design.layout = 'poster'
    expect(layoutFor(c)).toMatchObject({ headline: 60, scrim: true, tiles: 'compact', topBar: 'logo' })
  })
  it('minimal has no top bar or footer', () => {
    const c = defaultConfig('Loft')
    c.design.layout = 'minimal'
    c.design.showFooter = true
    expect(layoutFor(c)).toMatchObject({ topBar: 'none', footer: false })
  })
  it('backdropFor falls back: video without file → poster photo → color', () => {
    const c = defaultConfig('Loft')
    c.design.backdrop.kind = 'video'
    expect(backdropFor(c)).toEqual({ kind: 'color' })
    c.design.backdrop.poster = 'https://x/p.jpg'
    expect(backdropFor(c)).toEqual({ kind: 'photo', url: 'https://x/p.jpg' })
  })
  it('tileSub prefers the custom subtitle', () => {
    const c = defaultConfig('Loft')
    c.wifi.ssid = 'LoftNet'
    expect(tileSub(c, 'wifi')).toBe('LoftNet')
    c.design.tiles[0].sub = 'Fast fibre'
    expect(tileSub(c, 'wifi')).toBe('Fast fibre')
  })
  it('visibleTiles follows design order and hides ask when disabled', () => {
    const c = defaultConfig('Loft')
    c.design.tiles.reverse()
    c.ask.enabled = false
    expect(visibleTiles(c).map((t) => t.key)).toEqual(['contacts', 'places', 'guide', 'rules', 'checkout', 'wifi'])
  })
})
