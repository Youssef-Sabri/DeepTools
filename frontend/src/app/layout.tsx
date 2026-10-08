import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | DeepTools',
    default: 'DeepTools — Advanced Digital Products & Intelligent Tools',
  },
  description: 'DeepTools — Advanced Digital Products & Intelligent Tools. Next-generation digital solutions, workflow automation, and intelligent AI tools for modern professionals.',
  keywords: ['DeepTools', 'digital products', 'intelligent tools', 'AI agents', 'automation', 'productivity', 'data tools'],
  authors: [{ name: 'DeepTools' }],
  creator: 'DeepTools',
  metadataBase: new URL('https://deeptools.ai'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    siteName: 'DeepTools',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@deeptools',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
