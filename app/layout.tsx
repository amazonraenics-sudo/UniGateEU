import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import QueryProvider from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

const APP_URL = 'https://www.unigateu.com'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'UniGateEU — Study in Europe as an International Student',
    template: '%s | UniGateEU',
  },
  description:
    'UniGateEU helps international students find European universities, write their Statement of Purpose, discover scholarships, and navigate student visas — all in one place. Start free.',
  keywords: [
    'study in Europe',
    'European university admissions',
    'international student Europe',
    'study abroad Europe',
    'EU student visa guide',
    'DAAD scholarship',
    'Erasmus scholarship',
    'how to apply to European universities',
    'statement of purpose generator',
    'study in Germany',
    'study in Netherlands',
    'study in France',
    'university matching tool',
    'European student visa requirements',
    'UniGateEU',
  ],
  authors: [{ name: 'UniGateEU' }],
  creator: 'UniGateEU',
  publisher: 'UniGateEU',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'UniGateEU',
    title: 'UniGateEU — Study in Europe as an International Student',
    description:
      'Find your best-fit European universities, write a winning SOP, discover scholarships, and navigate your student visa. 10 free credits on signup.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UniGateEU — Your gateway to European universities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniGateEU — Study in Europe as an International Student',
    description:
      'Find European universities, write your SOP, discover scholarships, and navigate your student visa — all in one place. Start free.',
    images: ['/og-image.png'],
    creator: '@UniGateEU',
    site: '@UniGateEU',
  },
  alternates: {
    canonical: APP_URL,
  },
  category: 'education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
