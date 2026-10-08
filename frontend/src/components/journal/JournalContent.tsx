'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, ArrowRight, Tag, Calendar, User, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Dictionary } from '@/dictionaries'

interface JournalContentProps {
  dict: Dictionary
  locale: string
}

export default function JournalContent({ dict, locale }: JournalContentProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = Object.entries(dict.journal.categories)

  const filteredArticles = dict.journal.articles.filter((article) => {
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categoryColors: Record<string, string> = {
    ai: 'bg-accent-violet/10 text-accent-violet border-accent-violet/20',
    postgresql: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    sqlserver: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    automation: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
    tutorials: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
    news: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
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
            <h1 className="text-4xl md:text-5xl font-bold">{dict.journal.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{dict.journal.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={dict.journal.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-12 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeCategory === key
                    ? 'bg-accent-cyan text-white shadow-md shadow-accent-cyan/25'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent-cyan/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col rounded-2xl bg-card border border-border hover-glow overflow-hidden"
              >
                {/* Article Image Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center">
                  <div className="text-4xl font-bold gradient-text opacity-30">
                    {article.title.charAt(0)}
                  </div>
                  <div className="absolute top-4 start-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      categoryColors[article.category] || 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {dict.journal.categories[article.category as keyof typeof dict.journal.categories] || article.category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readTime} {dict.journal.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent-cyan transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {article.author.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{article.author}</span>
                    </div>
                    <span className="text-sm font-medium text-accent-cyan hover:text-accent-violet transition-colors cursor-pointer">
                      {dict.journal.readMore} →
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No articles found matching your criteria.
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="max-w-xl mx-auto text-center">
            <Mail className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">{dict.journal.newsletter.title}</h2>
            <p className="text-muted-foreground mb-8">{dict.journal.newsletter.description}</p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={dict.journal.newsletter.placeholder}
                className="flex-1 px-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300"
              >
                {dict.journal.newsletter.subscribe}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
