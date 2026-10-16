import { listQuestions } from '@worker/db'
import { env, json, propertyRoute } from '@/lib/server'

export const GET = propertyRoute(async (p) => json({ questions: await listQuestions(env(), p.id) }))
