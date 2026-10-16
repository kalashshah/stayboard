import { deviceBySecret } from '@worker/db'
import { env } from './server'

/** The TV calling with `Authorization: Bearer <device secret>`, or null. */
export function tvDevice(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return secret ? deviceBySecret(env(), secret) : null
}
