// Google sign-in: authorization-code flow, email taken from the ID token the token endpoint returns.
export const CALLBACK_PATH = '/api/auth/google/callback'

export function googleAuthUrl(clientId: string, origin: string, state: string) {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.search = new URLSearchParams({
    client_id: clientId, redirect_uri: origin + CALLBACK_PATH, response_type: 'code', scope: 'openid email', state, prompt: 'select_account',
  }).toString()
  return u.toString()
}

/** Email from an ID token payload, only when Google marked it verified. The token came straight from Google over TLS, so no signature check. */
export function idTokenEmail(idToken: string): string | null {
  try {
    const payload = idToken.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const p = JSON.parse(json) as { email?: unknown; email_verified?: unknown }
    return p.email_verified === true && typeof p.email === 'string' ? p.email.trim().toLowerCase() : null
  } catch {
    return null
  }
}

export async function exchangeCode(env: Env, origin: string, code: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: origin + CALLBACK_PATH, grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return null
  const data = (await res.json().catch(() => ({}))) as { id_token?: string }
  return data.id_token ? idTokenEmail(data.id_token) : null
}
