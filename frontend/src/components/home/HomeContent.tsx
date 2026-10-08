'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Bot,
  Database,
  Workflow,
  Building2,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Star,
  Download,
  Clock,
  Headphones,
  Sparkles,
  Zap,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

const featureIcons = [Bot, Database, Workflow, Building2, BarChart3, ShieldCheck]

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

interface HomeContentProps {
  dict: Dictionary
  locale: string
}

export default function HomeContent({ dict, locale }: HomeContentProps) {
  const [productsList, setProductsList] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchApi(`/products?lang=${locale}`)
        setProductsList(data)
      } catch (err) {
        console.error('Failed to load products for home:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [locale])

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-accent-violet/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <div className="container-custom relative z-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-accent-cyan border border-accent-cyan/30 rounded-full bg-accent-cyan/5"
            >
              <Sparkles className="w-4 h-4" />
              {dict.hero.badge}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
            >
              {dict.hero.title}{' '}
              <span className="gradient-text">{dict.hero.titleHighlight}</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {dict.hero.description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href={`/${locale}/products`}
                className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-105"
              >
                {dict.hero.cta}
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-foreground rounded-xl border border-border hover:border-accent-cyan/50 hover:bg-muted/50 transition-all duration-300"
              >
                {dict.hero.ctaSecondary}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {[
                { value: dict.hero.stats.products, label: dict.hero.stats.productsLabel, icon: Zap },
                { value: dict.hero.stats.users, label: dict.hero.stats.usersLabel, icon: Download },
                { value: dict.hero.stats.uptime, label: dict.hero.stats.uptimeLabel, icon: Clock },
                { value: dict.hero.stats.support, label: dict.hero.stats.supportLabel, icon: Headphones },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="text-3xl md:text-4xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <AnimatedSection>
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">{dict.features.title}</h2>
              <p className="mt-4 text-muted-foreground text-lg">{dict.features.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dict.features.items.map((feature, index) => {
                const Icon = featureIcons[index]
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative p-6 rounded-2xl bg-card border border-border hover-glow cursor-default"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ===== PRODUCTS PREVIEW ===== */}
      <AnimatedSection>
        <section className="section-padding">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">{dict.products.title}</h2>
                <p className="mt-3 text-muted-foreground text-lg">{dict.products.subtitle}</p>
              </div>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 text-accent-cyan hover:text-accent-violet transition-colors font-medium"
              >
                {dict.products.viewAll}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {loadingProducts ? (
                <div className="col-span-full flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
                </div>
              ) : (
                productsList.slice(0, 6).map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative flex flex-col p-6 rounded-2xl bg-card border border-border hover-glow"
                  >
                    {(product.displayBadge || (locale === 'ar' && product.badgeAr ? product.badgeAr : product.badge)) && (
                      <span className="absolute top-4 end-4 px-3 py-1 text-xs font-semibold rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {product.displayBadge || (locale === 'ar' && product.badgeAr ? product.badgeAr : product.badge)}
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center mb-4">
                      <Database className="w-5 h-5 text-accent-cyan" />
                    </div>
                    <span className="text-xs font-medium text-accent-violet mb-2">
                      {dict.products.categories[product.category as keyof typeof dict.products.categories] || product.category}
                    </span>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {product.displayName || (locale === 'ar' && product.nameAr ? product.nameAr : product.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {product.displayDescription || (locale === 'ar' && product.descriptionAr ? product.descriptionAr : product.description)}
                    </p>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-lg font-bold gradient-text">
                        ${(product.price / 100).toFixed(2)}/mo
                      </span>
                      <Link
                        href={`/${locale}/products`}
                        className="text-sm font-medium text-accent-cyan hover:text-accent-violet transition-colors"
                      >
                        {dict.products.learnMore} →
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ===== PRICING PREVIEW ===== */}
      <AnimatedSection>
        <section className="section-padding bg-muted/30">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">{dict.pricing.title}</h2>
              <p className="mt-4 text-muted-foreground text-lg">{dict.pricing.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {dict.pricing.plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                    index === 1
                      ? 'bg-card border-accent-cyan/50 shadow-lg shadow-accent-cyan/10 scale-[1.02]'
                      : 'bg-card border-border hover:border-accent-cyan/30'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span className="px-4 py-1.5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet">
                        {dict.pricing.popular}
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/${locale}/pricing`}
                    className={`mt-8 w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      index === 1
                        ? 'text-white bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan hover:scale-105'
                        : 'text-foreground border border-border hover:border-accent-cyan/50 hover:bg-muted/50'
                    }`}
                  >
                    {index === 2 ? dict.pricing.contactSales : dict.pricing.getStarted}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ===== TESTIMONIALS ===== */}
      <AnimatedSection>
        <section className="section-padding">
          <div className="container-custom">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">{dict.testimonials.title}</h2>
              <p className="mt-4 text-muted-foreground text-lg">{dict.testimonials.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dict.testimonials.items.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative p-8 rounded-2xl bg-card border border-border hover-glow"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-accent-amber fill-accent-amber" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ===== CTA SECTION ===== */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 via-accent-violet/10 to-accent-cyan/10" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet to-transparent" />

        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {dict.cta.title}
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                {dict.cta.description}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/${locale}/pricing`}
                  className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-105"
                >
                  {dict.cta.button}
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-foreground rounded-xl border border-border hover:border-accent-cyan/50 hover:bg-card/50 transition-all duration-300"
                >
                  {dict.cta.buttonSecondary}
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
