import { listProperties } from '@worker/db'
import { currentHost, env } from '@/lib/server'
import { Properties } from './properties'

export default async function PropertiesPage() {
  const host = (await currentHost())! // the layout already sent signed-out visitors away
  return <Properties list={await listProperties(env(), host.id)} />
}
