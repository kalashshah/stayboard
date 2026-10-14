import type { Design, Font, IconKey, PropertyConfig, Tile, TileKey } from '../worker/config'
export { backdropFor, headlineFor, ICONS, layoutFor, RADIUS, tileSub, TILE_DEFAULTS, visibleTiles, wifiQr } from '../worker/config'

export type { Design, Font, IconKey, PropertyConfig, Tile, TileKey }
export type Host = { id: string; email: string }
export type PropertySummary = { id: string; slug: string; name: string; updated_at: number; devices: number; unanswered: number }
export type Property = { id: string; slug: string; config: PropertyConfig; updated_at: number }
export type Device = { code: string; label: string | null; paired_at: number | null; last_seen_at: number | null }
export type Question = { id: string; property_id: string; source: 'tv' | 'phone'; question: string; answer: string; answered: number; created_at: number }
export type Answer = { answered: boolean; answer: string }
export type MediaFile = { key: string; url: string; size: number; uploaded: number; contentType: string; name: string; kind: string }
export type MediaKind = 'video' | 'audio' | 'image'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const res = await fetch(`/api${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? 'POST' : 'GET'),
    headers: json !== undefined ? { 'content-type': 'application/json' } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

export const api = {
  me: () => call<{ host: Host }>('/auth/me'),
  signup: (email: string, password: string) => call<{ host: Host }>('/auth/signup', { json: { email, password } }),
  login: (email: string, password: string) => call<{ host: Host }>('/auth/login', { json: { email, password } }),
  logout: () => call('/auth/logout', { method: 'POST' }),
  properties: () => call<{ properties: PropertySummary[] }>('/properties'),
  createProperty: (name: string) => call<{ property: Property }>('/properties', { json: { name } }),
  property: (id: string) => call<{ property: Property; devices: Device[]; guestUrl: string }>(`/properties/${id}`),
  saveConfig: (id: string, config: PropertyConfig) => call<{ updated_at: number }>(`/properties/${id}`, { method: 'PUT', json: { config } }),
  deleteProperty: (id: string) => call(`/properties/${id}`, { method: 'DELETE' }),
  pair: (id: string, code: string, label: string) => call<{ devices: Device[] }>(`/properties/${id}/pair`, { json: { code, label } }),
  unpair: (id: string, code: string) => call<{ devices: Device[] }>(`/properties/${id}/devices/${code}`, { method: 'DELETE' }),
  questions: (id: string) => call<{ questions: Question[] }>(`/properties/${id}/questions`),
  deleteQuestion: (id: string, qid: string) => call(`/properties/${id}/questions/${qid}`, { method: 'DELETE' }),
  media: (id: string) => call<{ files: MediaFile[] }>(`/properties/${id}/media`),
  deleteMedia: (id: string, file: string) => call(`/properties/${id}/media/${file}`, { method: 'DELETE' }),
  /** Raw PUT through XHR so the host sees upload progress. */
  upload: (id: string, kind: MediaKind, file: Blob, type: string, name: string, onProgress?: (p: number) => void) =>
    new Promise<{ key: string; url: string; size: number }>((resolve, reject) => {
      const x = new XMLHttpRequest()
      x.open('PUT', `/api/properties/${id}/media?kind=${kind}&name=${encodeURIComponent(name)}`)
      x.setRequestHeader('content-type', type)
      x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total) }
      x.onload = () => {
        let d: { error?: string; key?: string; url?: string; size?: number } = {}
        try { d = JSON.parse(x.responseText || '{}') } catch { /* non-JSON error body */ }
        if (x.status < 300 && d.url) resolve(d as { key: string; url: string; size: number })
        else reject(new ApiError(x.status, d.error ?? `Upload failed (${x.status})`))
      }
      x.onerror = () => reject(new ApiError(0, 'Upload failed. Check your connection.'))
      x.send(file)
    }),
  guest: (slug: string) => call<{ config: PropertyConfig; updatedAt: number }>(`/g/${slug}`),
  guestAsk: (slug: string, question: string) => call<Answer>(`/g/${slug}/ask`, { json: { question } }),
}

export function ago(ms: number | null) {
  if (!ms) return 'never'
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000))
  if (s < 90) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}
