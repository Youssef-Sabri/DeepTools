'use client'

import { motion } from 'framer-motion'
import {
  Target,
  Eye,
  BookOpen,
  Users,
  Award,
  Shield,
  Clock,
  Globe,
  Cpu,
  Code2,
  Server,
  Cloud,
} from 'lucide-react'
import type { Dictionary } from '@/dictionaries'

interface AboutContentProps {
  dict: Dictionary
  locale: string
}

export default function AboutContent({ dict, locale }: AboutContentProps) {
  const whyChooseIcons = [Users, Shield, Code2, Clock]
  const industryIcons = [Target, Award, Globe, Cpu, Server, Cloud, BookOpen, Eye]

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-1/3 start-1/4 w-80 h-80 bg-accent-violet/10 rounded-full blur-3xl" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              {dict.about.title}
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">{dict.about.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">{dict.about.story.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">{dict.about.story.content}</p>
              <p className="text-muted-foreground leading-relaxed text-lg">{dict.about.story.content2}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[dict.about.mission, dict.about.vision].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-8 rounded-2xl bg-card border border-border hover-glow"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center mb-4">
                  {i === 0 ? (
                    <Target className="w-6 h-6 text-accent-cyan" />
                  ) : (
                    <Eye className="w-6 h-6 text-accent-violet" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{dict.about.expertise.title}</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {dict.about.expertise.items.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-5 py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:border-accent-cyan/50 hover:bg-accent-cyan/5 transition-all duration-200 cursor-default"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{dict.about.whyChooseUs.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {dict.about.whyChooseUs.items.map((item, i) => {
              const Icon = whyChooseIcons[i]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 p-6 rounded-2xl bg-card border border-border hover-glow"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{dict.about.industries.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {dict.about.industries.items.map((industry, i) => {
              const Icon = industryIcons[i % industryIcons.length]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-accent-cyan/30 transition-all duration-200 cursor-default"
                >
                  <Icon className="w-8 h-8 text-accent-cyan" />
                  <span className="text-sm font-medium text-center">{industry}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
