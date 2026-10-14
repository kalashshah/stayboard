import { useEffect, useState } from 'react'
import { api, ApiError, backdropFor, headlineFor, visibleTiles, wifiQr, type Answer, type PropertyConfig, type Tile } from '../api'
import { FONT_STACK } from '../components/Preview'
import { Qr } from '../components/Qr'

export function Guest({ slug }: { slug: string }) {
  const [c, setC] = useState<PropertyConfig | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    api.guest(slug).then((r) => setC(r.config)).catch(() => setMissing(true))
  }, [slug])
  useEffect(() => { document.title = c ? `${c.name} · Stayboard` : 'Stayboard' }, [c])

  if (missing) return <main className="guest"><p className="muted" style={{ padding: 40, textAlign: 'center' }}>This guest page doesn't exist any more.</p></main>
  if (!c) return null
  const accent = c.appearance.accent
  const b = backdropFor(c)
  const photo = b.kind === 'photo' ? b.url : b.kind === 'slideshow' ? b.urls[0] : b.kind === 'video' ? b.poster : ''
  const tiles = visibleTiles(c)
  const ask = tiles.find((t) => t.key === 'ask')
  const hero = photo
    ? `linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.72)), url(${photo}) center/cover`
    : `linear-gradient(160deg, ${accent}, ${accent}99)`
  return (
    <main className="guest" style={{ ['--accent' as string]: accent, ['--font' as string]: FONT_STACK[c.design.font] }}>
      <header className="g-hero" style={{ background: hero }}>
        {c.design.logo ? <img className="g-logo" src={c.design.logo} alt={c.name} /> : <span className="g-name">{c.name}</span>}
        <h1>{headlineFor(c)}</h1>
        <p>{c.welcome.message}</p>
        <span className="g-host">Hosted by {c.hostName}</span>
      </header>

      {ask && <Ask slug={slug} c={c} />}
      {tiles.filter((t) => t.key !== 'ask').map((t) => <Section key={t.key} t={t} c={c} />)}

      <footer className="muted small" style={{ textAlign: 'center', padding: '24px 0 40px' }}>Stayboard · a Fire TV welcome screen</footer>
    </main>
  )
}

function Section({ t, c }: { t: Tile; c: PropertyConfig }) {
  switch (t.key) {
    case 'wifi':
      if (!c.wifi.ssid) return null
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="g-kv"><span className="muted small">Network</span><strong>{c.wifi.ssid}</strong></div>
              <div className="g-kv"><span className="muted small">Password</span><strong className="code">{c.wifi.password}</strong></div>
              <CopyButton text={c.wifi.password} />
            </div>
            <Qr text={wifiQr(c)} size={110} />
          </div>
        </section>
      )
    case 'checkout':
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          <div className="g-kv"><span className="muted small">Check-in</span><strong>{c.stay.checkIn}</strong></div>
          <div className="g-kv"><span className="muted small">Checkout</span><strong>{c.stay.checkOut}</strong></div>
          {c.stay.checkoutSteps.length > 0 && (
            <>
              <p className="muted small" style={{ marginTop: 8 }}>Before you leave</p>
              <ul className="g-list">{c.stay.checkoutSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
        </section>
      )
    case 'rules':
      if (!c.rules.length) return null
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          <ul className="g-list">{c.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )
    case 'guide':
      if (!c.guide.length && !c.faqs.length) return null
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          {c.guide.map((g, i) => (
            <details key={i} className="g-topic">
              <summary>{g.title}</summary>
              <p>{g.body}</p>
            </details>
          ))}
          {c.faqs.map((f, i) => (
            <details key={`f${i}`} className="g-topic">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )
    case 'places':
      if (!c.places.length) return null
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          {c.places.map((p, i) => (
            <div key={i} className="g-place">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{p.name}</strong>
                <span className="muted small">{[p.category, p.distance].filter(Boolean).join(' · ')}</span>
              </div>
              <p className="small">{p.note}</p>
            </div>
          ))}
        </section>
      )
    case 'contacts':
      if (!c.contacts.length) return null
      return (
        <section className="card g-sec">
          <h2>{t.label}</h2>
          {c.contacts.map((k, i) => (
            <div className="g-kv" key={i}><span className="muted small">{k.label}</span><strong>{k.value}</strong></div>
          ))}
        </section>
      )
    default:
      return null
  }
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="btn sm" style={{ marginTop: 8 }} onClick={() => navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}>
      {ok ? 'Copied' : 'Copy password'}
    </button>
  )
}

function Ask({ slug, c }: { slug: string; c: PropertyConfig }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [a, setA] = useState<{ q: string; r: Answer } | null>(null)
  const [error, setError] = useState('')
  const send = async (question: string) => {
    const t = question.trim()
    if (!t) return
    setBusy(true)
    setError('')
    try {
      setA({ q: t, r: await api.guestAsk(slug, t) })
      setQ('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not ask right now')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="card g-sec g-ask">
      <h2>Ask the house</h2>
      <p className="muted small">Anything about the place. Answers come from {c.hostName}'s house guide.</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(q) }}>
        <input className="input" style={{ flex: 1 }} placeholder="Is there a hair dryer?" maxLength={300} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn primary" disabled={busy || !q.trim()}>{busy ? '…' : 'Ask'}</button>
      </form>
      {c.ask.suggested.length > 0 && (
        <div className="row" style={{ gap: 6 }}>
          {c.ask.suggested.slice(0, 4).map((s) => <button key={s} className="chip btn-chip" onClick={() => send(s)} disabled={busy}>{s}</button>)}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {a && (
        <div className="g-answer">
          <p className="muted small">“{a.q}”</p>
          <p>{a.r.answer}</p>
        </div>
      )}
    </section>
  )
}
