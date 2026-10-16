import { createDevice } from '@worker/db'
import { env, json, route } from '@/lib/server'

export const POST = route(async () => json(await createDevice(env())))
