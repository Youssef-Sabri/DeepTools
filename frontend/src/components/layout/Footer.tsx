'use client'

import Link from 'next/link'
import {
  MessageCircle,
  Mail,
  ArrowRight,
  Heart,
} from 'lucide-react'
import { GithubIcon, FacebookIcon, LinkedinIcon } from '@/components/icons/SocialIcons'
import type { Locale } from '@/dictionaries'

interface FooterProps {
  locale: Locale
  dict: {
    footer: {
      description: string
      products: { title: string; items: string[] }
      company: { title: string; items: string[] }
      resources: { title: string; items: string[] }
      legal: { title: string; items: string[] }
      newsletter: { title: string; placeholder: string; subscribe: string }
      copyright: string
    }
    nav: {
      about: string
      journal: string
      contact: string
      products: string
      templates: string
    }
  }
}

export default function Footer({ locale, dict }: FooterProps) {
  const productLinks = [
    { href: `/${locale}/products`, label: dict.footer.products.items[0] },
    { href: `/${locale}/products`, label: dict.footer.products.items[1] },
    { href: `/${locale}/products`, label: dict.footer.products.items[2] },
    { href: `/${locale}/templates`, label: dict.footer.products.items[3] },
    { href: `/${locale}/products`, label: dict.footer.products.items[4] },
  ]

  const companyLinks = [
    { href: `/${locale}/about`, label: dict.footer.company.items[0] },
    { href: `/${locale}/journal`, label: dict.footer.company.items[1] },
    { href: `/${locale}/contact`, label: dict.footer.company.items[3] },
  ]

  const resourceLinks = [
    { href: '#', label: dict.footer.resources.items[0] },
    { href: '#', label: dict.footer.resources.items[1] },
    { href: '#', label: dict.footer.resources.items[2] },
    { href: 'https://github.com', label: dict.footer.resources.items[3] },
  ]

  return (
    <footer className="relative border-t border-border bg-card" role="contentinfo">
      {/* Gradient top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />

      <div className="container-custom section-padding">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-foreground">
                Deep<span className="gradient-text">Tools</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {dict.footer.description}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: GithubIcon, href: 'https://github.com', label: 'GitHub' },
                { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
                { icon: LinkedinIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: MessageCircle, href: 'https://wa.me/15551234567', label: 'WhatsApp' },
                { icon: Mail, href: 'mailto:support@deeptools.ai', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {dict.footer.products.title}
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent-cyan transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {dict.footer.company.title}
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-accent-cyan transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {dict.footer.newsletter.title}
            </h3>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input
                  type="email"
                  placeholder={dict.footer.newsletter.placeholder}
                  className="w-full px-4 py-2.5 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all duration-200"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300"
              >
                {dict.footer.newsletter.subscribe}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {dict.footer.copyright}
          </p>
          <div className="flex items-center gap-6">
            {dict.footer.legal.items.map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs text-muted-foreground hover:text-accent-cyan transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
