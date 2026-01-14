import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://pennystockstracker.com'),
  title: {
    default: 'Penny Stocks Tracker - Discover Microcap Opportunities',
    template: '%s | Penny Stocks Tracker'
  },
  description: 'Track penny stocks, discover catalysts, and find microcap opportunities with volume spikes and news analysis.',
  keywords: ['penny stocks', 'microcap', 'stock tracker', 'catalysts', 'volume spikes', 'trading'],
  authors: [{ name: 'Penny Stocks Tracker' }],
  creator: 'Penny Stocks Tracker',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Penny Stocks Tracker - Discover Microcap Opportunities',
    description: 'Track penny stocks, discover catalysts, and find microcap opportunities with volume spikes and news analysis.',
    siteName: 'Penny Stocks Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Penny Stocks Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Penny Stocks Tracker - Discover Microcap Opportunities',
    description: 'Track penny stocks, discover catalysts, and find microcap opportunities with volume spikes and news analysis.',
    creator: '@pennystockstracker',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}