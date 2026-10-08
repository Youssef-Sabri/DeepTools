'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sun, Moon, Globe } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import type { Locale } from '@/dictionaries'

interface NavbarProps {
  locale: Locale
  dict: {
    nav: {
      home: string
      about: string
      templates: string
      products: string
      pricing: string
      journal: string
      contact: string
      login: string
      register: string
      getStarted: string
      switchLanguage: string
      dashboard?: string
    }
  }
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  const alternateLocale = locale === 'en' ? 'ar' : 'en'
  const currentPath = pathname.replace(`/${locale}`, '') || '/'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const navLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/products`, label: dict.nav.products },
    { href: `/${locale}/templates`, label: dict.nav.templates },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
    { href: `/${locale}/journal`, label: dict.nav.journal },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === `/${locale}`
    return pathname.startsWith(href)
  }

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-strong shadow-lg' : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-18 md:h-20">
            {/* Logo */}
            <Link href={`/${locale}`} className="flex items-center gap-2 group" aria-label="DeepTools Home">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg">D</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-300" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Deep<span className="gradient-text">Tools</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'text-accent-cyan'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 inset-x-3 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
              {user && (
                <Link
                  href={`/${locale}/dashboard`}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(`/${locale}/dashboard`)
                      ? 'text-accent-cyan'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {dict.nav.dashboard || 'Dashboard'}
                  {isActive(`/${locale}/dashboard`) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 inset-x-3 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )}
              {user && user.role === 'admin' && (
                <Link
                  href={`/${locale}/admin`}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(`/${locale}/admin`)
                      ? 'text-accent-cyan'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Admin Panel
                  {isActive(`/${locale}/admin`) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 inset-x-3 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <Link
                href={`/${alternateLocale}${currentPath}`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors duration-200"
                aria-label={`Switch to ${alternateLocale === 'ar' ? 'Arabic' : 'English'}`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{dict.nav.switchLanguage}</span>
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors duration-200"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: -10, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 10, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-[18px] h-[18px]" />
                    ) : (
                      <Moon className="w-[18px] h-[18px]" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>

              {/* Conditional CTA Button (Desktop) */}
              {user ? (
                <button
                  onClick={logout}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-rose to-red-500 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href={`/${locale}/auth/login`}
                  className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-105"
                >
                  {dict.nav.login}
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors duration-200"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden overflow-hidden glass-strong border-t border-border"
            >
              <div className="container-custom py-4 space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive(link.href)
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.05 }}
                  >
                    <Link
                      href={`/${locale}/dashboard`}
                      className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive(`/${locale}/dashboard`)
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {dict.nav.dashboard || 'Dashboard'}
                    </Link>
                  </motion.div>
                )}
                {user && user.role === 'admin' && (
                  <motion.div
                    initial={{ opacity: 0, x: locale === 'ar' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navLinks.length + 1) * 0.05 }}
                  >
                    <Link
                      href={`/${locale}/admin`}
                      className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive(`/${locale}/admin`)
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      Admin Panel
                    </Link>
                  </motion.div>
                )}
                <div className="pt-3 border-t border-border">
                  {user ? (
                    <button
                      onClick={logout}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-rose to-red-500"
                    >
                      Logout
                    </button>
                  ) : (
                    <Link
                      href={`/${locale}/auth/login`}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet"
                    >
                      {dict.nav.login}
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
