import type { MetadataRoute } from 'next'

// Guest pages carry Wi-Fi passwords; keep them out of search.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/g/' } }
}
