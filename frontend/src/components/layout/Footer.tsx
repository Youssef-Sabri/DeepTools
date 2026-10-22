import Link from 'next/link'
import { Terminal, Shield, Cpu, Sparkles } from 'lucide-react'
import type { Locale, Dictionary } from '@/dictionaries'

interface FooterProps {
  locale: Locale
  dict: Dictionary
}

export default function Footer({ locale, dict }: FooterProps) {

  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
      <div className="container-custom py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center text-[var(--blue-bright)] font-mono font-bold text-xs">
                DT
              </div>
              <span className="text-base font-bold text-[var(--text)]">
                Deep<span className="text-[var(--blue-bright)]">Tools</span>
              </span>
            </div>
            <p className="max-w-sm text-sm text-[var(--muted)] leading-relaxed">
              {dict.footer.theDeveloperMarketplaceForAutomationEngi}
            </p>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm text-[var(--text)] font-semibold mb-4">
              {dict.footer.canonicalCategories}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/products?category=workflow`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[var(--blue-bright)]" />
                  <span>{dict.footer.workflows}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=agentic`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-[var(--purple)]" />
                  <span>{dict.footer.agents}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=script`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3 text-[var(--green)]" />
                  <span>{dict.footer.scripts}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=code`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-[var(--orange)]" />
                  <span>{dict.footer.codeTemplates}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Console */}
          <div>
            <h4 className="text-sm text-[var(--text)] font-semibold mb-4">
              {dict.footer.developerConsole}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/products`} className="hover:text-[var(--text)] transition-colors">
                  {dict.nav.products}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard?tab=upload`} className="hover:text-[var(--text)] transition-colors">
                  {dict.footer.submitTool}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard?tab=purchases`} className="hover:text-[var(--text)] transition-colors">
                  {dict.footer.purchasedTools}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard?tab=sales`} className="hover:text-[var(--text)] transition-colors">
                  {dict.footer.sellerPayouts}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--line)] mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-2)]">
          <div>
            © {new Date().getFullYear()} DeepTools. {dict.footer.allRightsReserved}
          </div>
        </div>
      </div>
    </footer>
  )
}
