'use client'

// Landing hero + scroll story: the TV starts small under the headline, zooms to fill the viewport, then walks through the features.
// One scroll listener writes --zoom (0..1) straight to the DOM; React only re-renders when the story step changes.
import { RiArrowRightLine } from '@remixicon/react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { PropertyConfig } from '@/api'
import { TvPreview } from '@/components/Preview'
import { Qr } from '@/components/Qr'
import { FONT_STACK } from '@/design'
import * as Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STORY: [string, string][] = [
  ['Pair it in ten seconds.', 'The TV shows six letters. Type them into your dashboard and it’s connected. No account on the TV, nothing for guests to sign into.'],
  ['A welcome screen the moment the TV turns on.', 'Your guest’s name, your message, check-in and checkout, and tiles for everything they’d otherwise text you about.'],
  ['Wi-Fi without the fridge note.', 'Network and password on the big screen, plus a code their phone can scan to join.'],
  ['Guests ask the TV anything.', '“Where’s the first aid kit?” Answers come only from what you wrote in your house guide, never made up.'],
  ['Or ask from their phone.', 'Scan the code on the TV to read the guide and ask from the couch. No app, no sign-up.'],
  ['What it can’t answer comes to you.', 'If it isn’t in your guide, the TV says so instead of guessing, and the question lands in your inbox right away.'],
  ['Answer once. Every guest after gets it.', 'Your reply shows up on the TV or phone that asked, and is saved as an FAQ so the next stay gets the answer instantly.'],
]
const ZOOM_END = 0.16 // share of the scroll spent zooming in; the rest is split evenly across STORY

export function Story({ config, onSignup, onLogin }: { config: PropertyConfig; onSignup: () => void; onLogin: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(-1)
  useEffect(() => {
    const el = ref.current!
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
      el.style.setProperty('--zoom', Math.min(1, p / ZOOM_END).toFixed(4))
      el.toggleAttribute('data-zoomed', p > 0.02)
      setStep(p < ZOOM_END ? -1 : Math.min(STORY.length - 1, Math.floor(((p - ZOOM_END) / (1 - ZOOM_END)) * STORY.length)))
    }
    const onScroll = () => { raf ||= requestAnimationFrame(update) }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  const on = (...steps: number[]) => ({ 'data-on': steps.includes(step) || undefined })
  const { ssid, password } = config.wifi
  const q = 'Can we check out at 1pm on Sunday?'
  const reply = 'Yes, 1pm is fine on Sundays. Just text me when you leave!'

  return (
    <section ref={ref} id="how" className="story" style={{ height: `${100 + 60 + STORY.length * 70}svh` }}>
      <div className="story-stage">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]" />
        <div aria-hidden className="pointer-events-none absolute top-40 right-0 -z-10 size-[520px] rounded-full bg-orange-500/15 blur-[120px]" />

        <div className="story-hero">
          <Badge.Root variant="lighter" color="orange" size="medium"><Badge.Dot />For Fire TV · built on Vega OS</Badge.Root>
          <h1 className="text-[2.4rem] font-semibold leading-[1.04] tracking-[-0.035em] text-text-strong-950 md:text-[52px] lg:text-[60px]">
            Guests ask the TV. <span className="marker">Your guide answers.</span>
          </h1>
          <p className="max-w-[540px] text-paragraph-md text-text-sub-600 md:text-paragraph-lg">
            Stayboard turns the Fire TV in your rental into a concierge that answers guest questions from your house guide, and sends you
            anything it can’t. Wi-Fi, checkout and local picks are on the big screen too.
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            <Button size="lg" onClick={onSignup}>Create your screen <RiArrowRightLine className="relative z-10 -mr-1 size-4" /></Button>
            <Button size="lg" variant="secondary" onClick={onLogin}>Sign in</Button>
          </div>
        </div>

        <div className="story-captions" aria-live="polite">
          {STORY.map(([t, d], i) => (
            <div key={t} className="story-caption" {...on(i)} aria-hidden={i !== step}>
              <span className="text-label-xs tracking-[0.12em] text-orange-600 uppercase">{String(i + 1).padStart(2, '0')} / {String(STORY.length).padStart(2, '0')}</span>
              <h2 className="text-title-h5 tracking-tight text-text-strong-950 md:text-title-h4">{t}</h2>
              <p className="max-w-[620px] text-paragraph-sm text-text-sub-600 md:text-paragraph-md">{d}</p>
            </div>
          ))}
        </div>

        <div className="story-tv-slot">
          <div className="tvset">
            <div className="tvset-panel">
              <div className="tvset-screen" style={{ '--tvf': FONT_STACK[config.design.font] } as CSSProperties}>
                <TvPreview config={config} focus={step === 2 ? 'wifi' : 'ask'} />
                <div className="tvx tvx-dim" {...on(2, 3, 4, 5, 6)} />

                <Layer cls="tvx-pair" {...on(0)}>
                  <div className="tvx-col">
                    <span className="tvx-brand"><i />Stayboard</span>
                    <b className="tvx-h">Pair this TV</b>
                    <ol className="tvx-steps">
                      {['Open stayboard.app/pair on your phone or laptop', 'Sign in and pick the property', 'Type the six letters below'].map((t, i) => <li key={t}><i>{i + 1}</i>{t}</li>)}
                    </ol>
                    <span className="tvx-code">{[...'K7QZMR'].map((c, i) => <i key={i} style={{ transitionDelay: `${0.15 + i * 0.06}s` }}>{c}</i>)}</span>
                    <span className="tvx-sub"><Dots /> Waiting for the code…</span>
                  </div>
                  <div className="tvx-qrcol">
                    <span className="tvx-qr"><Qr text="https://stayboard.app/pair" /></span>
                    <span className="tvx-eyebrow">Scan to open the pairing page</span>
                  </div>
                </Layer>

                <Layer cls="tvx-page" {...on(2)}>
                  <Chrome name={config.name} title="Wi-Fi" sub="Join from any device" />
                  <div className="tvx-wifi">
                    <div className="tvx-panel">
                      <span className="tvx-eyebrow">Network</span>
                      <b className="tvx-big">{ssid}</b>
                      <hr />
                      <span className="tvx-eyebrow">Password</span>
                      <code className="tvx-pw">{password}</code>
                      <span className="tvx-sub">Capital letters matter. Or skip typing: point your phone’s camera at the code.</span>
                    </div>
                    <div className="tvx-qrcol">
                      <span className="tvx-qr"><Qr text={`WIFI:T:WPA;S:${ssid};P:${password};;`} /></span>
                      <b>Point your camera here</b>
                      <span className="tvx-sub">Your phone joins {ssid} on its own.</span>
                    </div>
                  </div>
                </Layer>

                <Layer cls="tvx-page" {...on(3, 4, 5, 6)}>
                  <Chrome name={config.name} title="Ask the house" sub={step === 6 ? 'Next stay · two weeks later' : `Answers come from ${config.hostName}’s house guide, nothing else`} />
                  <div className="tvx-ask">
                    <div className="tvx-stack">
                      <Convo show={step === 3} q="Where’s the first aid kit?" src={`From ${config.hostName}’s house guide`}>Under the bathroom sink, in the blue box. There are plasters, painkillers and a torch in there too.</Convo>
                      <div className="tvx-convo tvx-idle" data-on={step === 4 || undefined}>
                        <span className="tvx-input"><i>?</i>Type a question, e.g. Is there a hair dryer?</span>
                        <span className="tvx-chips">{['Where do I park?', 'Is there a hair dryer?', 'How does the oven work?'].map((t) => <em key={t}>{t}</em>)}</span>
                      </div>
                      <Convo show={step === 5} q={q} src="Not in the guide yet" miss note={`Sent to ${config.hostName}`}>That isn’t in the house guide yet. I’ve passed your question to {config.hostName}. The reply will show up here.</Convo>
                      <Convo show={step === 6} q={q} src={`From ${config.hostName}’s FAQ`}>{reply}</Convo>
                    </div>
                    <div className="tvx-phonecard" data-hot={step === 4 || undefined}>
                      <span className="tvx-qr sm"><Qr text="https://stayboard.app/g/ocean-view-loft" /></span>
                      <span><b>Prefer your phone?</b><span className="tvx-sub">Scan to read the guide and ask from there.</span></span>
                    </div>
                  </div>
                </Layer>
              </div>
              <span className="tvset-led" />
            </div>
            {(['l', 'r', 't', 'b', 'back'] as const).map((f) => <i key={f} aria-hidden className={`tvset-face ${f}`} />)}
            <Foot side="l" />
            <Foot side="r" />

            <div className="phone" {...on(4, 5, 6)}>
              <span className="phone-tag">{step === 4 ? 'Guest’s phone' : 'Your phone'}</span>
              <div className="phone-body">
                <div className="phone-screen">
                  <span className="phone-island" />
                  <Screen show={step === 4} cls="phone-guest">
                    <b>{config.name}</b>
                    <span className="pq">Is there a hair dryer?</span>
                    <span className="pa">Yes, in the top drawer of the bedroom dresser.</span>
                    <span className="pin">Ask anything…</span>
                  </Screen>
                  <Screen show={step === 5} cls="phone-lock">
                    <span className="pt">9:41</span>
                    <span className="pn"><small><i>✉</i>Mail · now</small><b>New question at {config.name}</b>“{q}”</span>
                  </Screen>
                  <Screen show={step === 6} cls="phone-guest">
                    <b>Inbox</b>
                    <span className="pa">{q}</span>
                    <span className="pq me">{reply}</span>
                    <span className="pok">✓ Sent to guest · Saved as FAQ</span>
                  </Screen>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ol className="story-dots" aria-hidden>{STORY.map((_, i) => <li key={i} data-on={i <= step || undefined} />)}</ol>
      </div>
    </section>
  )
}

const Layer = ({ cls, children, ...rest }: { cls: string; children: ReactNode; 'data-on'?: true }) => <div className={`tvx ${cls}`} {...rest}>{children}</div>
const Screen = ({ show, cls, children }: { show: boolean; cls: string; children: ReactNode }) => <div className={`phone-view ${cls}`} data-on={show || undefined}>{children}</div>
const Dots = () => <span className="tvx-dots"><i /><i /><i /></span>

/** Same header as the Fire TV app's inner screens (tv/src/ui.tsx Chrome). */
const Chrome = ({ name, title, sub }: { name: string; title: string; sub: string }) => (
  <div className="tvx-chrome">
    <span className="tvx-top"><span>{name}</span><span>7:42 PM</span></span>
    <span className="tvx-title">
      <span><span className="tvx-eyebrow">Home › {title}</span><b className="tvx-h">{title}</b><span className="tvx-sub">{sub}</span></span>
      <span className="tvx-back">← Back</span>
    </span>
  </div>
)

/** Question in the box, a beat of "checking the guide", then the answer. */
const Convo = ({ show, q, src, miss, note, children }: { show: boolean; q: string; src: string; miss?: boolean; note?: string; children: ReactNode }) => (
  <div className="tvx-convo" data-on={show || undefined}>
    <span className="tvx-input"><i>?</i><b>{q}</b></span>
    <div className="tvx-answer" data-miss={miss || undefined}>
      <span className="tvx-think"><Dots /> Checking the house guide…</span>
      <span className="tvx-a"><span className="tvx-eyebrow">{src}{note && <em>{note}</em>}</span>{children}</span>
    </div>
  </div>
)

/** Slim inverted-V foot, like current Samsung/LG sets. */
const Foot = ({ side }: { side: 'l' | 'r' }) => (
  <svg className={`tvset-foot ${side}`} viewBox="0 0 120 40" aria-hidden>
    <defs><linearGradient id={`ft-${side}`} x1="0" x2="1"><stop offset="0" stopColor="#2a2b2f" /><stop offset=".5" stopColor="#55575d" /><stop offset="1" stopColor="#1c1d20" /></linearGradient></defs>
    <path d="M54 0h12l54 38v2h-9L60 8 9 40H0v-2z" fill={`url(#ft-${side})`} />
  </svg>
)
