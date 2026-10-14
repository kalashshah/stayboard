// Web rendering of the TV home screen. Sizes use container-query units so it scales with its box.
import { headlineFor, ICONS, tileSub, visibleTiles, type PropertyConfig, type TileKey } from '../api'

export function TvPreview({ config: c, focus = 'wifi', time = '7:42 PM' }: { config: PropertyConfig; focus?: TileKey; time?: string }) {
  const dark = c.appearance.theme === 'dark'
  const accent = c.appearance.accent
  const photo = c.design.backdrop.photos[0]
  const bg = photo
    ? `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.75)), url(${photo}) center/cover`
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
        {tiles.map((t) => {
          const on = t.key === focus
          return (
            <div className="tv-tile" key={t.key} style={{ background: on ? accent : tile, color: on ? '#fff' : ink, boxShadow: on ? '0 0 0 0.3cqw #fff' : 'none' }}>
              <span className="tv-glyph">{ICONS[t.icon]}</span>
              <span className="tv-tile-t">{t.label}</span>
              <span className="tv-tile-s" style={{ color: on ? 'rgba(255,255,255,0.8)' : sub }}>{tileSub(c, t.key)}</span>
            </div>
          )
        })}
      </div>
      <div className="tv-foot" style={{ color: sub }}>Hosted by {c.hostName} · Checkout {c.stay.checkOut}</div>
    </div>
  )
}
