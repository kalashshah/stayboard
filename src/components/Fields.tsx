'use client'

import { RiAddLine, RiArrowDownLine, RiArrowUpLine, RiCloseLine } from '@remixicon/react'
import { useId, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import * as CompactButton from '@/components/ui/compact-button'
import { Input } from '@/components/ui/input'
import * as SegmentedControl from '@/components/ui/segmented-control'
import * as SliderUI from '@/components/ui/slider'
import * as Switch from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const swap = <T,>(xs: T[], i: number, j: number) => { const next = [...xs]; [next[i], next[j]] = [next[j], next[i]]; return next }

/** Label + control + hint. A `<label>` around a single control; `group` for rows of several controls (segmented, slider, lists). */
export function Field({ label, hint, children, className, group }: { label: string; hint?: string; children: ReactNode; className?: string; group?: boolean }) {
  const id = useId()
  const cls = cn('flex min-w-0 flex-col gap-1.5', className)
  const body = (
    <>
      <span id={id} className="text-label-sm text-text-strong-950">{label}</span>
      {children}
      {hint && <span className="text-paragraph-xs text-text-sub-600">{hint}</span>}
    </>
  )
  return group ? <div role="group" aria-labelledby={id} className={cls}>{body}</div> : <label className={cls}>{body}</label>
}

/** Card-less group heading inside a panel: title plus one line of help. */
export const Head = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex flex-col gap-0.5">
      <h3 className="text-label-md text-text-strong-950">{title}</h3>
      {hint && <p className="text-paragraph-sm text-text-sub-600">{hint}</p>}
    </div>
    {action}
  </div>
)

type TextProps = { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; type?: string; className?: string }

export const Text = ({ value, onChange, placeholder, maxLength = 200, type = 'text', className }: TextProps) => (
  <Input type={type} value={value} placeholder={placeholder} maxLength={maxLength} className={className} onChange={(e) => onChange(e.target.value)} />
)

export const Area = ({ value, onChange, placeholder, maxLength = 4000, rows = 4 }: TextProps & { rows?: number }) => (
  <Textarea rows={rows} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
)

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2.5">
      <Switch.Root id={id} checked={on} onCheckedChange={onChange} aria-label={label ?? 'Toggle'} />
      {label && <label htmlFor={id} className="text-paragraph-sm text-text-strong-950">{label}</label>}
    </div>
  )
}

/** AlignUI segmented control with one option selected. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <SegmentedControl.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <SegmentedControl.List>
        {options.map(([v, label]) => <SegmentedControl.Trigger key={v} value={v} className="px-2.5">{label}</SegmentedControl.Trigger>)}
      </SegmentedControl.List>
    </SegmentedControl.Root>
  )
}

export function Slider({ value, min, max, step = 1, onChange, suffix = '', label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string; label?: string }) {
  return (
    <div className="flex h-10 items-center gap-3">
      <SliderUI.Root value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)}>
        <SliderUI.Thumb aria-label={label} />
      </SliderUI.Root>
      <span className="min-w-12 text-right text-label-sm tabular-nums text-text-sub-600">{value}{suffix}</span>
    </div>
  )
}

/** ↑ ↓ × for a row in an editable list. */
export function RowActions({ i, n, onMove, onRemove }: { i: number; n: number; onMove: (i: number, d: number) => void; onRemove: (i: number) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <CompactButton.Root variant="ghost" title="Move up" aria-label="Move up" disabled={i === 0} onClick={() => onMove(i, -1)}>
        <CompactButton.Icon as={RiArrowUpLine} />
      </CompactButton.Root>
      <CompactButton.Root variant="ghost" title="Move down" aria-label="Move down" disabled={i === n - 1} onClick={() => onMove(i, 1)}>
        <CompactButton.Icon as={RiArrowDownLine} />
      </CompactButton.Root>
      <CompactButton.Root variant="ghost" title="Remove" aria-label="Remove" className="hover:text-error-base" onClick={() => onRemove(i)}>
        <CompactButton.Icon as={RiCloseLine} />
      </CompactButton.Root>
    </div>
  )
}

const AddButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div>
    <Button type="button" variant="secondary" size="sm" onClick={onClick}><RiAddLine className="-ml-1 size-4" />{label}</Button>
  </div>
)

/** Editable list of strings: one input per row. */
export function StringList({ items, onChange, placeholder, addLabel = 'Add' }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)))
  const move = (i: number, d: number) => { if (i + d >= 0 && i + d < items.length) onChange(swap(items, i, i + d)) }
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div className="flex items-center gap-2" key={i}>
          <Input value={it} placeholder={placeholder} maxLength={200} onChange={(e) => set(i, e.target.value)} />
          <RowActions i={i} n={items.length} onMove={move} onRemove={(r) => onChange(items.filter((_, j) => j !== r))} />
        </div>
      ))}
      {items.length < 40 && <AddButton label={addLabel} onClick={() => onChange([...items, ''])} />}
    </div>
  )
}

export type Col<T> = { key: keyof T & string; label: string; kind?: 'text' | 'area'; placeholder?: string }

/** Editable list of objects: a card per item with one input per column. */
export function ObjectList<T extends Record<string, string>>({
  items, onChange, cols, blank, addLabel = 'Add', title,
}: { items: T[]; onChange: (v: T[]) => void; cols: Col<T>[]; blank: T; addLabel?: string; title?: (t: T, i: number) => string }) {
  const set = (i: number, k: keyof T, v: string) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const move = (i: number, d: number) => { if (i + d >= 0 && i + d < items.length) onChange(swap(items, i, i + d)) }
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div className="flex flex-col gap-3 rounded-xl bg-bg-white-0 p-4 ring-1 ring-inset ring-stroke-soft-200" key={i}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-label-sm text-text-sub-600">{title ? title(it, i) : `#${i + 1}`}</span>
            <RowActions i={i} n={items.length} onMove={move} onRemove={(r) => onChange(items.filter((_, j) => j !== r))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cols.map((c) => (
              <Field key={c.key} label={c.label} className={c.kind === 'area' ? 'sm:col-span-2' : undefined}>
                {c.kind === 'area'
                  ? <Textarea rows={3} value={it[c.key]} placeholder={c.placeholder} maxLength={4000} onChange={(e) => set(i, c.key, e.target.value)} />
                  : <Input value={it[c.key]} placeholder={c.placeholder} maxLength={200} onChange={(e) => set(i, c.key, e.target.value)} />}
              </Field>
            ))}
          </div>
        </div>
      ))}
      {items.length < 40 && <AddButton label={addLabel} onClick={() => onChange([...items, { ...blank }])} />}
    </div>
  )
}
