'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Dictionary } from '@/dictionaries'

interface PricingContentProps {
  dict: Dictionary
  locale: string
}

export default function PricingContent({ dict, locale }: PricingContentProps) {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-1/3 end-1/4 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold">{dict.pricing.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{dict.pricing.subtitle}</p>

            {/* Toggle */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dict.pricing.monthly}
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                  annual ? 'bg-accent-cyan' : 'bg-border'
                }`}
                aria-label="Toggle annual billing"
              >
                <motion.div
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                  animate={{ x: annual ? 30 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dict.pricing.annual}
              </span>
              {annual && (
                <span className="px-2.5 py-1 text-xs font-semibold text-accent-emerald bg-accent-emerald/10 rounded-full border border-accent-emerald/20">
                  {dict.pricing.annualDiscount}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {dict.pricing.plans.map((plan, index) => {
              const price = annual
                ? '$' + Math.round(parseInt(plan.price.replace('$', '')) * 0.8)
                : plan.price

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 ${
                    index === 1
                      ? 'bg-card border-accent-cyan/50 shadow-xl shadow-accent-cyan/10 scale-[1.03]'
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
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <motion.span
                      key={price}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl font-bold"
                    >
                      {price}
                    </motion.span>
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
                  <button
                    className={`mt-8 w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      index === 1
                        ? 'text-white bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan hover:scale-105'
                        : 'text-foreground border border-border hover:border-accent-cyan/50 hover:bg-muted/50'
                    }`}
                  >
                    {index === 2 ? dict.pricing.contactSales : dict.pricing.getStarted}
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{dict.pricing.faq.title}</h2>
            <div className="space-y-3">
              {dict.pricing.faq.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-start"
                    aria-expanded={openFaq === index}
                  >
                    <span className="text-sm font-semibold">{item.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ms-4 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFaq === index ? 'auto' : 0,
                      opacity: openFaq === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
