import { useEffect, useState } from 'react'
import { navigate } from '../App'
import { api, ApiError, type PropertySummary } from '../api'

export function Pair({ code: initial }: { code: string }) {
  const [list, setList] = useState<PropertySummary[]>([])
  const [pid, setPid] = useState('')
  const [code, setCode] = useState(initial.toUpperCase())
  const [label, setLabel] = useState('Living room TV')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api.properties().then((r) => {
      setList(r.properties)
      if (r.properties[0]) setPid(r.properties[0].id)
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.pair(pid, code, label)
      navigate(`/app/p/${pid}?tab=devices`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <div className="hero">
        <h1>Pair a TV</h1>
        <p>Open Stayboard on the Fire TV. It shows a six-letter code. Type it here.</p>
      </div>
      {list.length === 0 ? (
        <p className="muted" style={{ marginTop: 20 }}>Create a property first, then come back here.</p>
      ) : (
        <form className="card stack" onSubmit={submit} style={{ marginTop: 20, maxWidth: 480 }}>
          <div className="field">
            <label>Code on the TV</label>
            <input className="input code" value={code} maxLength={6} placeholder="ABC123" autoFocus onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
          </div>
          <div className="field">
            <label>Property</label>
            <select className="input" value={pid} onChange={(e) => setPid(e.target.value)}>
              {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Which TV</label>
            <input className="input" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy || code.length !== 6}>Pair</button>
        </form>
      )}
    </main>
  )
}
