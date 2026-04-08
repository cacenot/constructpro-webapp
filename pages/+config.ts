import type { Config } from 'vike/types'
import vikeReact from 'vike-react/config'

export default {
  extends: vikeReact,
  ssr: false, // SPA mode - disable server-side rendering
  prerender: { partial: true }, // Generate static HTML for Firebase Hosting (skip dynamic routes)
} satisfies Config
