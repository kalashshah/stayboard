// The config shape and render helpers are shared with the Worker and the dashboard (shared/design.ts); only TV-specific bits live here.
import type { Font, PropertyConfig, Reply } from '../../shared/design'
export * from '../../shared/design'

export type TvState =
  | { paired: false; code: string; pairUrl: string }
  | { paired: true; config: PropertyConfig; updatedAt: number; slug: string; guestUrl: string; replies?: Reply[] } // replies: missing from older servers and caches

/** Bundled TTFs in assets/fonts; Vega addresses them by file name, and weight needs its own file. */
export const FONT: Record<Font, { regular: string; bold: string }> = {
  sans: { regular: 'Inter-Regular', bold: 'Inter-SemiBold' },
  serif: { regular: 'Fraunces-Regular', bold: 'Fraunces-SemiBold' },
  grotesk: { regular: 'SpaceGrotesk-Regular', bold: 'SpaceGrotesk-SemiBold' },
}
