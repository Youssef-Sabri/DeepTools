import { notFound } from 'next/navigation'
import Script from 'next/script'
import { Inter, IBM_Plex_Sans_Arabic, JetBrains_Mono } from 'next/font/google'
import { getDictionary, hasLocale, isRtl, locales, type Locale } from '@/dictionaries'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { DictionaryProvider } from '@/components/providers/DictionaryProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(locale)) notFound()

  const validLocale = locale as Locale
  const dict = await getDictionary(validLocale)
  const direction = isRtl(validLocale) ? 'rtl' : 'ltr'

  return (
    <html
      lang={validLocale}
      dir={direction}
      translate="no"
      className={`${inter.variable} ${arabicSans.variable} ${jetbrainsMono.variable} antialiased notranslate`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                } catch(e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <DictionaryProvider dict={dict}>
              <Navbar locale={validLocale} dict={dict} />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer locale={validLocale} dict={dict} />
            </DictionaryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
