// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProviderClient } from '../components/ThemeProviderClient.tsx'
import { AnalyticsClient } from '../components/AnalyticsClient'

export const metadata: Metadata = {
  title: 'Jyoti Bhattarai | Designer + Developer',
  description: 'Senior product designer creating UX design, UI animations, and icon illustrations',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProviderClient>
          {children}
        </ThemeProviderClient>
        <AnalyticsClient />
      </body>
    </html>
  )
}