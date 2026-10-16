import { deleteQuestion, replyQuestion } from '@worker/db'
import { body, env, json, propertyRoute } from '@/lib/server'

export const DELETE = propertyRoute<{ id: string; qid: string }>(async (p, _req, { qid }) => {
  await deleteQuestion(env(), qid, p.id)
  return json({ ok: true })
})

/** Host answers the question; the guest's TV or phone picks the reply up on its next poll. */
export const POST = propertyRoute<{ id: string; qid: string }>(async (p, req, { qid }) => {
  const { reply } = await body<{ reply: unknown }>(req)
  const r = typeof reply === 'string' ? reply.trim() : ''
  if (!r || r.length > 1000) return json({ error: 'Write a reply between 1 and 1000 characters' }, 400)
  const { meta } = await replyQuestion(env(), qid, p.id, r)
  if (!meta.changes) return json({ error: 'That question is gone' }, 404)
  return json({ ok: true })
})
