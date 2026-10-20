'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2 } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Notification, Role } from '@/lib/types'
import type { Locale } from '@/dictionaries'

type NotificationList = { items: Notification[]; unreadCount: number }

const copy = {
  en: { title: 'Notifications', empty: 'No notifications yet', unread: 'unread notifications', read: 'Mark as read', loading: 'Loading notifications', error: 'Could not load notifications' },
  ar: { title: 'الإشعارات', empty: 'لا توجد إشعارات بعد', unread: 'إشعارات غير مقروءة', read: 'تحديد كمقروء', loading: 'جار تحميل الإشعارات', error: 'تعذر تحميل الإشعارات' },
}

export function NotificationBell({ userId, role, locale }: { userId: string; role: Role; locale: Locale }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const labels = copy[locale]

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const result = await fetchApi<NotificationList>('/notifications?limit=50')
        if (active) {
          setItems(result.items)
          setUnreadCount(result.unreadCount)
          setError(false)
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    const stream = new EventSource('/api/v1/notifications/stream')
    stream.addEventListener('notification', () => { void load() })
    stream.addEventListener('sync', () => { void load() })
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      stream.close()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  const select = async (item: Notification) => {
    if (!item.isRead) {
      try {
        await fetchApi(`/notifications/${encodeURIComponent(item.id)}/read`, { method: 'PATCH' })
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry))
        setUnreadCount((current) => Math.max(0, current - 1))
      } catch {
        setError(true)
        return
      }
    }
    setOpen(false)
    if (item.type === 'UPLOAD' && role === 'ADMIN') router.push(`/${locale}/admin`)
    else if (item.productId) router.push(`/${locale}/dashboard?tab=uploads`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${labels.title}: ${unreadCount} ${labels.unread}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] transition-colors hover:border-[var(--line-bright)] hover:text-[var(--text)]"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -end-1 -top-1 min-w-4 rounded-full bg-[var(--blue)] px-1 text-center text-[10px] font-semibold leading-4 text-white tabular-nums">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <>
        <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label={labels.title} onClick={() => setOpen(false)} />
        <section role="dialog" aria-label={labels.title} className="absolute end-0 z-50 mt-2 w-[min(22rem,92vw)] overflow-hidden rounded-xl border border-[var(--line-bright)] bg-[var(--surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--text)]">{labels.title}</h2>
            {unreadCount > 0 && <span className="rounded-full bg-[var(--blue)]/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--blue-bright)]">{unreadCount}</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? <div className="flex items-center gap-2 px-4 py-8 text-xs text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" />{labels.loading}</div> :
              items.length === 0 ? <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">{labels.empty}</p> :
                items.map((item) => <button key={item.id} type="button" onClick={() => { void select(item) }} className={`flex w-full gap-3 border-b border-[var(--line)] px-4 py-3 text-start transition-colors last:border-0 hover:bg-[var(--surface-2)] ${item.isRead ? '' : 'bg-[var(--blue)]/5'}`} aria-label={`${locale === 'ar' ? item.titleAr : item.title}. ${item.isRead ? '' : labels.read}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-[var(--line-bright)]' : 'bg-[var(--blue-bright)]'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[var(--text)]">{locale === 'ar' ? item.titleAr : item.title}</span>
                    <span className="mt-1 block break-words text-xs leading-5 text-[var(--muted)]">{locale === 'ar' ? item.messageAr : item.message}</span>
                    <span className="mt-1 block text-[10px] text-[var(--muted-2)]">{formatDate(item.createdAt, locale)}</span>
                  </span>
                  {!item.isRead && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--blue-bright)]" aria-hidden="true" />}
                </button>)}
          </div>
          {error && <p role="alert" className="border-t border-[var(--line)] px-4 py-2 text-xs text-[var(--rose)]">{labels.error}</p>}
        </section>
      </>}
    </div>
  )
}
