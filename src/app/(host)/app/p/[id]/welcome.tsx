'use client'

// The Welcome tab: who is hosting, and the greeting on the TV's home screen.
import type { PropertyConfig } from '@/api'
import { Area, Field, Head, Text } from '@/components/Fields'
import * as Btn from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { choice } from './design'

type Props = { c: PropertyConfig; set: <K extends keyof PropertyConfig>(k: K, v: PropertyConfig[K]) => void }

const TONES: [string, string, string][] = [
  ['Formal', 'We are delighted to welcome you, {guest}', 'It is our pleasure to host you. Everything you need for a comfortable stay, from Wi-Fi to the house guide and our local recommendations, is on this screen.'],
  ['Classic', 'Welcome, {guest}', 'Make yourself at home. Everything you need for your stay is on this screen.'],
  ['Warm', 'Make yourself at home, {guest}', 'We’re so glad you’re here. Wi-Fi, the house guide and our favourite spots nearby are all right here.'],
  ['Concise', 'Good to have you, {guest}', 'Wi-Fi, house rules and local picks, all on this screen.'],
]

export function WelcomeTab({ c, set }: Props) {
  const w = c.welcome
  const sw = (patch: Partial<PropertyConfig['welcome']>) => set('welcome', { ...w, ...patch })
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <Head title="Property" hint="Shown at the top of the TV and used by the concierge when it speaks for you." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property name"><Text value={c.name} maxLength={80} onChange={(v) => set('name', v)} /></Field>
          <Field label="Hosted by"><Text value={c.hostName} maxLength={60} placeholder="The Ramirez family" onChange={(v) => set('hostName', v)} /></Field>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <Head title="Greeting" hint="The first thing guests read when the TV turns on." />
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4" role="radiogroup" aria-label="Tone">
          {TONES.map(([name, headline, message]) => {
            const on = w.headline === headline && w.message === message
            return (
              <button key={name} type="button" role="radio" aria-checked={on} className={choice(on)} onClick={() => sw({ headline, message })}>
                <strong className="text-label-sm text-text-strong-950">{name}</strong>
                <span className="line-clamp-2 text-paragraph-xs text-text-sub-600">{headline.replace('{guest}', 'Sam')}</span>
              </button>
            )
          })}
        </div>
        <Field label="Headline" hint="{guest} becomes the guest's name, and is dropped when no name is set.">
          <Text value={w.headline} maxLength={80} onChange={(v) => sw({ headline: v })} />
        </Field>
        {!w.headline.includes('{guest}') && (
          <div className="-mt-2">
            <Btn.Root variant="neutral" mode="ghost" size="xxsmall" onClick={() => sw({ headline: `${w.headline.trim().replace(/[.!]$/, '')}, {guest}` })}>Add the guest’s name</Btn.Root>
          </div>
        )}
        <Field label="Message" hint={`${w.message.length}/400`}>
          <Area rows={3} value={w.message} maxLength={400} onChange={(v) => sw({ message: v })} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <Head title="This stay" hint="Change it between bookings. Leave it empty for a general welcome." />
        <Field label="Guest name"><Text value={w.guestName} maxLength={60} placeholder="Mr and Mrs Okafor" onChange={(v) => sw({ guestName: v })} /></Field>
      </Card>
    </div>
  )
}
