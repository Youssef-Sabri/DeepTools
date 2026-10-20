import Link from 'next/link'
import { Terminal, Shield, Cpu, Sparkles } from 'lucide-react'
import type { Locale, Dictionary } from '@/dictionaries'

interface FooterProps {
  locale: Locale
  dict: Dictionary
}

export default function Footer({ locale, dict }: FooterProps) {

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] text-xs mt-20">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center text-[var(--blue-bright)] font-mono font-bold text-xs">
                DT
              </div>
              <span className="text-sm font-bold text-[var(--text)]">
                Deep<span className="text-[var(--blue-bright)]">Tools</span>
              </span>
            </div>
            <p className="max-w-md text-[var(--muted-2)] leading-relaxed">
              {dict.footer.theDeveloperMarketplaceForAutomationEngi}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
              <span className="text-[11px] font-mono text-[var(--green)]">
                {dict.footer.systemOperationalLatency14ms}
              </span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[var(--text)] font-semibold mb-3">
              {dict.footer.canonicalCategories}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/products?category=workflow`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[var(--blue-bright)]" />
                  <span>Workflows (n8n, Make)</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=agentic`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-[var(--purple)]" />
                  <span>Autonomous AI Agents</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=script`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3 h-3 text-[var(--green)]" />
                  <span>Automation Scripts</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/products?category=code`}
                  className="hover:text-[var(--text)] transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3 text-[var(--orange)]" />
                  <span>Code Templates</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Console */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[var(--text)] font-semibold mb-3">
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
        <div className="border-t border-[var(--line)] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[var(--muted-2)]">
          <div>
            © {new Date().getFullYear()} DeepTools. {dict.footer.allRightsReserved}
          </div>
          <div className="flex items-center gap-4">
            <span>Integer Cents Pricing Standard ($49.00 = 4900)</span>
            <span>•</span>
            <span>REST API v1</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
