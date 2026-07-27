import type { Metadata } from 'next'
import './globals.css'
import { AnalyticsClient } from '../components/AnalyticsClient'

export const metadata: Metadata = {
  title: 'Jyoti Bhattarai — Designer + Developer',
  description: 'Designer and frontend developer crafting clear digital products. Based in Tulsipur, Nepal.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#0a0e0c' }}>{children}</body>
      <AnalyticsClient />
    </html>
  )
}