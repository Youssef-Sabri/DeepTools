'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Loader2 } from 'lucide-react'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

interface TemplatesContentProps {
  dict: Dictionary
  locale: string
}

interface Template {
  id: string
  name: string
  nameAr?: string | null
  displayName?: string
  description: string
  descriptionAr?: string | null
  displayDescription?: string
  category: string
  compatibility: string[]
  version: string
  downloads: number
  price: number
}

export default function TemplatesContent({ dict, locale }: TemplatesContentProps) {
  const [templatesList, setTemplatesList] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await fetchApi(`/templates?lang=${locale}`)
        setTemplatesList(data)
      } catch (err) {
        console.error('Failed to load templates:', err)
      } finally {
        setLoadingTemplates(false)
      }
    }
    loadTemplates()
  }, [locale])

  const handleDownload = async (templateId: string) => {
    setDownloadingId(templateId)
    try {
      const response = await fetchApi(`/templates/${templateId}/download`, {
        method: 'POST',
      })
      
      // Update local download counter
      setTemplatesList((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, downloads: t.downloads + 1 } : t))
      )
      
      alert('Your template is ready! Beginning download...')
      if (response.downloadUrl && response.downloadUrl !== '#') {
        window.open(response.downloadUrl, '_blank')
      }
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredTemplates = templatesList.filter((template) => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold">{dict.templates.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{dict.templates.subtitle}</p>
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
                placeholder={dict.templates.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-12 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {Object.entries(dict.templates.categories).map(([key, label]) => (
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

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col p-6 rounded-2xl bg-card border border-border hover-glow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-accent-violet/10 text-accent-violet">
                        v{template.version}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Download className="w-3.5 h-3.5" />
                        {template.downloads}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-2">
                      {template.displayName || (locale === 'ar' && template.nameAr ? template.nameAr : template.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                      {template.displayDescription || (locale === 'ar' && template.descriptionAr ? template.descriptionAr : template.description)}
                    </p>

                    {/* Compatibility Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.compatibility.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className={`text-lg font-bold ${template.price === 0 ? 'text-accent-emerald' : 'gradient-text'}`}>
                        {template.price === 0 ? 'Free' : `$${(template.price / 100).toFixed(2)}`}
                      </span>
                      <button
                        onClick={() => handleDownload(template.id)}
                        disabled={downloadingId === template.id}
                        className="text-sm font-medium text-accent-cyan hover:text-accent-violet transition-colors disabled:opacity-50"
                      >
                        {downloadingId === template.id ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : template.price === 0 ? (
                          dict.templates.download
                        ) : (
                          dict.templates.purchase
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loadingTemplates && filteredTemplates.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No templates found matching your criteria.</div>
          )}
        </div>
      </section>
    </>
  )
}
