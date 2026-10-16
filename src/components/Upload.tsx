'use client'

// Drop zone + file picker for one media slot (video, audio or image), with progress and a "use a link" fallback.
import { RiImageLine, RiLink, RiMusic2Line, RiUploadCloud2Line, RiVideoLine } from '@remixicon/react'
import { useRef, useState, type DragEvent } from 'react'
import { api, ApiError, type MediaKind } from '@/api'
import { ownMediaFile } from '@/design'
import { capturePoster, inferType } from '@/media'
import { Alert } from '@/components/ui/alert'
import * as Btn from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import * as FileUpload from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import * as ProgressBar from '@/components/ui/progress-bar'
import { cn } from '@/lib/utils'

const ACCEPT: Record<MediaKind, string> = { video: 'video/mp4,.mp4', audio: 'audio/mpeg,audio/mp4,.mp3,.m4a', image: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp' }
const RULE: Record<MediaKind, string> = { video: 'MP4 up to 40 MB', audio: 'MP3 or M4A up to 10 MB', image: 'JPG, PNG or WebP up to 5 MB' }
const ICON = { video: RiVideoLine, audio: RiMusic2Line, image: RiImageLine }

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
  const picker = <input ref={input} type="file" accept={ACCEPT[kind]} hidden disabled={progress !== null} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) send(f) }} />
  const Icon = ICON[kind]

  if (value && progress === null) {
    const name = value.includes('/m/') ? `Uploaded ${kind}` : (() => { try { return new URL(value).hostname } catch { return value } })()
    const thumb = 'aspect-[16/10] w-full rounded-lg bg-bg-weak-50 object-cover'
    return (
      <div className={cn('grid items-center gap-3.5 rounded-xl bg-bg-white-0 p-2.5 ring-1 ring-inset ring-stroke-soft-200', compact ? 'grid-cols-[84px_1fr]' : 'grid-cols-[132px_1fr]')}>
        {kind === 'image' && <img className={thumb} src={value} alt="" />}
        {kind === 'video' && (poster ? <img className={thumb} src={poster} alt="" /> : <video className={thumb} src={value} muted playsInline preload="metadata" />)}
        {kind === 'audio' && <span className={cn(thumb, 'grid place-items-center bg-bg-strong-950 text-marker')}><RiMusic2Line className="size-7" /></span>}
        <div className="flex min-w-0 flex-col gap-1.5">
          {label && <span className="text-subheading-2xs uppercase text-text-soft-400">{label}</span>}
          <span className="truncate text-label-sm text-text-strong-950" title={value}>{name}</span>
          <div className="flex gap-1.5">
            <Button type="button" variant="secondary" size="xs" onClick={() => input.current?.click()}>Replace</Button>
            <Btn.Root type="button" variant="error" mode="ghost" size="xsmall" onClick={() => { onChange('', { poster: '' }); forget(value, poster) }}>Remove</Btn.Root>
          </div>
          {error && <p className="text-paragraph-xs text-error-base">{error}</p>}
        </div>
        {picker}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <FileUpload.Root
        className={cn(compact ? 'gap-2 p-4' : 'gap-3 p-6', over && 'border-marker bg-marker-soft/40')}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}>
        {picker}
        {progress !== null ? (
          <>
            <span className="text-label-sm text-text-strong-950">Uploading {Math.round(progress * 100)}%</span>
            <ProgressBar.Root value={Math.round(progress * 100)} className="w-3/5" />
          </>
        ) : (
          <>
            {!compact && <FileUpload.Icon as={label ? Icon : RiUploadCloud2Line} />}
            <div className="flex flex-col gap-1">
              <span className="text-label-sm text-text-strong-950">{label ?? `Add ${kind}`}</span>
              <span className="text-paragraph-xs text-text-sub-600">Drop a file or click to choose · {RULE[kind]}</span>
            </div>
            {!compact && <FileUpload.Button>Browse file</FileUpload.Button>}
          </>
        )}
      </FileUpload.Root>
      {!link ? (
        <div>
          <Btn.Root type="button" variant="neutral" mode="ghost" size="xxsmall" onClick={() => setLink(true)}>
            <Btn.Icon as={RiLink} />Use a link instead
          </Btn.Root>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input placeholder="https://…" value={url} autoFocus onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); useLink() } }} />
          <Button type="button" variant="secondary" onClick={useLink}>Use</Button>
          <Btn.Root type="button" variant="neutral" mode="ghost" size="small" onClick={() => setLink(false)}>Cancel</Btn.Root>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  )
}
