import { backdropFor, defaultDesign, headlineFor, layoutFor, upgradeConfig, visibleTiles, wifiQr, type PropertyConfig } from '../src/types'

const c = (headline: string, guestName: string, wifi = { ssid: 'LoftNet', password: 'seabreeze22' }) =>
  ({ welcome: { headline, guestName, message: '' }, wifi } as unknown as PropertyConfig)

describe('headlineFor', () => {
  it('substitutes the bare name', () => {
    expect(headlineFor(c('Hi {guest}!', 'Sam'))).toBe('Hi Sam!')
  })
  it('drops the placeholder and dangling punctuation without a guest', () => {
    expect(headlineFor(c('Welcome, {guest}', ''))).toBe('Welcome')
    expect(headlineFor(c('Hi {guest}!', ''))).toBe('Hi!')
  })
})

describe('wifiQr', () => {
  it('uses nopass for open networks', () => {
    expect(wifiQr(c('x', '', { ssid: 'CafeFree', password: '' }))).toBe('WIFI:T:nopass;S:CafeFree;;')
  })
})

const sample = {
  name: 'Loft', hostName: 'Priya', welcome: { headline: 'Welcome, {guest}', message: 'Hi', guestName: 'Sam' },
  stay: { checkIn: '3 PM', checkOut: '11 AM', checkoutSteps: [] }, wifi: { ssid: 'LoftNet', password: 'x' },
  rules: [], guide: [], faqs: [], places: [], contacts: [], appearance: { accent: '#c2562e', theme: 'dark' },
  design: defaultDesign(), ask: { enabled: true, tone: 'friendly', fallback: '', suggested: [] },
} as unknown as PropertyConfig

describe('design helpers', () => {
  it('upgrades a cached legacy state so the new build can render it', () => {
    const legacy = { ...sample, design: undefined, appearance: { accent: '#c2562e', theme: 'dark', backgroundUrl: 'https://x/a.jpg', tiles: { wifi: false } } }
    const c = upgradeConfig(legacy)
    expect(c.design.backdrop).toMatchObject({ kind: 'photo', photos: ['https://x/a.jpg'] })
    expect(visibleTiles(c).map((t) => t.key)).not.toContain('wifi')
    expect((c.appearance as { backgroundUrl?: string }).backgroundUrl).toBeUndefined()
  })
  it('layoutFor poster is compact with a scrim', () => {
    expect(layoutFor({ ...sample, design: { ...sample.design, layout: 'poster' } })).toMatchObject({ tiles: 'compact', scrim: true, headline: 60 })
  })
  it('backdropFor video without a file falls back to the poster', () => {
    const c = { ...sample, design: { ...sample.design, backdrop: { ...sample.design.backdrop, kind: 'video' as const, poster: 'https://x/p.jpg' } } }
    expect(backdropFor(c)).toEqual({ kind: 'photo', url: 'https://x/p.jpg' })
  })
  it('visibleTiles hides ask when the concierge is off', () => {
    expect(visibleTiles({ ...sample, ask: { ...sample.ask, enabled: false } }).map((t) => t.key)).not.toContain('ask')
  })
})
