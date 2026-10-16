'use client'

import { RiCheckLine, RiFileCopyLine, RiSendPlaneFill } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { api, ApiError, type Answer } from '@/api'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}>
      {ok ? <RiCheckLine className="relative z-10 -ml-1 size-4" /> : <RiFileCopyLine className="relative z-10 -ml-1 size-4" />}
      {ok ? 'Copied' : 'Copy password'}
    </Button>
  )
}

type Asked = { id?: string; q: string; answer: string; answered: boolean; reply?: string; at: number }
const WEEK = 7 * 86_400_000
const REPLY_POLL_MS = 30_000
const store = (slug: string) => `stayboard.asked.${slug}`

/** Questions this phone asked, kept on the phone so the host's reply can find its way back. */
function loadAsked(slug: string): Asked[] {
  try {
    const all = JSON.parse(localStorage.getItem(store(slug)) ?? '[]') as Asked[]
    return all.filter((a) => Date.now() - a.at < WEEK)
  } catch {
    return []
  }
}
function saveAsked(slug: string, items: Asked[]) {
  try { localStorage.setItem(store(slug), JSON.stringify(items)) } catch { /* private mode: replies still show while the page is open */ }
}

export function Ask({ slug, hostName, suggested }: { slug: string; hostName: string; suggested: string[] }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [items, setItems] = useState<Asked[]>([])
  const [error, setError] = useState('')
  useEffect(() => setItems(loadAsked(slug)), [slug])
  const update = (fn: (xs: Asked[]) => Asked[]) => setItems((xs) => { const next = fn(xs).slice(0, 10); saveAsked(slug, next); return next })

  // Waiting on the host: check for replies every 30s while the page is open, and whenever the guest comes back to it.
  const waiting = items.filter((a) => a.id && !a.answered && !a.reply).map((a) => a.id!)
  const key = waiting.join(',')
  useEffect(() => {
    if (!key) return
    const check = () => {
      if (document.hidden) return
      api.guestReplies(slug, key.split(',')).then(({ replies }) => {
        if (replies.length) update((xs) => xs.map((a) => ({ ...a, reply: replies.find((r) => r.id === a.id)?.reply ?? a.reply })))
      }, () => {})
    }
    check()
    const t = setInterval(check, REPLY_POLL_MS)
    document.addEventListener('visibilitychange', check)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', check) }
  }, [slug, key])

  const send = async (question: string) => {
    const t = question.trim()
    if (!t) return
    setBusy(true)
    setError('')
    try {
      const r = await api.guestAsk(slug, t)
      update((xs) => [{ id: r.id, q: t, answer: r.answer, answered: r.answered, at: Date.now() }, ...xs])
      setQ('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not ask right now')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card className="flex flex-col gap-3 ring-2 ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-label-lg text-text-strong-950" style={{ fontFamily: 'var(--font)' }}>Ask the house</h2>
        <p className="text-paragraph-sm text-text-sub-600">Anything about the place. Answers come from {hostName}’s house guide, and {hostName} replies here to anything it can’t answer.</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(q) }}>
        <Input placeholder="Is there a hair dryer?" maxLength={300} value={q} onChange={(e) => setQ(e.target.value)} />
        <Button size="lg" loading={busy} disabled={!q.trim()} aria-label="Ask"><RiSendPlaneFill className="relative z-10 size-4" /></Button>
      </form>
      {suggested.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggested.slice(0, 4).map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => send(s)}
              className="rounded-full bg-bg-white-0 px-3 py-1.5 text-label-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50 hover:text-text-strong-950 disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      )}
      {error && <Alert>{error}</Alert>}
      {items.map((a) => (
        <div key={a.id ?? a.at} className="flex flex-col gap-1.5 rounded-xl bg-bg-weak-50 px-3.5 py-3" aria-live="polite">
          <p className="text-paragraph-xs text-text-sub-600">“{a.q}”</p>
          <p className="text-paragraph-sm text-text-strong-950">{a.answer}</p>
          {a.reply ? (
            <div className="mt-1 flex flex-col gap-0.5 border-l-2 border-[var(--accent)] pl-3">
              <span className="text-label-xs text-text-sub-600">{hostName} replied</span>
              <p className="text-paragraph-sm text-text-strong-950">{a.reply}</p>
            </div>
          ) : a.id && !a.answered && (
            <span className="text-paragraph-xs text-text-soft-400">Waiting for {hostName}’s reply. Keep this page open or come back later.</span>
          )}
        </div>
      ))}
    </Card>
  )
}
