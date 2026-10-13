import AsyncStorage from '@amazon-devices/react-native-async-storage__async-storage'
import type { Answer, PropertyConfig, TvState } from './types'

export const API_BASE = 'https://stayboard.kalashshah47.workers.dev'

const KEY_SECRET = 'stayboard.secret'
const KEY_STATE = 'stayboard.state'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function call<T>(path: string, init: RequestInit & { secret?: string; json?: unknown } = {}): Promise<T> {
  const { secret, json, ...rest } = init
  const headers: Record<string, string> = {}
  if (secret) headers.authorization = `Bearer ${secret}`
  if (json !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...rest,
    method: rest.method ?? (json !== undefined ? 'POST' : 'GET'),
    headers,
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new HttpError(res.status, data.error ?? `Request failed (${res.status})`)
  return data as T
}

export const register = () => call<{ code: string; secret: string }>('/tv/register', { method: 'POST' })
export const getState = (secret: string) => call<TvState>('/tv/config', { secret })
export const askHouse = (secret: string, question: string) => call<Answer>('/tv/ask', { secret, json: { question } })

export const loadSecret = () => AsyncStorage.getItem(KEY_SECRET)
export const saveSecret = (s: string) => AsyncStorage.setItem(KEY_SECRET, s)

export async function loadCachedState(): Promise<TvState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_STATE)
    return raw ? (JSON.parse(raw) as TvState) : null
  } catch {
    return null
  }
}
export const saveCachedState = (s: TvState) => AsyncStorage.setItem(KEY_STATE, JSON.stringify(s)).catch(() => {})
export const clearCachedState = () => AsyncStorage.removeItem(KEY_STATE).catch(() => {})

export const isConfig = (s: TvState | null): s is Extract<TvState, { paired: true }> & { config: PropertyConfig } => !!s && s.paired
