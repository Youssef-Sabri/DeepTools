'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  Upload,
  Shield,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronDown,
  Key,
} from 'lucide-react'
import { fetchApi } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { OmnisearchModal } from '@/components/marketplace/OmnisearchModal'
import type { Locale, Dictionary } from '@/dictionaries'

interface NavbarProps {
  locale: Locale
  dict: Dictionary
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAr = locale === 'ar'
  const alternateLocale = locale === 'en' ? 'ar' : 'en'

  const currentPathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
  const alternateUrl = `/${alternateLocale}${currentPathWithoutLocale}`

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [guestSession, setGuestSession] = useState<{ active: boolean; email?: string; purchasesCount?: number } | null>(null)

  useEffect(() => {
    if (user) return

    let isMounted = true
    const checkGuestSession = async () => {
      try {
        const res = await fetchApi<{ success: boolean; data: { active: boolean; email?: string; purchasesCount?: number } }>(
          '/orders/guest/session'
        )
        if (isMounted) {
          if (res?.data?.active) {
            setGuestSession(res.data)
          } else {
            setGuestSession(null)
          }
        }
      } catch {
        if (isMounted) setGuestSession(null)
      }
    }

    checkGuestSession()

    const handleUpdate = () => checkGuestSession()
    window.addEventListener('guest:session_updated', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('guest:session_updated', handleUpdate)
    }
  }, [user])

  const activeGuestSession = user ? null : guestSession

  const isAdmin = user?.role === 'ADMIN'

  return (
    <>
      <nav
        lang={locale}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-250 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-[var(--line)] shadow-xs'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2.5 group"
                onClick={() => setIsOpen(false)}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center group-hover:border-[var(--blue-bright)] transition-colors">
                  <span className="font-mono font-bold text-sm text-[var(--blue-bright)]">DT</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-[var(--text)]">
                    Deep<span className="text-[var(--blue-bright)]">Tools</span>
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-[var(--muted-2)] uppercase">
                    ENGINEERING
                  </span>
                </div>
              </Link>

              {/* Main Desktop Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href={`/${locale}/products`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith(`/${locale}/products`)
                      ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/60'
                  }`}
                >
                  {dict.nav.marketplace}
                </Link>

                <Link
                  href={`/${locale}/dashboard`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith(`/${locale}/dashboard`)
                      ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]/60'
                  }`}
                >
                  {dict.nav.console}
                </Link>

                {isAdmin && (
                  <Link
                    href={`/${locale}/admin`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 text-[var(--orange)] ${
                      pathname.startsWith(`/${locale}/admin`)
                        ? 'bg-[var(--orange)]/10 border border-[var(--orange)]/30'
                        : 'hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{dict.nav.admin2}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Omnisearch Trigger & Right Actions */}
            <div className="flex items-center gap-2.5">
              {/* Omnisearch Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--line-bright)] transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{dict.nav.omnisearch}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[10px] font-mono border border-[var(--line)] text-[var(--muted-2)]">
                  ⌘K
                </kbd>
              </button>

              {/* Language Switcher */}
              <Link
                href={alternateUrl}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                title={dict.nav.switchToArabic}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{dict.nav.switchLanguage}</span>
              </Link>


              {/* Auth Session / Action */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] hover:border-[var(--line-bright)] transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-[var(--blue)]/20 text-[var(--blue-bright)] font-mono text-[10px] flex items-center justify-center font-bold">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span className="font-medium max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-2)]" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div
                        className="absolute end-0 mt-2 w-52 rounded-xl bg-[var(--surface)] border border-[var(--line-bright)] shadow-xl py-1 z-50 text-xs"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="px-3 py-2 border-b border-[var(--line)]">
                          <div className="font-semibold text-[var(--text)]">{user.name}</div>
                          <div className="text-[10px] font-mono text-[var(--muted-2)] truncate">{user.email}</div>
                          <span className="mt-1 inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[var(--blue-bright)] border border-[var(--line)]">
                            {user.role}
                          </span>
                        </div>

                        <Link
                          href={`/${locale}/dashboard?tab=upload`}
                          className="flex items-center gap-2 px-3 py-2 text-[var(--blue-bright)] hover:bg-[var(--surface-2)] transition-colors font-semibold"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{dict.nav.uploadNewTool}</span>
                        </Link>

                        <Link
                          href={`/${locale}/dashboard?tab=purchases`}
                          className="block px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          {dict.nav.myPurchases}
                        </Link>

                        <Link
                          href={`/${locale}/dashboard?tab=uploads`}
                          className="block px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          {dict.nav.myUploads}
                        </Link>

                        <Link
                          href={`/${locale}/dashboard?tab=sales`}
                          className="block px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          {dict.nav.salesPayouts}
                        </Link>

                        <Link
                          href={`/${locale}/dashboard?tab=profile`}
                          className="block px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          {dict.nav.profileSecurity}
                        </Link>

                        <button
                          onClick={logout}
                          className="w-full text-left rtl:text-right px-3 py-2 text-[var(--rose)] hover:bg-[var(--surface-2)] flex items-center gap-2 border-t border-[var(--line)] mt-1 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{dict.nav.signOut}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {activeGuestSession?.active && (
                    <Link
                      href={`/${locale}/guest/purchases`}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--blue-bright)]/40 text-xs font-mono text-[var(--blue-bright)] hover:bg-[var(--blue-bright)]/10 transition-colors shadow-sm"
                      title={activeGuestSession.email}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{dict.nav.guestOrders}</span>
                      {typeof activeGuestSession.purchasesCount === 'number' && activeGuestSession.purchasesCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[var(--blue-bright)] text-black text-[9px] font-bold flex items-center justify-center">
                          {activeGuestSession.purchasesCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    href={`/${locale}/auth/login`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    {dict.nav.login}
                  </Link>
                  <Link
                    href={`/${locale}/auth/register`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors shadow-sm"
                  >
                    {dict.nav.register}
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="md:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                aria-label="Toggle Navigation Menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-b border-[var(--line)] bg-[var(--bg)] px-4 py-4 space-y-2">
            <button
              onClick={() => {
                setIsOpen(false)
                setSearchOpen(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--muted)] mb-3"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>{dict.nav.searchAssetsOmnisearch}</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] text-[10px] font-mono border border-[var(--line)] text-[var(--muted-2)]">
                ⌘K
              </kbd>
            </button>

            <Link
              href={`/${locale}/products`}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              {dict.nav.marketplace2}
            </Link>
            <Link
              href={`/${locale}/dashboard`}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
            >
              {dict.nav.console2}
            </Link>

            {isAdmin && (
              <Link
                href={`/${locale}/admin`}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--orange)] hover:bg-[var(--surface-2)]"
              >
                {dict.nav.admin3}
              </Link>
            )}

            {user ? (
              <div className="pt-3 border-t border-[var(--line)] space-y-1">
                <div className="px-3 py-1 text-xs text-[var(--muted-2)] font-mono">
                  {user.name} ({user.email})
                </div>
                <Link
                  href={`/${locale}/dashboard?tab=upload`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[var(--blue-bright)] hover:bg-[var(--surface-2)]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{dict.nav.submitNewTool}</span>
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=purchases`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {dict.nav.myPurchases2}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=uploads`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {dict.nav.myUploads2}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=sales`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {dict.nav.salesPayouts2}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=profile`}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {dict.nav.profileSecurity2}
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                  className="w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs text-[var(--rose)] hover:bg-[var(--surface-2)] flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{dict.nav.signOut2}</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-[var(--line)] space-y-2">
                {activeGuestSession?.active && (
                  <Link
                    href={`/${locale}/guest/purchases`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono bg-[var(--surface-2)] border border-[var(--blue-bright)]/40 text-[var(--blue-bright)]"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5" />
                      <span>{dict.nav.myGuestPurchases}</span>
                    </div>
                    {typeof activeGuestSession.purchasesCount === 'number' && activeGuestSession.purchasesCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[var(--blue-bright)] text-black text-[9px] font-bold flex items-center justify-center">
                        {activeGuestSession.purchasesCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/auth/login`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)]"
                  >
                    {dict.nav.login}
                  </Link>
                  <Link
                    href={`/${locale}/auth/register`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-[var(--blue)] text-white"
                  >
                    {dict.nav.register}
                  </Link>
                </div>
                {!activeGuestSession?.active && (
                  <Link
                    href={`/${locale}/guest/purchases`}
                    onClick={() => setIsOpen(false)}
                    className="block text-center text-[11px] font-mono text-[var(--muted)] hover:text-[var(--blue-bright)] py-1.5 transition-colors"
                  >
                    {dict.nav.guestPurchasesLookup}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Omnisearch Modal */}
      <OmnisearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        locale={locale}
      />
    </>
  )
}
