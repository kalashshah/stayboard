import { useEffect, useState } from 'react'
import { navigate } from '../App'
import { ago, api, type PropertySummary } from '../api'

export function Properties() {
  const [list, setList] = useState<PropertySummary[] | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => api.properties().then((r) => setList(r.properties))
  useEffect(() => { load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      const r = await api.createProperty(name.trim())
      navigate(`/app/p/${r.property.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <div className="hero">
        <h1>Your properties</h1>
        <p>Each property has its own screen, guest page and inbox.</p>
      </div>
      <form className="card row" onSubmit={create} style={{ marginTop: 20 }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="New property name, e.g. Ocean View Loft" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" disabled={busy || !name.trim()}>Create</button>
      </form>
      <div className="stack" style={{ marginTop: 20 }}>
        {list === null && <p className="muted">Loading…</p>}
        {list?.length === 0 && <p className="muted">No properties yet. Create one above and you'll be editing in a second.</p>}
        {list?.map((p) => (
          <a key={p.id} className="card prop" href={`/app/p/${p.id}`} onClick={(e) => { e.preventDefault(); navigate(`/app/p/${p.id}`) }}>
            <div>
              <h3>{p.name}</h3>
              <span className="muted small">Edited {ago(p.updated_at)} · {p.devices} TV{p.devices === 1 ? '' : 's'} paired</span>
            </div>
            <div className="row">
              {p.unanswered > 0 && <span className="chip urgent">{p.unanswered} to answer</span>}
              {p.devices === 0 && <span className="chip">Not paired yet</span>}
              <span className="muted">→</span>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
