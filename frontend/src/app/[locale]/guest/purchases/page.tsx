import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/dictionaries'
import GuestPurchasesContent from '@/components/guest/GuestPurchasesContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'مشتريات الزائر | DeepTools' : 'Guest Purchases & Downloads | DeepTools',
    description: isAr
      ? 'الوصول الآمن وتنزيل الأصول الرقمية المشتراة كزائر عبر DeepTools.'
      : 'Securely access and download your purchased digital assets via DeepTools.',
  }
}

export default async function GuestPurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] border-t-[var(--accent-blue)] animate-spin" />
            <p className="font-mono text-xs text-[var(--fg-muted)]">Loading guest purchases...</p>
          </div>
        </div>
      }
    >
      <GuestPurchasesContent locale={locale} />
    </Suspense>
  )
}
