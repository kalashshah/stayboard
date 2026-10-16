import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

// `next dev` runs on Node; this wires the D1/R2 bindings from wrangler.jsonc into it.
initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  // `npm run typecheck` is the type gate (it also covers worker/ and shared/); skip Next's second pass.
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
