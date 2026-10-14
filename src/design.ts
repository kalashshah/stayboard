// Pure helpers behind the design studio: functional patches (so edits made during an upload survive), drag arithmetic, own-media detection.
import type { Design, PropertyConfig } from './api'

export const patchDesign = (p: Partial<Design>) => (c: PropertyConfig): PropertyConfig => ({ ...c, design: { ...c.design, ...p } })
export const patchBackdrop = (p: Partial<Design['backdrop']>) => (c: PropertyConfig): PropertyConfig => ({ ...c, design: { ...c.design, backdrop: { ...c.design.backdrop, ...p } } })
export const patchMusic = (p: Partial<Design['music']>) => (c: PropertyConfig): PropertyConfig => ({ ...c, design: { ...c.design, music: { ...c.design.music, ...p } } })
export const patchAppearance = (p: Partial<PropertyConfig['appearance']>) => (c: PropertyConfig): PropertyConfig => ({ ...c, appearance: { ...c.appearance, ...p } })

/** Insertion point in the pre-move list for a pointer at `y`, given each card's vertical midpoint; `mids.length` means "after the last card". */
export function dropIndex(mids: number[], y: number) {
  const i = mids.findIndex((m) => y < m)
  return i === -1 ? mids.length : i
}

/** Final index of the moved card once it is removed from `from` and inserted at `insertAt`. */
export function resolveMove(from: number, insertAt: number, len: number) {
  const to = insertAt > from ? insertAt - 1 : insertAt
  return Math.max(0, Math.min(len - 1, to))
}

/** The file name when `url` is something this property uploaded to Stayboard, else null. */
export function ownMediaFile(url: string, propertyId: string, origin: string = location.origin) {
  const prefix = `${origin}/m/${propertyId}/`
  return url.startsWith(prefix) && url.length > prefix.length ? url.slice(prefix.length) : null
}
