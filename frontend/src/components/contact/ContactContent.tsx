'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react'
import { GithubIcon, FacebookIcon, LinkedinIcon } from '@/components/icons/SocialIcons'
import type { Dictionary } from '@/dictionaries'

interface ContactContentProps {
  dict: Dictionary
  locale: string
}

export default function ContactContent({ dict, locale }: ContactContentProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold">{dict.contact.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{dict.contact.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: locale === 'ar' ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">{dict.contact.form.name}</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{dict.contact.form.email}</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{dict.contact.form.subject}</label>
                  <input
                    type="text"
                    required
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{dict.contact.form.message}</label>
                  <textarea
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-105"
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {dict.contact.form.success}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {dict.contact.form.submit}
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: locale === 'ar' ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold mb-6">{dict.contact.info.title}</h3>
                <div className="space-y-5">
                  {[
                    { icon: Mail, label: dict.contact.info.email, href: `mailto:${dict.contact.info.email}` },
                    { icon: MessageCircle, label: dict.contact.info.whatsapp, href: 'https://wa.me/15551234567' },
                    { icon: MapPin, label: dict.contact.info.address, href: '#' },
                  ].map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent-cyan/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-accent-cyan" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{dict.contact.social.title}</h3>
                <div className="flex gap-3">
                  {[
                    { icon: GithubIcon, href: 'https://github.com', label: 'GitHub' },
                    { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
                    { icon: LinkedinIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
                    { icon: MessageCircle, href: 'https://wa.me/15551234567', label: 'WhatsApp' },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-accent-cyan hover:border-accent-cyan/30 transition-all"
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{dict.contact.faq.title}</h2>
            <div className="space-y-3">
              {dict.contact.faq.items.map((item, index) => (
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

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/15551234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 end-6 z-50 w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        aria-label="Contact via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </>
  )
}
