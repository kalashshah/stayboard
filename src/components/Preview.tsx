// Web rendering of the TV home screen. Same layout engine as the TV (layoutFor/backdropFor); sizes in cqw so it scales with its box.
import { useEffect, useState, type CSSProperties } from 'react'
import { backdropFor, headlineFor, ICONS, layoutFor, RADIUS, tileSub, visibleTiles, type Font, type PropertyConfig, type TileKey } from '../api'

export const FONT_STACK: Record<Font, string> = {
  sans: "'Inter', system-ui, sans-serif",
  serif: "'Fraunces', Georgia, serif",
  grotesk: "'Space Grotesk', system-ui, sans-serif",
}
/** TV logical px (960 wide) → container width units. */
const px = (n: number) => `${(n * 0.104).toFixed(2)}cqw`

export function TvPreview({ config: c, focus, time = '7:42 PM', frame = false }: { config: PropertyConfig; focus?: TileKey; time?: string; frame?: boolean }) {
  const d = c.design
  const L = layoutFor(c)
  const dark = c.appearance.theme === 'dark'
  const accent = c.appearance.accent
  const ink = dark ? '#fff' : '#1c1c1c'
  const sub = dark ? 'rgba(255,255,255,0.72)' : 'rgba(28,28,28,0.7)'
  const tileBg = d.tileStyle === 'solid' ? (dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.92)') : d.tileStyle === 'outline' ? 'transparent' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'
  const tileBorder = d.tileStyle === 'outline' ? `0.2cqw solid ${dark ? 'rgba(255,255,255,0.45)' : 'rgba(28,28,28,0.3)'}` : `0.1cqw solid ${d.tileStyle === 'glass' ? (dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,28,28,0.08)') : 'transparent'}`
  const tiles = visibleTiles(c)
  const focusKey = focus && tiles.some((t) => t.key === focus) ? focus : tiles[0]?.key
  const style = {
    fontFamily: FONT_STACK[d.font], color: ink,
    '--r': px(RADIUS[d.radius]), '--h': px(L.headline), '--tile-bg': tileBg, '--tile-border': tileBorder, '--accent': accent,
  } as CSSProperties
  const screen = (
    <div className="tv" data-layout={d.layout} data-hero={L.hero} data-tiles={L.tiles} data-align={L.align} style={style}>
      <Backdrop c={c} dark={dark} accent={accent} scrim={L.scrim} />
      {L.topBar !== 'none' && (
        <div className={`tv-top ${L.topBar}`}>
          {L.topBar === 'logo' && !d.logo ? <span /> : <Brand c={c} />}
          {d.showClock && <span className="tv-time" style={{ color: sub }}>{time}</span>}
        </div>
      )}
      <div className="tv-body">
        <div className="tv-hero">
          <h2 className="tv-h">{headlineFor(c)}</h2>
          {L.hero !== 'top' && c.welcome.message && <p className="tv-p" style={{ color: sub }}>{c.welcome.message}</p>}
        </div>
        {L.mediaCard && <MediaCard c={c} accent={accent} />}
      </div>
      <div className="tv-grid">
        {tiles.map((t) => {
          const on = t.key === focusKey
          return (
            <div className={`tv-tile ${on ? 'on' : ''}`} key={t.key} style={on ? { background: accent, color: '#fff', borderColor: 'transparent' } : undefined}>
              <span className="tv-glyph">{ICONS[t.icon]}</span>
              <span className="tv-tile-text">
                <span className="tv-tile-t">{t.label}</span>
                <span className="tv-tile-s" style={{ color: on ? 'rgba(255,255,255,0.8)' : sub }}>{tileSub(c, t.key)}</span>
              </span>
            </div>
          )
        })}
      </div>
      {L.footer && <div className="tv-foot" style={{ color: sub }}>Hosted by {c.hostName} · Check-in {c.stay.checkIn} · Checkout {c.stay.checkOut}</div>}
    </div>
  )
  return frame ? <div className="tv-frame">{screen}</div> : screen
}

const Brand = ({ c }: { c: PropertyConfig }) => (c.design.logo ? <img className="tv-logo" src={c.design.logo} alt={c.name} /> : <span className="tv-brand">{c.name}</span>)

function Backdrop({ c, dark, accent, scrim }: { c: PropertyConfig; dark: boolean; accent: string; scrim: boolean }) {
  const b = backdropFor(c)
  const { overlay, blur, interval } = c.design.backdrop
  const count = b.kind === 'slideshow' ? b.urls.length : 0
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!count) return
    const id = setInterval(() => setI((x) => x + 1), interval * 1000)
    return () => clearInterval(id)
  }, [count, interval])
  const filter = blur ? `blur(${blur * 0.5}px)` : undefined
  const tint = dark ? `rgba(0,0,0,${overlay / 100})` : `rgba(255,255,255,${overlay / 100})`
  return (
    <>
      {b.kind === 'color' && (
        <div className="tv-bg" style={{ background: dark
          ? `radial-gradient(120% 90% at 85% 10%, ${accent}66, transparent 60%), linear-gradient(160deg, #15110f, #0b0a09)`
          : `radial-gradient(120% 90% at 85% 10%, ${accent}33, transparent 60%), linear-gradient(160deg, #fbf7f3, #efe9e3)` }} />
      )}
      {b.kind === 'photo' && <img className="tv-bg" src={b.url} alt="" style={{ filter }} />}
      {b.kind === 'slideshow' && b.urls.map((u, k) => <img key={`${u}${k}`} className="tv-bg fade" src={u} alt="" style={{ opacity: k === i % b.urls.length ? 1 : 0, filter }} />)}
      {b.kind === 'video' && <video className="tv-bg" src={b.url} poster={b.poster || undefined} muted loop autoPlay playsInline style={{ filter }} />}
      {b.kind !== 'color' && <div className="tv-bg" style={{ background: tint }} />}
      {scrim && <div className="tv-bg" style={{ background: dark ? 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.75))' : 'linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.85))' }} />}
    </>
  )
}

function MediaCard({ c, accent }: { c: PropertyConfig; accent: string }) {
  const b = backdropFor(c)
  const d = c.design.backdrop
  const photo = b.kind === 'photo' ? b.url : b.kind === 'slideshow' ? b.urls[0] : b.kind === 'video' ? b.poster : d.photos[0] || d.poster
  return (
    <div className="tv-media">
      {b.kind === 'video' ? <video src={b.url} poster={b.poster || undefined} muted loop autoPlay playsInline /> : photo ? <img src={photo} alt="" /> : <div style={{ background: `linear-gradient(160deg, ${accent}, ${accent}66)`, width: '100%', height: '100%' }} />}
    </div>
  )
}
