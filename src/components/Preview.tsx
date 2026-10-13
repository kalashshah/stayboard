// Web rendering of the TV home screen. Sizes use container-query units so it scales with its box.
import { headlineFor, type PropertyConfig, type TileKey } from '../api'

export const TILE_LABELS: Record<TileKey, { title: string; sub: (c: PropertyConfig) => string; glyph: string }> = {
  wifi: { title: 'Wi-Fi', sub: (c) => c.wifi.ssid || 'Not set yet', glyph: '◠' },
  checkout: { title: 'Checkout', sub: (c) => c.stay.checkOut, glyph: '◷' },
  rules: { title: 'House rules', sub: (c) => `${c.rules.length} rules`, glyph: '☰' },
  guide: { title: 'House guide', sub: (c) => `${c.guide.length} topics`, glyph: '▤' },
  places: { title: 'Local picks', sub: (c) => `${c.places.length} nearby`, glyph: '◎' },
  contacts: { title: 'Contacts', sub: (c) => c.contacts[0]?.label ?? '', glyph: '✆' },
  ask: { title: 'Ask the house', sub: () => 'Any question, any time', glyph: '?' },
}

export function visibleTiles(c: PropertyConfig): TileKey[] {
  return (Object.keys(TILE_LABELS) as TileKey[]).filter((k) => c.appearance.tiles[k] && (k !== 'ask' || c.ask.enabled))
}

export function TvPreview({ config: c, focus = 'wifi', time = '7:42 PM' }: { config: PropertyConfig; focus?: TileKey; time?: string }) {
  const dark = c.appearance.theme === 'dark'
  const accent = c.appearance.accent
  const bg = c.appearance.backgroundUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.75)), url(${c.appearance.backgroundUrl}) center/cover`
    : dark
      ? `radial-gradient(120% 90% at 85% 10%, ${accent}66, transparent 60%), linear-gradient(160deg, #15110f, #0b0a09)`
      : `radial-gradient(120% 90% at 85% 10%, ${accent}33, transparent 60%), linear-gradient(160deg, #fbf7f3, #efe9e3)`
  const ink = dark ? '#fff' : '#1c1c1c'
  const sub = dark ? 'rgba(255,255,255,0.72)' : 'rgba(28,28,28,0.7)'
  const tile = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)'
  const tiles = visibleTiles(c)
  return (
    <div className="tv" style={{ background: bg, color: ink }}>
      <div className="tv-top">
        <span className="tv-brand">{c.name}</span>
        <span style={{ color: sub }}>{time}</span>
      </div>
      <div className="tv-hero">
        <h2 className="tv-h">{headlineFor(c)}</h2>
        <p className="tv-p" style={{ color: sub }}>{c.welcome.message}</p>
      </div>
      <div className="tv-grid">
        {tiles.map((k) => {
          const on = k === focus
          return (
            <div className="tv-tile" key={k} style={{ background: on ? accent : tile, color: on ? '#fff' : ink, boxShadow: on ? '0 0 0 0.3cqw #fff' : 'none' }}>
              <span className="tv-glyph">{TILE_LABELS[k].glyph}</span>
              <span className="tv-tile-t">{TILE_LABELS[k].title}</span>
              <span className="tv-tile-s" style={{ color: on ? 'rgba(255,255,255,0.8)' : sub }}>{TILE_LABELS[k].sub(c)}</span>
            </div>
          )
        })}
      </div>
      <div className="tv-foot" style={{ color: sub }}>Hosted by {c.hostName} · Checkout {c.stay.checkOut}</div>
    </div>
  )
}
