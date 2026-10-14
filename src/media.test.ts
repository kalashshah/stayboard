import { describe, expect, it } from 'vitest'
import { inferType } from './media'

describe('inferType', () => {
  it('uses the browser type when present', () => {
    expect(inferType({ name: 'a.mp4', type: 'video/mp4' } as File)).toBe('video/mp4')
  })
  it('falls back to the extension', () => {
    expect(inferType({ name: 'song.m4a', type: '' } as File)).toBe('audio/mp4')
    expect(inferType({ name: 'song.MP3', type: '' } as File)).toBe('audio/mpeg')
    expect(inferType({ name: 'x.bin', type: '' } as File)).toBe('')
  })
})
