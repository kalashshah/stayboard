import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../worker/config'
import { dropIndex, ownMediaFile, patchBackdrop, patchDesign, resolveMove } from './design'

describe('design patches apply to the latest config, not the one captured at click time', () => {
  it('a backdrop patch created before a layout change keeps the new layout', () => {
    const stale = defaultConfig('Loft') // what the uploader captured when the upload started
    const patch = patchBackdrop({ video: 'https://x/v.mp4', kind: 'video' })
    const latest = { ...stale, design: { ...stale.design, layout: 'poster' as const, font: 'serif' as const } } // host kept editing
    const next = patch(latest)
    expect(next.design.layout).toBe('poster')
    expect(next.design.font).toBe('serif')
    expect(next.design.backdrop).toMatchObject({ kind: 'video', video: 'https://x/v.mp4', overlay: stale.design.backdrop.overlay })
  })
  it('patchDesign merges shallowly onto the latest design', () => {
    const c = defaultConfig('Loft')
    expect(patchDesign({ layout: 'split' })(c).design).toMatchObject({ layout: 'split', font: 'sans' })
  })
})

describe('tile drag arithmetic', () => {
  const mids = [10, 30, 50, 70] // card vertical midpoints
  it('dropIndex is the insertion point in the pre-move list, including after the last card', () => {
    expect(dropIndex(mids, 0)).toBe(0)
    expect(dropIndex(mids, 35)).toBe(2)
    expect(dropIndex(mids, 99)).toBe(4)
  })
  it('resolveMove lets the first card land last and leaves a no-op alone', () => {
    expect(resolveMove(0, 4, 4)).toBe(3)
    expect(resolveMove(3, 4, 4)).toBe(3)
    expect(resolveMove(2, 0, 4)).toBe(0)
    expect(resolveMove(1, 2, 4)).toBe(1) // dropped onto its own lower half
  })
})

describe('ownMediaFile', () => {
  const origin = 'https://stayboard.example'
  it('returns the file for a URL this property uploaded', () => {
    expect(ownMediaFile(`${origin}/m/p1/abc.mp4`, 'p1', origin)).toBe('abc.mp4')
  })
  it('returns null for links, other properties and empty values', () => {
    expect(ownMediaFile('https://cdn.example/x.mp4', 'p1', origin)).toBeNull()
    expect(ownMediaFile(`${origin}/m/p2/abc.mp4`, 'p1', origin)).toBeNull()
    expect(ownMediaFile('', 'p1', origin)).toBeNull()
  })
})
