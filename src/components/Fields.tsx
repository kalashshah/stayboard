import type { ReactNode } from 'react'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="muted small">{hint}</span>}
    </div>
  )
}

type TextProps = { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; type?: string }

export const Text = ({ value, onChange, placeholder, maxLength = 200, type = 'text' }: TextProps) => (
  <input className="input" type={type} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
)

export const Area = ({ value, onChange, placeholder, maxLength = 4000, rows = 4 }: TextProps & { rows?: number }) => (
  <textarea className="input" rows={rows} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
)

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
      <button type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onChange(!on)} />
      {label && <span>{label}</span>}
    </label>
  )
}

/** Pill group with one option selected. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

export function Slider({ value, min, max, step = 1, onChange, suffix = '' }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="slider">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="small muted" style={{ minWidth: 44, textAlign: 'right' }}>{value}{suffix}</span>
    </div>
  )
}

/** Editable list of strings: one input per row. */
export function StringList({ items, onChange, placeholder, addLabel = 'Add' }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string; addLabel?: string }) {
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="stack" style={{ gap: 8 }}>
      {items.map((it, i) => (
        <div className="list-row" key={i}>
          <input className="input" value={it} placeholder={placeholder} maxLength={200} onChange={(e) => set(i, e.target.value)} />
          <button type="button" className="btn ghost sm icon" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button type="button" className="btn ghost sm icon" title="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
          <button type="button" className="btn danger sm icon" title="Remove" onClick={() => remove(i)}>×</button>
        </div>
      ))}
      {items.length < 40 && (
        <div>
          <button type="button" className="btn sm" onClick={() => onChange([...items, ''])}>+ {addLabel}</button>
        </div>
      )}
    </div>
  )
}

export type Col<T> = { key: keyof T & string; label: string; kind?: 'text' | 'area'; placeholder?: string; width?: string }

/** Editable list of objects: a card per item with one input per column. */
export function ObjectList<T extends Record<string, string>>({
  items, onChange, cols, blank, addLabel = 'Add', title,
}: { items: T[]; onChange: (v: T[]) => void; cols: Col<T>[]; blank: T; addLabel?: string; title?: (t: T, i: number) => string }) {
  const set = (i: number, k: keyof T, v: string) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <div className="stack">
      {items.map((it, i) => (
        <div className="card item" key={i}>
          <div className="item-head">
            <span className="muted small">{title ? title(it, i) : `#${i + 1}`}</span>
            <span className="row" style={{ gap: 4 }}>
              <button type="button" className="btn ghost sm icon" onClick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</button>
              <button type="button" className="btn ghost sm icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">↓</button>
              <button type="button" className="btn danger sm icon" onClick={() => remove(i)} title="Remove">×</button>
            </span>
          </div>
          <div className="cols">
            {cols.map((c) => (
              <div className="field" key={c.key} style={{ gridColumn: c.kind === 'area' ? '1 / -1' : undefined }}>
                <label>{c.label}</label>
                {c.kind === 'area' ? (
                  <textarea className="input" rows={3} value={it[c.key]} placeholder={c.placeholder} maxLength={4000} onChange={(e) => set(i, c.key, e.target.value)} />
                ) : (
                  <input className="input" value={it[c.key]} placeholder={c.placeholder} maxLength={200} onChange={(e) => set(i, c.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {items.length < 40 && (
        <div>
          <button type="button" className="btn sm" onClick={() => onChange([...items, { ...blank }])}>+ {addLabel}</button>
        </div>
      )}
    </div>
  )
}
