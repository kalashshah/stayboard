import { headlineFor, wifiQr, type PropertyConfig } from '../src/types'

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
