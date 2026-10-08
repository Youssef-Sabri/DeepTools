import { notFound } from 'next/navigation'
import Script from 'next/script'
import { Inter, Cairo } from 'next/font/google'
import { getDictionary, hasLocale, isRtl, locales, type Locale } from '@/dictionaries'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
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
      className={`${inter.variable} ${cairo.variable} antialiased`}
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
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <Navbar locale={validLocale} dict={dict} />
            <main id="main-content" className="flex-1 pt-18 md:pt-20">
              {children}
            </main>
            <Footer locale={validLocale} dict={dict} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
