import { useEffect, useState } from 'react'
import { api, type Host } from './api'
import { Editor } from './pages/Editor'
import { Guest } from './pages/Guest'
import { Landing } from './pages/Landing'
import { Pair } from './pages/Pair'
import { Properties } from './pages/Properties'

export function navigate(path: string) {
  history.pushState(null, '', path)
  dispatchEvent(new PopStateEvent('popstate'))
}

export function useRoute() {
  const [r, setR] = useState(location.pathname + location.search)
  useEffect(() => {
    const h = () => setR(location.pathname + location.search)
    addEventListener('popstate', h)
    return () => removeEventListener('popstate', h)
  }, [])
  const [path, query = ''] = r.split('?')
  return { path, params: new URLSearchParams(query) }
}

export function App() {
  const { path, params } = useRoute()
  const [host, setHost] = useState<Host | null | undefined>(undefined)

  useEffect(() => {
    if (path.startsWith('/g/')) return
    api.me().then((r) => setHost(r.host)).catch(() => setHost(null))
  }, [path.startsWith('/g/')])

  if (path.startsWith('/g/')) return <Guest slug={path.slice(3).split('/')[0]} />
  if (host === undefined) return null
  if (!host) {
    return (
      <Landing
        onSignedIn={(h) => {
          setHost(h)
          if (path === '/') navigate('/app')
        }}
      />
    )
  }

  const m = path.match(/^\/app\/p\/([^/]+)/)
  const page = m ? <Editor id={m[1]} tab={params.get('tab') ?? 'welcome'} /> : path === '/pair' ? <Pair code={params.get('code') ?? ''} /> : <Properties />

  return (
    <div className={`shell ${m ? 'wide' : ''}`}>
      <header className="top">
        <a className="brand" href="/app" onClick={(e) => { e.preventDefault(); navigate('/app') }}>
          <span className="brand-dot" /> Stayboard
        </a>
        <nav className="nav">
          <a href="/app" className={path === '/app' ? 'on' : ''} onClick={(e) => { e.preventDefault(); navigate('/app') }}>Properties</a>
          <a href="/pair" className={path === '/pair' ? 'on' : ''} onClick={(e) => { e.preventDefault(); navigate('/pair') }}>Pair a TV</a>
        </nav>
        <span className="muted small hide-sm">{host.email}</span>
        <button className="btn sm ghost" onClick={() => api.logout().then(() => { setHost(null); navigate('/') })}>Sign out</button>
      </header>
      {page}
    </div>
  )
}
