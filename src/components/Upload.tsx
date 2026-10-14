// Drop zone + file picker for one media slot (video, audio or image), with progress and a "use a link" fallback.
import { useRef, useState, type DragEvent } from 'react'
import { api, ApiError, type MediaKind } from '../api'
import { ownMediaFile } from '../design'
import { capturePoster, inferType } from '../media'

const ACCEPT: Record<MediaKind, string> = { video: 'video/mp4,.mp4', audio: 'audio/mpeg,audio/mp4,.mp3,.m4a', image: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp' }
const RULE: Record<MediaKind, string> = { video: 'MP4 up to 40 MB', audio: 'MP3 or M4A up to 10 MB', image: 'JPG, PNG or WebP up to 5 MB' }

export type UploadProps = {
  id: string
  kind: MediaKind
  value: string
  onChange: (url: string, extra?: { poster?: string }) => void
  label?: string
  poster?: string
  compact?: boolean
}

export function Upload({ id, kind, value, onChange, label, poster, compact }: UploadProps) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [link, setLink] = useState(false)
  const [url, setUrl] = useState('')
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  /** Delete files this property uploaded (never links) once nothing references them. */
  const forget = (...urls: (string | undefined)[]) => {
    for (const u of urls) {
      const f = u ? ownMediaFile(u, id) : null
      if (f) api.deleteMedia(id, f).catch(() => {})
    }
  }
  const send = async (file: File) => {
    setError('')
    const type = inferType(file)
    if (!type) return setError(`Pick a file: ${RULE[kind]}.`)
    const previous = [value, poster]
    setProgress(0)
    try {
      const r = await api.upload(id, kind, file, type, file.name, setProgress)
      if (kind === 'video') {
        const b = await capturePoster(file)
        const p = b ? await api.upload(id, 'image', b, 'image/jpeg', 'poster.jpg').catch(() => null) : null
        onChange(r.url, { poster: p?.url ?? '' })
      } else onChange(r.url)
      forget(...previous) // the replacement landed; the old upload is an orphan now
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed')
    } finally {
      setProgress(null)
    }
  }
  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) send(f)
  }
  const useLink = () => {
    const u = url.trim()
    if (!/^https:\/\//.test(u)) return setError('Links must start with https://')
    onChange(u)
    setLink(false)
    setUrl('')
  }

  if (value && progress === null) {
    const name = value.includes('/m/') ? `Uploaded ${kind}` : (() => { try { return new URL(value).hostname } catch { return value } })()
    return (
      <div className={`media-slot ${compact ? 'compact' : ''}`}>
        {kind === 'image' && <img src={value} alt="" />}
        {kind === 'video' && (poster ? <img src={poster} alt="" /> : <video src={value} muted playsInline preload="metadata" />)}
        {kind === 'audio' && <span className="media-audio">♫</span>}
        <div className="media-meta">
          {label && <span className="eyebrow">{label}</span>}
          <span className="small media-name" title={value}>{name}</span>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn ghost sm" onClick={() => input.current?.click()}>Replace</button>
            <button type="button" className="btn danger sm" onClick={() => { onChange('', { poster: '' }); forget(value, poster) }}>Remove</button>
          </div>
          {error && <p className="error small">{error}</p>}
        </div>
        <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send(f) }} />
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <label
        className={`drop ${over ? 'over' : ''} ${compact ? 'compact' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}>
        <input ref={input} type="file" accept={ACCEPT[kind]} hidden disabled={progress !== null} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send(f) }} />
        {progress !== null ? (
          <>
            <span className="drop-title">Uploading {Math.round(progress * 100)}%</span>
            <span className="meter" style={{ width: '60%' }}><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
          </>
        ) : (
          <>
            <span className="drop-title">{label ?? `Add ${kind}`}</span>
            <span className="muted small">Drop a file here or click to choose · {RULE[kind]}</span>
          </>
        )}
      </label>
      {!link ? (
        <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => setLink(true)}>Use a link instead</button>
      ) : (
        <div className="row">
          <input className="input" style={{ flex: 1 }} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && useLink()} />
          <button type="button" className="btn sm" onClick={useLink}>Use</button>
          <button type="button" className="btn ghost sm" onClick={() => setLink(false)}>Cancel</button>
        </div>
      )}
      {error && <p className="error small">{error}</p>}
    </div>
  )
}
