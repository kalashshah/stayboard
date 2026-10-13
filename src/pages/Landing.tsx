import { useState } from 'react'
import { defaultConfig } from '../../worker/config'
import { api, ApiError, type Host } from '../api'
import { TvPreview } from '../components/Preview'

const demo = (() => {
  const c = defaultConfig('Ocean View Loft')
  c.hostName = 'Priya'
  c.welcome.guestName = 'Sam'
  c.wifi = { ssid: 'LoftNet', password: 'seabreeze22' }
  return c
})()

export function Landing({ onSignedIn }: { onSignedIn: (h: Host) => void }) {
  const [auth, setAuth] = useState<'signup' | 'login' | null>(null)
  return (
    <div className="landing">
      <header className="l-top">
        <a className="brand" href="/"><span className="brand-dot" /> Stayboard</a>
        <nav className="l-nav">
          <a href="#how">How it works</a>
          <button className="btn sm" onClick={() => setAuth('login')}>Sign in</button>
          <button className="btn primary sm" onClick={() => setAuth('signup')}>Create your screen</button>
        </nav>
      </header>

      <section className="l-hero">
        <div className="l-copy">
          <span className="eyebrow">For Fire TV · built on Vega OS</span>
          <h1>Your rental's welcome screen, <em>on the TV.</em></h1>
          <p>
            Wi-Fi, checkout, house rules and local picks on the big screen the moment it turns on. Guests ask the TV anything and it
            answers from your house guide. Whatever it can't answer lands in your inbox as a ready-to-fill FAQ.
          </p>
          <div className="row">
            <button className="btn primary lg" onClick={() => setAuth('signup')}>Create your screen</button>
            <button className="btn lg" onClick={() => setAuth('login')}>Sign in</button>
          </div>
          <span className="muted small">Free and open source. No subscription, no app for guests to install.</span>
        </div>
        <div className="l-demo">
          <TvPreview config={demo} focus="ask" />
          <div className="l-ask card">
            <span className="chip accent">Guest asked the TV</span>
            <p className="l-q">"How do I turn on the hot tub?"</p>
            <p className="l-a">Lift the cover and press the big round button on the side. It takes about 20 minutes to heat up. Please put the cover back when you're done.</p>
          </div>
        </div>
      </section>

      <section className="l-section" id="how">
        <h2 className="l-h2">Set it up once. The TV does the rest.</h2>
        <div className="l-grid">
          <Step n="1" t="Paste your house info" d="Wi-Fi, checkout steps, rules, a few guide topics, your favorite spots nearby. Everything is editable any time and the TV updates within a minute." />
          <Step n="2" t="Pair the Fire TV" d="The TV shows a six-letter code. Type it in here. No account on the TV, nothing for guests to sign into." />
          <Step n="3" t="Guests ask the TV" d="“Where's the first aid kit?” “Is there a hair dryer?” Answers come only from what you wrote. Guests can also scan a code and ask from their phone." />
          <Step n="4" t="You answer once" d="Questions the guide can't answer show up in your inbox. One click turns them into an FAQ, so the next guest gets the answer instantly." />
        </div>
      </section>

      <section className="l-section">
        <h2 className="l-h2">Extremely configurable, deliberately simple.</h2>
        <div className="l-grid">
          <Point t="Every section is yours" d="Headline with the guest's name, message, check-in and checkout, Wi-Fi with a scannable code, rules, guide, FAQs, local picks, contacts." />
          <Point t="Looks like your place" d="Accent color, light or dark, your own background photo, and switch any tile off." />
          <Point t="Grounded answers" d="Amazon Nova reads only your house guide. If it isn't in there, the TV says so and points guests to you." />
          <Point t="Private by design" d="No guest accounts, no tracking. The TV holds your house guide and a pairing secret, nothing about your guests." />
        </div>
      </section>

      <section className="l-cta">
        <h2 className="l-h2">Put your house guide where guests already look.</h2>
        <button className="btn primary lg" onClick={() => setAuth('signup')}>Create your screen</button>
        <span className="muted small">Takes about ten minutes.</span>
      </section>

      <footer className="l-foot muted small">
        <span>Stayboard · Fire TV app on Vega OS · Amazon Bedrock Nova 2 Lite · Cloudflare Workers</span>
        <span>Built for the Amazon Developer Hackathon 2026</span>
      </footer>

      {auth && <Auth mode={auth} onMode={setAuth} onClose={() => setAuth(null)} onDone={onSignedIn} />}
    </div>
  )
}

const Step = ({ n, t, d }: { n: string; t: string; d: string }) => (
  <div className="card l-step">
    <span className="l-n">{n}</span>
    <h3>{t}</h3>
    <p className="muted">{d}</p>
  </div>
)

const Point = ({ t, d }: { t: string; d: string }) => (
  <div className="l-point">
    <h3>{t}</h3>
    <p className="muted">{d}</p>
  </div>
)

export function Auth({ mode, onMode, onClose, onDone }: { mode: 'signup' | 'login'; onMode: (m: 'signup' | 'login') => void; onClose: () => void; onDone: (h: Host) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = mode === 'signup' ? await api.signup(email, password) : await api.login(email, password)
      onDone(r.host)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="modal" onClick={onClose}>
      <form className="card login" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{mode === 'signup' ? 'Create your screen' : 'Welcome back'}</h2>
        <p className="muted">{mode === 'signup' ? 'An email and a password is all it takes.' : 'Sign in to edit your properties.'}</p>
        <div className="field">
          <label>Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input id="password" className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        <button type="button" className="btn ghost sm" onClick={() => onMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </div>
  )
}
