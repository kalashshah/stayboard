import { describe, expect, it } from 'vitest'
import { checkUpload, MB, parseRange, QUOTA } from './media'

describe('checkUpload', () => {
  it('accepts an mp4 under the cap', () => {
    expect(checkUpload('video', 'video/mp4', 30 * MB, 0)).toEqual({ ok: true, kind: 'video', ext: 'mp4', contentType: 'video/mp4' })
  })
  it('rejects the wrong type with 415 and names the rule', () => {
    expect(checkUpload('video', 'video/quicktime', 1, 0)).toMatchObject({ ok: false, status: 415, error: expect.stringContaining('MP4') })
  })
  it('rejects an empty content type with 415', () => {
    expect(checkUpload('audio', '', 1, 0)).toMatchObject({ ok: false, status: 415 })
  })
  it('rejects over the kind cap with 413', () => {
    expect(checkUpload('image', 'image/png', 6 * MB, 0)).toMatchObject({ ok: false, status: 413 })
  })
  it('rejects over the property quota with 413 naming 150 MB', () => {
    expect(checkUpload('image', 'image/png', 1 * MB, QUOTA - 100)).toMatchObject({ ok: false, status: 413, error: expect.stringContaining('150 MB') })
  })
  it('rejects an unknown kind with 400', () => {
    expect(checkUpload('font', 'font/ttf', 1, 0)).toMatchObject({ ok: false, status: 400 })
  })
  it('maps audio/x-m4a to m4a and ignores charset parameters', () => {
    expect(checkUpload('audio', 'audio/x-m4a; charset=binary', 1, 0)).toMatchObject({ ok: true, ext: 'm4a', contentType: 'audio/x-m4a' })
  })
})

describe('parseRange', () => {
  it('returns null without a header', () => {
    expect(parseRange(undefined, 100)).toBeNull()
  })
  it('parses open-ended, closed and suffix ranges', () => {
    expect(parseRange('bytes=0-', 100)).toEqual({ offset: 0, length: 100 })
    expect(parseRange('bytes=10-19', 100)).toEqual({ offset: 10, length: 10 })
    expect(parseRange('bytes=-5', 100)).toEqual({ offset: 95, length: 5 })
    expect(parseRange('bytes=10-999', 100)).toEqual({ offset: 10, length: 90 })
  })
  it('flags unsatisfiable ranges', () => {
    expect(parseRange('bytes=100-', 100)).toBe('unsatisfiable')
  })
})
