import { useEffect, useState } from 'react'
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
  // /?error=... comes back from the Google callback; open the sign-in modal with it and clean the URL.
  const [initialError] = useState(() => new URLSearchParams(location.search).get('error') ?? '')
  const [auth, setAuth] = useState<'signup' | 'login' | null>(initialError ? 'login' : null)
  useEffect(() => { if (initialError) history.replaceState(null, '', location.pathname) }, [initialError])
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

      {auth && <Auth mode={auth} onMode={setAuth} onClose={() => setAuth(null)} onDone={onSignedIn} initialError={initialError} />}
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

export function Auth({ mode, onMode, onClose, onDone, initialError = '' }: { mode: 'signup' | 'login'; onMode: (m: 'signup' | 'login') => void; onClose: () => void; onDone: (h: Host) => void; initialError?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError)
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
        <a className="btn google" href="/api/auth/google">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
            <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
          </svg>
          Continue with Google
        </a>
        <div className="or muted small">or</div>
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
