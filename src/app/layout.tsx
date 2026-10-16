import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

// Inter is the UI face and the TV's sans; Fraunces and Space Grotesk are the other two TV fonts the previews render.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600'] })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', weight: ['400', '600'] })
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', weight: ['400', '600'] })

export const metadata: Metadata = {
  title: { default: 'Stayboard', template: '%s · Stayboard' },
  description: "Your rental's welcome screen on the Fire TV. Guests ask the TV; you answer once.",
}

export const viewport: Viewport = { themeColor: '#f7f7f7' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
