import { useCallback, useEffect, useRef, useState } from 'react'
import { navigate } from '../App'
import { ago, api, ApiError, wifiQr, type Device, type Property, type PropertyConfig, type Question, type TileKey } from '../api'
import { Area, Field, ObjectList, StringList, Text, Toggle } from '../components/Fields'
import { Qr } from '../components/Qr'
import { TvPreview } from '../components/Preview'
import { DesignTab } from './Design'

const NAV: [string, [string, string][]][] = [
  ['Content', [['welcome', 'Welcome'], ['stay', 'Stay & Wi-Fi'], ['rules', 'House rules'], ['guide', 'Guide'], ['faqs', 'FAQs'], ['places', 'Local picks'], ['contacts', 'Contacts']]],
  ['Design', [['design', 'Design studio']]],
  ['Concierge', [['ask', 'Ask the house'], ['inbox', 'Inbox']]],
  ['TV', [['devices', 'Devices']]],
]
const FOCUS: Record<string, TileKey> = { stay: 'wifi', rules: 'rules', guide: 'guide', places: 'places', contacts: 'contacts', ask: 'ask', inbox: 'ask', faqs: 'ask' }

export function Editor({ id, tab }: { id: string; tab: string }) {
  const [prop, setProp] = useState<Property | null>(null)
  const [config, setConfig] = useState<PropertyConfig | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [guestUrl, setGuestUrl] = useState('')
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [status, setStatus] = useState<'saved' | 'saving' | 'dirty' | string>('saved')
  const [missing, setMissing] = useState(false)
  const latest = useRef<PropertyConfig | null>(null) // newest config, for saves that outlive a render
  const dirty = useRef(false)
  const chain = useRef<Promise<boolean>>(Promise.resolve(true)) // saves run one after another, in order
  const timer = useRef<number>(0)

  useEffect(() => {
    api.property(id).then((r) => {
      setProp(r.property)
      setConfig(r.property.config)
      latest.current = r.property.config
      setDevices(r.devices)
      setGuestUrl(r.guestUrl)
    }).catch(() => setMissing(true))
  }, [id])

  const loadQuestions = () => api.questions(id).then((r) => setQuestions(r.questions))
  useEffect(() => {
    if (tab === 'inbox' || questions === null) loadQuestions()
  }, [tab, id])

  const go = (t: string) => navigate(`/app/p/${id}?tab=${t}`)
  useEffect(() => { if (tab === 'appearance') go('design') }, [tab]) // old links

  /** Save the newest config (or the one given). Resolves true when that save landed. */
  const save = useCallback((cfg?: PropertyConfig) => {
    const toSave = cfg ?? latest.current
    if (!toSave) return Promise.resolve(false)
    dirty.current = false
    setStatus('saving')
    const p = chain.current.then(async () => {
      try {
        await api.saveConfig(id, toSave)
        setStatus(dirty.current ? 'dirty' : 'saved')
        return true
      } catch (e) {
        dirty.current = true
        setStatus(e instanceof ApiError ? e.message : 'Could not save')
        return false
      }
    })
    chain.current = p
    return p
  }, [id])

  // autosave 600 ms after the last change; a pending save is flushed, not dropped, when leaving the page
  const update = (patch: (c: PropertyConfig) => PropertyConfig) => {
    if (!latest.current) return
    const next = patch(latest.current)
    latest.current = next
    setConfig(next)
    dirty.current = true
    setStatus('dirty')
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => save(), 600)
  }
  const mounted = useRef(true)
  useEffect(() => () => {
    mounted.current = false
    clearTimeout(timer.current)
    if (dirty.current) save()
  }, [save])

  if (missing) return <main><p className="muted" style={{ marginTop: 40 }}>That property doesn't exist.</p></main>
  if (!prop || !config) return null
  const c = config
  const set = <K extends keyof PropertyConfig>(k: K, v: PropertyConfig[K]) => update((x) => ({ ...x, [k]: v }))
  const unanswered = questions?.filter((q) => !q.answered).length ?? 0

  const addFaq = async (q: Question) => {
    const cur = latest.current
    if (!cur) return
    if (cur.faqs.length >= 40) {
      setStatus('The FAQ list is full (40). Remove one first.')
      return
    }
    const next = { ...cur, faqs: [...cur.faqs, { q: q.question, a: '' }] }
    latest.current = next
    setConfig(next)
    clearTimeout(timer.current)
    if (!(await save(next))) return // keep the question in the inbox if the save failed
    await api.deleteQuestion(id, q.id)
    if (!mounted.current) return // the host already left this page; don't drag them back
    loadQuestions()
    go('faqs')
  }

  const panel = (
    <section className="panel stack">
      {tab === 'welcome' && (
        <>
          <Field label="Property name"><Text value={c.name} maxLength={80} onChange={(v) => set('name', v)} /></Field>
          <Field label="Host name" hint="Shown on the screen and used by the concierge."><Text value={c.hostName} maxLength={60} onChange={(v) => set('hostName', v)} /></Field>
          <Field label="Headline" hint="Write {guest} where the guest's name should go.">
            <Text value={c.welcome.headline} maxLength={80} onChange={(v) => set('welcome', { ...c.welcome, headline: v })} />
          </Field>
          <Field label="Guest name for this stay" hint="Leave empty for a generic welcome.">
            <Text value={c.welcome.guestName} maxLength={60} placeholder="Sam" onChange={(v) => set('welcome', { ...c.welcome, guestName: v })} />
          </Field>
          <Field label="Welcome message"><Area rows={3} value={c.welcome.message} maxLength={400} onChange={(v) => set('welcome', { ...c.welcome, message: v })} /></Field>
        </>
      )}

      {tab === 'stay' && (
        <>
          <div className="cols">
            <Field label="Check-in"><Text value={c.stay.checkIn} maxLength={20} onChange={(v) => set('stay', { ...c.stay, checkIn: v })} /></Field>
            <Field label="Checkout"><Text value={c.stay.checkOut} maxLength={20} onChange={(v) => set('stay', { ...c.stay, checkOut: v })} /></Field>
          </div>
          <Field label="Checkout steps" hint="Shown as a checklist on the TV.">
            <StringList items={c.stay.checkoutSteps} addLabel="Add step" placeholder="Strip the beds" onChange={(v) => set('stay', { ...c.stay, checkoutSteps: v })} />
          </Field>
          <h3>Wi-Fi</h3>
          <div className="cols">
            <Field label="Network name"><Text value={c.wifi.ssid} maxLength={64} onChange={(v) => set('wifi', { ...c.wifi, ssid: v })} /></Field>
            <Field label="Password"><Text value={c.wifi.password} maxLength={64} onChange={(v) => set('wifi', { ...c.wifi, password: v })} /></Field>
          </div>
          {c.wifi.ssid && (
            <div className="row">
              <Qr text={wifiQr(c)} size={120} />
              <span className="muted small">Guests scan this on the TV to join without typing.</span>
            </div>
          )}
        </>
      )}

      {tab === 'rules' && (
        <Field label="House rules" hint="Short and specific works best.">
          <StringList items={c.rules} addLabel="Add rule" placeholder="Quiet hours 10 PM – 8 AM" onChange={(v) => set('rules', v)} />
        </Field>
      )}

      {tab === 'guide' && (
        <Field label="House guide" hint="How things work. The concierge answers from these.">
          <ObjectList
            items={c.guide} onChange={(v) => set('guide', v)} addLabel="Add topic" blank={{ title: '', body: '' }}
            title={(g) => g.title || 'New topic'}
            cols={[{ key: 'title', label: 'Topic', placeholder: 'The hot tub' }, { key: 'body', label: 'How it works', kind: 'area', placeholder: 'Lift the cover, press the big round button…' }]}
          />
        </Field>
      )}

      {tab === 'faqs' && (
        <Field label="FAQs" hint="Questions guests keep asking. Unanswered inbox questions land here with one click.">
          <ObjectList
            items={c.faqs} onChange={(v) => set('faqs', v)} addLabel="Add FAQ" blank={{ q: '', a: '' }}
            title={(f) => f.q || 'New question'}
            cols={[{ key: 'q', label: 'Question', placeholder: 'Is there a hair dryer?' }, { key: 'a', label: 'Answer', kind: 'area', placeholder: 'Yes, in the top drawer of the bathroom vanity.' }]}
          />
        </Field>
      )}

      {tab === 'places' && (
        <Field label="Local picks">
          <ObjectList
            items={c.places} onChange={(v) => set('places', v)} addLabel="Add place" blank={{ name: '', category: '', note: '', distance: '' }}
            title={(p) => p.name || 'New place'}
            cols={[
              { key: 'name', label: 'Name', placeholder: 'Luna Trattoria' }, { key: 'category', label: 'Category', placeholder: 'Dinner' },
              { key: 'distance', label: 'Distance', placeholder: '10 min walk' }, { key: 'note', label: 'Why you like it', placeholder: 'Book ahead on weekends.' },
            ]}
          />
        </Field>
      )}

      {tab === 'contacts' && (
        <Field label="Contacts">
          <ObjectList
            items={c.contacts} onChange={(v) => set('contacts', v)} addLabel="Add contact" blank={{ label: '', value: '' }}
            title={(k) => k.label || 'New contact'}
            cols={[{ key: 'label', label: 'Who', placeholder: 'Host' }, { key: 'value', label: 'How to reach', placeholder: 'Text (555) 010-0100' }]}
          />
        </Field>
      )}

      {tab === 'ask' && (
        <>
          <Toggle on={c.ask.enabled} label="Let guests ask questions on the TV and the guest page" onChange={(v) => set('ask', { ...c.ask, enabled: v })} />
          <Field label="Tone">
            <select className="input" value={c.ask.tone} onChange={(e) => set('ask', { ...c.ask, tone: e.target.value as 'friendly' | 'formal' })}>
              <option value="friendly">Warm and friendly</option>
              <option value="formal">Polite and formal</option>
            </select>
          </Field>
          <Field label="When the guide doesn't have the answer" hint="The concierge says it's not in the guide, then adds this.">
            <Text value={c.ask.fallback} maxLength={200} onChange={(v) => set('ask', { ...c.ask, fallback: v })} />
          </Field>
          <Field label="Suggested questions" hint="Shown as quick picks on the Ask screen.">
            <StringList items={c.ask.suggested} addLabel="Add suggestion" placeholder="When is checkout?" onChange={(v) => set('ask', { ...c.ask, suggested: v })} />
          </Field>
          <p className="muted small">Answers come only from what you've written in Stay, Rules, Guide, FAQs, Local picks and Contacts. Nothing else is sent to the model.</p>
        </>
      )}

      {tab === 'devices' && <Devices id={id} devices={devices} setDevices={setDevices} guestUrl={guestUrl} />}

      {tab === 'inbox' && (
        <Inbox questions={questions} onRefresh={loadQuestions} onAddFaq={addFaq} onDismiss={(q) => api.deleteQuestion(id, q.id).then(loadQuestions)} />
      )}
    </section>
  )

  return (
    <main className="editor">
      <div className="editor-head">
        <div>
          <a href="/app" className="muted small" onClick={(e) => { e.preventDefault(); navigate('/app') }}>← Properties</a>
          <h1>{c.name}</h1>
        </div>
        <div className="row">
          <span className={`status ${status === 'saved' ? 'ok' : status === 'saving' || status === 'dirty' ? '' : 'bad'}`}>
            {status === 'saved' ? 'Saved' : status === 'saving' || status === 'dirty' ? 'Saving…' : status}
          </span>
          <a className="btn sm" href={guestUrl} target="_blank" rel="noreferrer">Guest page ↗</a>
        </div>
      </div>

      <div className="studio">
        <nav className="side-nav" aria-label="Editor sections">
          {NAV.map(([group, items]) => (
            <div className="side-group" key={group}>
              <span className="eyebrow">{group}</span>
              {items.map(([k, label]) => (
                <button key={k} className={`side-item ${tab === k ? 'on' : ''}`} onClick={() => go(k)}>
                  {label}
                  {k === 'inbox' && unanswered > 0 && <span className="count">{unanswered}</span>}
                  {k === 'devices' && devices.length === 0 && <span className="dot" title="No TV paired" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {tab === 'design' ? (
          <div className="editor-main">
            <div className="design-stage">
              <TvPreview config={c} frame focus="ask" />
              <span className="muted small">Live preview · paired TVs pick up changes within a minute</span>
            </div>
            <DesignTab id={id} c={c} set={set} />
          </div>
        ) : (
          <div className="editor-body">
            <div className="editor-main">{panel}</div>
            <aside className="editor-side">
              <span className="field"><label>Live preview · TV home screen</label></span>
              <TvPreview config={c} frame focus={FOCUS[tab] ?? 'wifi'} />
              <p className="muted small">Paired TVs pick up changes within a minute.</p>
              <details className="danger-zone">
                <summary className="muted small">Delete this property</summary>
                <button className="btn danger sm" onClick={() => { if (confirm(`Delete ${c.name}? Paired TVs will go back to the pairing screen.`)) api.deleteProperty(id).then(() => navigate('/app')) }}>Delete {c.name}</button>
              </details>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function Devices({ id, devices, setDevices, guestUrl }: { id: string; devices: Device[]; setDevices: (d: Device[]) => void; guestUrl: string }) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('Living room TV')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const pair = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const r = await api.pair(id, code, label)
      setDevices(r.devices)
      setCode('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }
  return (
    <>
      <h3>Pair a Fire TV</h3>
      <p className="muted small">Open Stayboard on the TV. It shows a six-letter code until it's paired.</p>
      <form className="row" onSubmit={pair}>
        <input className="input code" style={{ width: 150 }} placeholder="ABC123" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
        <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Which TV" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        <button className="btn primary" disabled={code.length !== 6}>Pair</button>
      </form>
      {error && <p className="error">{error}</p>}
      {devices.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {devices.map((d) => (
            <div className="card row" key={d.code} style={{ padding: '12px 16px' }}>
              <div style={{ flex: 1 }}>
                <strong>{d.label}</strong>
                <div className="muted small">Code {d.code} · last seen {ago(d.last_seen_at)}</div>
              </div>
              <span className={`chip ${d.last_seen_at && Date.now() - d.last_seen_at < 150_000 ? 'ok' : ''}`}>{d.last_seen_at && Date.now() - d.last_seen_at < 150_000 ? 'Online' : 'Offline'}</span>
              <button className="btn danger sm" onClick={() => api.unpair(id, d.code).then((r) => setDevices(r.devices))}>Unpair</button>
            </div>
          ))}
        </div>
      )}
      <h3 style={{ marginTop: 12 }}>Guest page</h3>
      <p className="muted small">The TV shows this QR code on the Ask screen, so guests can read the guide and ask from their phones.</p>
      <div className="row">
        <Qr text={guestUrl} size={120} />
        <div className="stack" style={{ gap: 6 }}>
          <a href={guestUrl} target="_blank" rel="noreferrer" className="small">{guestUrl}</a>
          <button className="btn sm" onClick={() => navigator.clipboard.writeText(guestUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>{copied ? 'Copied' : 'Copy link'}</button>
        </div>
      </div>
    </>
  )
}

function Inbox({ questions, onRefresh, onAddFaq, onDismiss }: { questions: Question[] | null; onRefresh: () => void; onAddFaq: (q: Question) => void; onDismiss: (q: Question) => void }) {
  if (questions === null) return <p className="muted">Loading…</p>
  const open = questions.filter((q) => !q.answered)
  const done = questions.filter((q) => q.answered)
  return (
    <>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <h3>Questions guests asked</h3>
        <button className="btn ghost sm" onClick={onRefresh}>Refresh</button>
      </div>
      {questions.length === 0 && <p className="muted">Nothing yet. Once a guest asks the TV something, it shows up here.</p>}
      {open.length > 0 && <p className="muted small">The guide couldn't answer these. Add an FAQ and the next guest gets an instant answer.</p>}
      {open.map((q) => (
        <div className="card question open" key={q.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="chip urgent">Needs an answer</span>
            <span className="muted small">{q.source === 'tv' ? 'On the TV' : 'From a phone'} · {ago(q.created_at)}</span>
          </div>
          <p className="q">“{q.question}”</p>
          <p className="muted small">The TV said: {q.answer}</p>
          <div className="row">
            <button className="btn primary sm" onClick={() => onAddFaq(q)}>Add as FAQ</button>
            <button className="btn ghost sm" onClick={() => onDismiss(q)}>Dismiss</button>
          </div>
        </div>
      ))}
      {done.length > 0 && <h3 style={{ marginTop: 8 }}>Answered from your guide</h3>}
      {done.map((q) => (
        <div className="card question" key={q.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="chip ok">Answered</span>
            <span className="muted small">{q.source === 'tv' ? 'On the TV' : 'From a phone'} · {ago(q.created_at)}</span>
          </div>
          <p className="q">“{q.question}”</p>
          <p className="small">{q.answer}</p>
          <div><button className="btn ghost sm" onClick={() => onDismiss(q)}>Dismiss</button></div>
        </div>
      ))}
    </>
  )
}
