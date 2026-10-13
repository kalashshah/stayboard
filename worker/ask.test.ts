import { describe, expect, it } from 'vitest'
import { buildSystemPrompt, parseAnswer, validQuestion } from './ask'
import { defaultConfig } from './config'

describe('buildSystemPrompt', () => {
  const c = defaultConfig('Ocean View Loft')
  c.hostName = 'Priya'
  c.wifi = { ssid: 'LoftNet', password: 'seabreeze22' }
  c.guide.push({ title: 'The hot tub', body: 'Lift the cover and press the big round button.' })
  const p = buildSystemPrompt(c)

  it('names the property and host', () => {
    expect(p).toContain('Ocean View Loft')
    expect(p).toContain('Priya')
  })
  it('includes wifi, rules, guide, faqs, places, contacts and the fallback', () => {
    expect(p).toContain('LoftNet')
    expect(p).toContain('seabreeze22')
    expect(p).toContain('No smoking indoors')
    expect(p).toContain('big round button')
    expect(p).toContain('first aid kit')
    expect(p).toContain('Corner Market')
    expect(p).toContain('(555) 010-0100')
    expect(p).toContain(c.ask.fallback)
  })
  it('asks for JSON only', () => {
    expect(p).toMatch(/"answered"/)
  })
})

describe('parseAnswer', () => {
  it('reads plain JSON', () => {
    expect(parseAnswer('{"answered": true, "answer": "Checkout is at 11 AM."}')).toEqual({ answered: true, answer: 'Checkout is at 11 AM.' })
  })
  it('reads fenced JSON', () => {
    expect(parseAnswer('```json\n{"answered": false, "answer": "Not in the guide."}\n```')).toEqual({ answered: false, answer: 'Not in the guide.' })
  })
  it('reads JSON wrapped in prose', () => {
    expect(parseAnswer('Sure! {"answered":true,"answer":"Yes"} hope that helps')).toEqual({ answered: true, answer: 'Yes' })
  })
  it('returns null for garbage', () => {
    expect(parseAnswer('I cannot help with that')).toBeNull()
    expect(parseAnswer('{"answer": 5}')).toBeNull()
  })
})

describe('validQuestion', () => {
  it('accepts 1–300 chars and trims', () => {
    expect(validQuestion('  is there parking? ')).toBe('is there parking?')
  })
  it('rejects empty and over-long questions', () => {
    expect(validQuestion('   ')).toBeNull()
    expect(validQuestion('x'.repeat(301))).toBeNull()
  })
})
