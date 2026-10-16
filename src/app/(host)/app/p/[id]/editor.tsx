'use client'

import {
  RiArrowLeftSLine, RiBookOpenLine, RiCheckLine, RiChat3Line, RiContactsBook2Line, RiDeleteBinLine, RiErrorWarningLine, RiExternalLinkLine,
  RiFileCopyLine, RiHandHeartLine, RiInbox2Line, RiKey2Line, RiLoader4Line, RiMapPin2Line, RiPaletteLine, RiQuestionAnswerLine, RiRefreshLine, RiScales3Line, RiTvLine,
} from '@remixicon/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ago, api, ApiError, wifiQr, type Device, type Property, type PropertyConfig, type Question, type TileKey } from '@/api'
import { Area, Field, Head, ObjectList, Segmented, StringList, Text, Toggle } from '@/components/Fields'
import { TvPreview } from '@/components/Preview'
import { Qr } from '@/components/Qr'
import { Alert } from '@/components/ui/alert'
import * as Badge from '@/components/ui/badge'
import * as Btn from '@/components/ui/button'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { DesignTab } from './design'
import { WelcomeTab } from './welcome'

type Icon = typeof RiTvLine
const NAV: [string, [string, string, Icon][]][] = [
  ['Content', [['welcome', 'Welcome', RiHandHeartLine], ['stay', 'Stay & Wi-Fi', RiKey2Line], ['rules', 'House rules', RiScales3Line], ['guide', 'Guide', RiBookOpenLine], ['faqs', 'FAQs', RiQuestionAnswerLine], ['places', 'Local picks', RiMapPin2Line], ['contacts', 'Contacts', RiContactsBook2Line]]],
  ['Design', [['design', 'Design studio', RiPaletteLine]]],
  ['Concierge', [['ask', 'Ask the house', RiChat3Line], ['inbox', 'Inbox', RiInbox2Line]]],
  ['TV', [['devices', 'Devices', RiTvLine]]],
]
const FOCUS: Record<string, TileKey> = { stay: 'wifi', rules: 'rules', guide: 'guide', places: 'places', contacts: 'contacts', ask: 'ask', inbox: 'ask', faqs: 'ask' }

export function Editor({ property, initialDevices, guestUrl }: { property: Property; initialDevices: Device[]; guestUrl: string }) {
  const id = property.id
  const router = useRouter()
  const tab = useSearchParams().get('tab') ?? 'welcome'
  const [config, setConfig] = useState<PropertyConfig>(property.config)
  const [devices, setDevices] = useState(initialDevices)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [status, setStatus] = useState<'saved' | 'saving' | 'dirty' | string>('saved')
  const latest = useRef<PropertyConfig>(property.config) // newest config, for saves that outlive a render
  const dirty = useRef(false)
  const chain = useRef<Promise<boolean>>(Promise.resolve(true)) // saves run one after another, in order
  const timer = useRef<number>(0)

  const loadQuestions = () => api.questions(id).then((r) => setQuestions(r.questions))
  useEffect(() => {
    if (tab === 'inbox' || questions === null) loadQuestions()
  }, [tab, id])

  // Native pushState: Next syncs useSearchParams without a server round trip per tab.
  const go = (t: string) => { history.pushState(null, '', `?tab=${t}`); scrollTo({ top: 0 }) }

  /** Save the newest config (or the one given). Resolves true when that save landed. */
  const save = useCallback((cfg?: PropertyConfig) => {
    const toSave = cfg ?? latest.current
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

  const c = config
  const set = <K extends keyof PropertyConfig>(k: K, v: PropertyConfig[K]) => update((x) => ({ ...x, [k]: v }))
  const unanswered = questions?.filter((q) => !q.answered).length ?? 0

  /** Send the reply to the guest who asked, and keep it as an FAQ for every guest after. Resolves true once the guest will see it. */
  const reply = async (q: Question, text: string) => {
    try {
      await api.replyQuestion(id, q.id, text)
    } catch (e) {
      setStatus(e instanceof ApiError ? e.message : 'Could not send the reply')
      return false
    }
    const cur = latest.current
    if (cur.faqs.length >= 40) setStatus('Reply sent. The FAQ list is full (40), so it wasn’t saved as an FAQ.')
    else if (!cur.faqs.some((f) => f.q.trim().toLowerCase() === q.question.trim().toLowerCase())) {
      const next = { ...cur, faqs: [...cur.faqs, { q: q.question, a: text }] }
      latest.current = next
      setConfig(next)
      clearTimeout(timer.current)
      await save(next)
    }
    if (mounted.current) loadQuestions()
    return true
  }

  const panel = (
    <Card className="flex flex-col gap-5">
      {tab === 'stay' && (
        <>
          <Head title="Stay" hint="Times and the checkout checklist." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Check-in"><Text value={c.stay.checkIn} maxLength={20} onChange={(v) => set('stay', { ...c.stay, checkIn: v })} /></Field>
            <Field label="Checkout"><Text value={c.stay.checkOut} maxLength={20} onChange={(v) => set('stay', { ...c.stay, checkOut: v })} /></Field>
          </div>
          <Field group label="Checkout steps" hint="Shown as a checklist on the TV.">
            <StringList items={c.stay.checkoutSteps} addLabel="Add step" placeholder="Strip the beds" onChange={(v) => set('stay', { ...c.stay, checkoutSteps: v })} />
          </Field>
          <div className="border-t border-stroke-soft-200" />
          <Head title="Wi-Fi" hint="Guests scan the code on the TV to join without typing." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Network name"><Text value={c.wifi.ssid} maxLength={64} onChange={(v) => set('wifi', { ...c.wifi, ssid: v })} /></Field>
            <Field label="Password"><Text value={c.wifi.password} maxLength={64} onChange={(v) => set('wifi', { ...c.wifi, password: v })} /></Field>
          </div>
          {c.wifi.ssid && (
            <div className="flex items-center gap-3">
              <Qr text={wifiQr(c)} size={120} />
              <span className="text-paragraph-sm text-text-sub-600">This is the code the TV shows on the Wi-Fi tile.</span>
            </div>
          )}
        </>
      )}

      {tab === 'rules' && (
        <>
          <Head title="House rules" hint="Short and specific works best." />
          <StringList items={c.rules} addLabel="Add rule" placeholder="Quiet hours 10 PM – 8 AM" onChange={(v) => set('rules', v)} />
        </>
      )}

      {tab === 'guide' && (
        <>
          <Head title="House guide" hint="How things work. The concierge answers from these." />
          <ObjectList
            items={c.guide} onChange={(v) => set('guide', v)} addLabel="Add topic" blank={{ title: '', body: '' }}
            title={(g) => g.title || 'New topic'}
            cols={[{ key: 'title', label: 'Topic', placeholder: 'The hot tub' }, { key: 'body', label: 'How it works', kind: 'area', placeholder: 'Lift the cover, press the big round button…' }]}
          />
        </>
      )}

      {tab === 'faqs' && (
        <>
          <Head title="FAQs" hint="Questions guests keep asking. Unanswered inbox questions land here with one click." />
          <ObjectList
            items={c.faqs} onChange={(v) => set('faqs', v)} addLabel="Add FAQ" blank={{ q: '', a: '' }}
            title={(f) => f.q || 'New question'}
            cols={[{ key: 'q', label: 'Question', placeholder: 'Is there a hair dryer?' }, { key: 'a', label: 'Answer', kind: 'area', placeholder: 'Yes, in the top drawer of the bathroom vanity.' }]}
          />
        </>
      )}

      {tab === 'places' && (
        <>
          <Head title="Local picks" hint="Where you'd send a friend." />
          <ObjectList
            items={c.places} onChange={(v) => set('places', v)} addLabel="Add place" blank={{ name: '', category: '', note: '', distance: '' }}
            title={(p) => p.name || 'New place'}
            cols={[
              { key: 'name', label: 'Name', placeholder: 'Luna Trattoria' }, { key: 'category', label: 'Category', placeholder: 'Dinner' },
              { key: 'distance', label: 'Distance', placeholder: '10 min walk' }, { key: 'note', label: 'Why you like it', placeholder: 'Book ahead on weekends.' },
            ]}
          />
        </>
      )}

      {tab === 'contacts' && (
        <>
          <Head title="Contacts" hint="Who guests reach, and how." />
          <ObjectList
            items={c.contacts} onChange={(v) => set('contacts', v)} addLabel="Add contact" blank={{ label: '', value: '' }}
            title={(k) => k.label || 'New contact'}
            cols={[{ key: 'label', label: 'Who', placeholder: 'Host' }, { key: 'value', label: 'How to reach', placeholder: 'Text (555) 010-0100' }]}
          />
        </>
      )}

      {tab === 'ask' && (
        <>
          <Head title="Ask the house" hint="Guests ask in their own words; Amazon Nova answers from your guide." />
          <Toggle on={c.ask.enabled} label="Let guests ask questions on the TV and the guest page" onChange={(v) => set('ask', { ...c.ask, enabled: v })} />
          <Field group label="Tone">
            <div className="max-w-xs"><Segmented value={c.ask.tone} options={[['friendly', 'Warm and friendly'], ['formal', 'Polite and formal']]} onChange={(tone) => set('ask', { ...c.ask, tone })} /></div>
          </Field>
          <Field label="When the guide doesn't have the answer" hint="The concierge says it's not in the guide, then adds this.">
            <Text value={c.ask.fallback} maxLength={200} onChange={(v) => set('ask', { ...c.ask, fallback: v })} />
          </Field>
          <Field group label="Suggested questions" hint="Shown as quick picks on the Ask screen.">
            <StringList items={c.ask.suggested} addLabel="Add suggestion" placeholder="When is checkout?" onChange={(v) => set('ask', { ...c.ask, suggested: v })} />
          </Field>
          <Alert variant="info">Answers come only from what you've written in Stay, Rules, Guide, FAQs, Local picks and Contacts. Nothing else is sent to the model.</Alert>
        </>
      )}

      {tab === 'devices' && <Devices id={id} devices={devices} setDevices={setDevices} guestUrl={guestUrl} />}

      {tab === 'inbox' && (
        <Inbox questions={questions} hostName={c.hostName} onRefresh={loadQuestions} onReply={reply} onDismiss={(q) => api.deleteQuestion(id, q.id).then(loadQuestions)} />
      )}
    </Card>
  )

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-5">
        <div className="flex flex-col gap-1">
          <Link href="/app" className="flex items-center gap-0.5 self-start text-label-sm text-text-sub-600 hover:text-text-strong-950">
            <RiArrowLeftSLine className="size-4" />Properties
          </Link>
          <h1 className="text-title-h5 tracking-tight text-text-strong-950">{c.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatus status={status} />
          <a href={guestUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}>Guest page<RiExternalLinkLine className="relative z-10 -mr-1 size-4" /></a>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[196px_minmax(0,1fr)] lg:gap-7">
        <nav aria-label="Editor sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:sticky lg:top-[88px] lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0">
          {NAV.map(([group, items]) => (
            <div className="flex gap-1 lg:flex-col lg:gap-0.5" key={group}>
              <span className="hidden px-2.5 pb-1.5 text-subheading-2xs uppercase text-text-soft-400 lg:block">{group}</span>
              {items.map(([k, label, I]) => (
                <button key={k} onClick={() => go(k)} aria-current={tab === k ? 'page' : undefined}
                  className={cn(
                    'group flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-label-sm transition duration-200 ease-out',
                    tab === k ? 'bg-bg-white-0 text-text-strong-950 shadow-fancy-buttons-stroke' : 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
                  )}>
                  <I className={cn('size-[18px]', tab === k ? 'text-marker' : 'text-text-soft-400 group-hover:text-text-sub-600')} />
                  {label}
                  {k === 'inbox' && unanswered > 0 && <Badge.Root variant="filled" color="red" size="medium" square className="ml-auto">{unanswered}</Badge.Root>}
                  {k === 'devices' && devices.length === 0 && <span className="ml-auto size-1.5 rounded-full bg-marker" title="No TV paired" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {tab === 'design' || tab === 'welcome' ? (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="z-10 flex flex-col items-center gap-2 bg-gradient-to-b from-paper from-85% to-transparent pb-3 lg:sticky lg:top-[64px]">
              <div className="w-full max-w-[480px]"><TvPreview config={c} frame focus={tab === 'design' ? 'ask' : undefined} /></div>
              <span className="text-paragraph-xs text-text-soft-400">Live preview · paired TVs pick up changes within a minute</span>
            </div>
            {tab === 'design' ? <DesignTab id={id} c={c} update={update} /> : <WelcomeTab c={c} set={set} />}
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">{panel}</div>
            <aside className="flex flex-col gap-2.5 xl:sticky xl:top-[88px]">
              <span className="text-label-sm text-text-sub-600">Live preview · TV home screen</span>
              <TvPreview config={c} frame focus={FOCUS[tab] ?? 'wifi'} />
              <p className="text-paragraph-xs text-text-soft-400">Paired TVs pick up changes within a minute.</p>
              <details className="mt-3 group">
                <summary className="cursor-pointer text-paragraph-sm text-text-soft-400 hover:text-text-sub-600">Delete this property</summary>
                <Btn.Root variant="error" mode="lighter" size="xsmall" className="mt-2"
                  onClick={() => { if (confirm(`Delete ${c.name}? Paired TVs will go back to the pairing screen.`)) api.deleteProperty(id).then(() => { router.push('/app'); router.refresh() }) }}>
                  <Btn.Icon as={RiDeleteBinLine} />Delete {c.name}
                </Btn.Root>
              </details>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function SaveStatus({ status }: { status: string }) {
  if (status === 'saved') return <span className="flex items-center gap-1 text-label-sm text-success-base"><RiCheckLine className="size-4" />Saved</span>
  if (status === 'saving' || status === 'dirty') return <span className="flex items-center gap-1 text-label-sm text-text-sub-600"><RiLoader4Line className="size-4 animate-spin" />Saving…</span>
  return <span className="flex items-center gap-1 text-label-sm text-error-base"><RiErrorWarningLine className="size-4" />{status}</span>
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
  const online = (d: Device) => !!d.last_seen_at && Date.now() - d.last_seen_at < 150_000
  return (
    <>
      <Head title="Pair a Fire TV" hint="Open Stayboard on the TV. It shows a six-letter code until it's paired." />
      <form className="flex flex-wrap gap-2" onSubmit={pair}>
        <Input className="w-[150px] font-mono tracking-[0.25em] uppercase" placeholder="ABC123" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
        <Input className="min-w-[160px] flex-1" placeholder="Which TV" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} />
        <Button size="lg" disabled={code.length !== 6}>Pair</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {devices.length > 0 && (
        <div className="flex flex-col divide-y divide-stroke-soft-200 rounded-xl ring-1 ring-inset ring-stroke-soft-200">
          {devices.map((d) => (
            <div className="flex items-center gap-3 px-4 py-3" key={d.code}>
              <RiTvLine className="size-5 text-text-soft-400" />
              <div className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-label-sm text-text-strong-950">{d.label}</strong>
                <span className="text-paragraph-xs text-text-sub-600">Code {d.code} · last seen {ago(d.last_seen_at)}</span>
              </div>
              <Badge.Root variant="lighter" color={online(d) ? 'green' : 'gray'} size="medium"><Badge.Dot />{online(d) ? 'Online' : 'Offline'}</Badge.Root>
              <Btn.Root variant="error" mode="ghost" size="xxsmall" onClick={() => api.unpair(id, d.code).then((r) => setDevices(r.devices))}>Unpair</Btn.Root>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-stroke-soft-200" />
      <Head title="Guest page" hint="The TV shows this QR code on the Ask screen, so guests can read the guide and ask from their phones." />
      <div className="flex flex-wrap items-center gap-4">
        <Qr text={guestUrl} size={120} />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <a href={guestUrl} target="_blank" rel="noreferrer" className="break-all text-label-sm text-text-strong-950 underline decoration-stroke-sub-300 underline-offset-4">{guestUrl}</a>
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(guestUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}>
            {copied ? <RiCheckLine className="relative z-10 -ml-1 size-4" /> : <RiFileCopyLine className="relative z-10 -ml-1 size-4" />}{copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </div>
    </>
  )
}

function Inbox({ questions, hostName, onRefresh, onReply, onDismiss }: { questions: Question[] | null; hostName: string; onRefresh: () => void; onReply: (q: Question, text: string) => Promise<boolean>; onDismiss: (q: Question) => void }) {
  const focus = useSearchParams().get('q') // set by the "Reply in Stayboard" email link
  const refresh = (
    <Btn.Root variant="neutral" mode="ghost" size="xsmall" onClick={onRefresh}><Btn.Icon as={RiRefreshLine} />Refresh</Btn.Root>
  )
  if (questions === null) return <Head title="Questions guests asked" action={refresh} />
  const open = questions.filter((q) => !q.answered)
  const done = questions.filter((q) => q.answered)
  const meta = (q: Question) => <span className="text-paragraph-xs text-text-soft-400">{q.source === 'tv' ? 'On the TV' : 'From a phone'} · {ago(q.created_at)}</span>
  return (
    <>
      <Head title="Questions guests asked" hint={open.length > 0 ? "The guide couldn't answer these. Your reply goes straight to the guest who asked and is saved as an FAQ for every guest after." : undefined} action={refresh} />
      {questions.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-stroke-sub-300 px-6 py-10 text-center">
          <RiInbox2Line className="size-6 text-text-soft-400" />
          <p className="text-paragraph-sm text-text-sub-600">Nothing yet. Once a guest asks the TV something, it shows up here.</p>
        </div>
      )}
      {open.map((q) => (
        <div className="flex flex-col gap-2 rounded-xl bg-warning-lighter/60 p-4 ring-1 ring-inset ring-warning-light" key={q.id}>
          <div className="flex items-center justify-between gap-2">
            <Badge.Root variant="lighter" color="orange" size="medium">Needs an answer</Badge.Root>
            {meta(q)}
          </div>
          <p className="text-label-md text-text-strong-950">“{q.question}”</p>
          <p className="text-paragraph-sm text-text-sub-600">The TV said: {q.answer}</p>
          <ReplyBox q={q} focus={q.id === focus} onReply={onReply} onDismiss={onDismiss} />
        </div>
      ))}
      {done.length > 0 && <h3 className="mt-2 text-label-md text-text-strong-950">Answered</h3>}
      {done.map((q) => (
        <div className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-inset ring-stroke-soft-200" key={q.id}>
          <div className="flex items-center justify-between gap-2">
            <Badge.Root variant="lighter" color="green" size="medium">{q.reply ? `${hostName || 'You'} replied` : 'From your guide'}</Badge.Root>
            {meta(q)}
          </div>
          <p className="text-label-md text-text-strong-950">“{q.question}”</p>
          <p className="text-paragraph-sm text-text-sub-600">{q.reply ?? q.answer}</p>
          <div><Btn.Root variant="neutral" mode="ghost" size="xxsmall" onClick={() => onDismiss(q)}>Dismiss</Btn.Root></div>
        </div>
      ))}
    </>
  )
}

function ReplyBox({ q, focus, onReply, onDismiss }: { q: Question; focus: boolean; onReply: (q: Question, text: string) => Promise<boolean>; onDismiss: (q: Question) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (focus) { ref.current?.scrollIntoView({ block: 'center' }); ref.current?.focus() }
  }, [focus])
  const send = async () => {
    setBusy(true)
    if (!(await onReply(q, text.trim()))) setBusy(false)
  }
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
      <Textarea ref={ref} rows={2} maxLength={1000} placeholder="Write your answer…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center gap-2">
        <Button size="sm" loading={busy} disabled={!text.trim()}>Send reply</Button>
        <Btn.Root type="button" variant="neutral" mode="ghost" size="xsmall" onClick={() => onDismiss(q)}>Dismiss</Btn.Root>
        <span className="ml-auto hidden text-paragraph-xs text-text-soft-400 sm:inline">The guest sees it, and it’s saved as an FAQ</span>
      </div>
    </form>
  )
}
