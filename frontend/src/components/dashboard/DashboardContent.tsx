'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CreditCard,
  Download,
  Key,
  Heart,
  ShoppingBag,
  Settings,
  User,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

interface DashboardContentProps {
  dict: Dictionary
  locale: string
}

interface License {
  id: string
  licenseKey: string
  isActive: boolean
  expiresAt: string
  createdAt: string
  productName: string
  downloadUrl?: string | null
}

const sidebarItems = [
  { key: 'overview', icon: LayoutDashboard },
  { key: 'subscriptions', icon: CreditCard },
  { key: 'downloads', icon: Download },
  { key: 'licenses', icon: Key },
  { key: 'favorites', icon: Heart },
  { key: 'orders', icon: ShoppingBag },
  { key: 'settings', icon: Settings },
]

export default function DashboardContent({ dict, locale }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [licensesList, setLicensesList] = useState<License[]>([])
  const [loadingLicenses, setLoadingLicenses] = useState(false)

  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth/login`)
    }
  }, [user, loading, router, locale])

  useEffect(() => {
    async function loadLicenses() {
      if (!user) return
      setLoadingLicenses(true)
      try {
        const data = await fetchApi('/products/my/licenses')
        setLicensesList(data)
      } catch (err) {
        console.error('Failed to fetch licenses:', err)
      } finally {
        setLoadingLicenses(false)
      }
    }
    if (user) {
      loadLicenses()
    }
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: dict.dashboard.stats.activeSubscription, value: user.role === 'admin' ? 'Enterprise/Admin' : 'Professional', icon: CreditCard, color: 'text-accent-cyan' },
    { label: dict.dashboard.stats.totalDownloads, value: '12', icon: Download, color: 'text-accent-violet' },
    { label: dict.dashboard.stats.activeLicenses, value: licensesList.length.toString(), icon: Key, color: 'text-accent-emerald' },
    { label: dict.dashboard.stats.savedItems, value: '4', icon: Heart, color: 'text-accent-rose' },
  ]

  return (
    <section className="min-h-[80vh]">
      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="p-4 rounded-2xl bg-card border border-border">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold truncate max-w-[120px]">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</div>
                </div>
              </div>

              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const label = dict.dashboard[item.key as keyof typeof dict.dashboard]
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.key
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {typeof label === 'string' ? label : item.key}
                    </button>
                  )
                })}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-accent-rose hover:bg-accent-rose/10 transition-all duration-200 mt-4"
                >
                  Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="text-2xl font-bold">{dict.dashboard.welcome}, {user.name}! 👋</h1>
              <p className="text-muted-foreground mt-1">{dict.dashboard.overview}</p>
            </motion.div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-5 rounded-xl bg-card border border-border hover-glow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Recent Activity */}
                <div className="rounded-xl bg-card border border-border p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent-cyan" />
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {[
                      { action: 'Dashboard logged in successfully', time: 'Just now', icon: User },
                      { action: 'Updated subscription to Professional', time: '1 day ago', icon: CreditCard },
                      { action: 'Activated license for DBGuard Monitor', time: '3 days ago', icon: Key },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-accent-cyan" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.action}</div>
                            <div className="text-xs text-muted-foreground">{item.time}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Licenses Tab */}
            {activeTab === 'licenses' && (
              <div className="rounded-xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5 text-accent-cyan" />
                  Your Active Product Licenses
                </h2>
                {loadingLicenses ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
                  </div>
                ) : licensesList.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    You do not own any product licenses yet. Purchases will appear here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-muted-foreground">
                      <thead className="text-xs uppercase text-foreground bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-start">Product</th>
                          <th className="px-6 py-3 text-start">License Key</th>
                          <th className="px-6 py-3 text-start">Status</th>
                          <th className="px-6 py-3 text-start">Expires At</th>
                          <th className="px-6 py-3 text-start">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {licensesList.map((license) => (
                          <tr key={license.id} className="border-b border-border hover:bg-muted/20">
                            <td className="px-6 py-4 font-semibold text-foreground">{license.productName}</td>
                            <td className="px-6 py-4 font-mono select-all text-xs">{license.licenseKey}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 text-xs rounded-full ${
                                license.isActive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'
                              }`}>
                                {license.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {new Date(license.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {license.downloadUrl && license.downloadUrl !== '#' ? (
                                <a
                                  href={license.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan font-semibold transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">No link provided</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}
