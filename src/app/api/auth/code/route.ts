import { today } from '@worker/ask'
import { issueLoginCode, takeBudget } from '@worker/db'
import { body, env, json, route } from '@/lib/server'

const PER_EMAIL_DAILY = 10
const ALL_DAILY = 500 // ponytail: global cap, not per IP; add a per-IP limit if someone sprays addresses

/** Email a six-digit sign-in code. The same flow signs up new hosts and signs in returning ones. */
export const POST = route(async (req) => {
  const { email } = await body<{ email: string }>(req)
  const e = (email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return json({ error: 'Enter a valid email' }, 400)
  if (!(await takeBudget(env(), `${today()}:code:${e}`, PER_EMAIL_DAILY)) || !(await takeBudget(env(), `${today()}:code`, ALL_DAILY)))
    return json({ error: 'Too many codes today. Try again tomorrow or continue with Google.' }, 429)
  const code = await issueLoginCode(env(), e)
  if (!code) return json({ error: 'A code was just sent. Wait a minute before asking for another.' }, 429)
  await env().EMAIL.send({
    to: e,
    from: { email: 'stayboard@mail.keronlabs.com', name: 'Stayboard' },
    subject: `${code} is your Stayboard code`,
    text: `Your Stayboard sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
    html: `<p>Your Stayboard sign-in code:</p><p style="margin:16px 0;font:600 32px/1 ui-monospace,Menlo,monospace;letter-spacing:6px">${code}</p><p style="color:#6b6b6b">It expires in 10 minutes. If you didn't ask for it, you can ignore this email.</p>`,
  })
  return json({ sent: true })
})
