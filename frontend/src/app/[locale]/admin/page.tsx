'use client'

import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Users,
  CheckCircle,
  Percent,
  TrendingUp,
  Search,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { fetchApi } from '@/lib/api'
import type { Product, User, MarketplaceInsights, UserInsights } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getFileExtensionPill } from '@/lib/utils'

type AdminTab = 'uploads' | 'users' | 'commission' | 'insights'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<AdminTab>('uploads')
  const [refreshCount, setRefreshCount] = useState(0)

  // Tab 1: Moderation Queue (F-B5)
  const [uploads, setUploads] = useState<Product[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const [rejectModalProduct, setRejectModalProduct] = useState<Product | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Tab 2: Users Management (F-A5)
  const [usersList, setUsersList] = useState<User[]>([])
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL')
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Tab 3: Commission Controller (F-B6)
  const [commissionPercent, setCommissionPercent] = useState<number>(15)
  const [savingCommission, setSavingCommission] = useState(false)
  const [commissionSuccessMsg, setCommissionSuccessMsg] = useState(false)

  // Tab 4: Marketplace Insights (F-B7)
  const [insights, setInsights] = useState<MarketplaceInsights | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(true)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return
    let ignore = false

    async function fetchTabData() {
      if (activeTab === 'uploads') {
        try {
          const data = await fetchApi<{ items?: Product[]; uploads?: Product[] } | Product[]>('/admin/uploads')
          if (!ignore) {
            if (Array.isArray(data)) setUploads(data)
            else if (data && Array.isArray(data.items)) setUploads(data.items)
            else if (data && Array.isArray(data.uploads)) setUploads(data.uploads)
            else setUploads([])
            setLoadingUploads(false)
          }
        } catch (err) {
          console.error(err)
          if (!ignore) setLoadingUploads(false)
        }
      } else if (activeTab === 'users') {
        try {
          const queryParams = new URLSearchParams()
          queryParams.set('page', '1')
          queryParams.set('limit', '25')
          if (userSearch) queryParams.set('search', userSearch)
          if (roleFilter !== 'ALL') queryParams.set('role', roleFilter)

          const [usersData, insightsData] = await Promise.all([
            fetchApi<{ users?: User[]; total?: number } | User[]>(`/admin/users?${queryParams.toString()}`),
            fetchApi<UserInsights>('/admin/insights/users').catch(() => null),
          ])

          if (!ignore) {
            setUsersList(Array.isArray(usersData) ? usersData : usersData?.users || [])
            if (insightsData) setUserInsights(insightsData)
            setLoadingUsers(false)
          }
        } catch (err) {
          console.error(err)
          if (!ignore) setLoadingUsers(false)
        }
      } else if (activeTab === 'commission') {
        try {
          const data = await fetchApi<{ commissionPercent: number }>('/admin/settings/commission')
          if (!ignore && typeof data.commissionPercent === 'number') {
            setCommissionPercent(data.commissionPercent)
          }
        } catch (err) {
          console.error(err)
        }
      } else if (activeTab === 'insights') {
        try {
          const data = await fetchApi<MarketplaceInsights>('/admin/insights/marketplace')
          if (!ignore) {
            setInsights(data)
            setLoadingInsights(false)
          }
        } catch (err) {
          console.error(err)
          if (!ignore) setLoadingInsights(false)
        }
      }
    }

    fetchTabData()

    return () => {
      ignore = true
    }
  }, [activeTab, isAdmin, roleFilter, userSearch, refreshCount])

  // Approve Upload (F-B5)
  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await fetchApi(`/admin/uploads/${id}/approve`, { method: 'PATCH' })
      setRefreshCount((c) => c + 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setActionLoading(null)
    }
  }

  // Reject Upload with Reason (F-B5)
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectModalProduct) return
    if (!rejectReason.trim()) {
      alert('A rejection reason is mandatory.')
      return
    }

    setActionLoading(rejectModalProduct.id)
    try {
      await fetchApi(`/admin/uploads/${rejectModalProduct.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      setRejectModalProduct(null)
      setRejectReason('')
      setRefreshCount((c) => c + 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reject failed')
    } finally {
      setActionLoading(null)
    }
  }

  // Save Commission % (F-B6)
  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCommission(true)
    setCommissionSuccessMsg(false)
    try {
      await fetchApi('/admin/settings/commission', {
        method: 'PATCH',
        body: JSON.stringify({ commissionPercent }),
      })
      setCommissionSuccessMsg(true)
      setTimeout(() => setCommissionSuccessMsg(false), 3000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save commission')
    } finally {
      setSavingCommission(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="w-8 h-8 text-[var(--blue-bright)] animate-spin" />
      </div>
    )
  }

  // 403 Forbidden Screen for non-admins
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] blueprint-grid">
        <div className="max-w-md w-full deeptools-card rounded-2xl p-8 text-center border border-[var(--rose)]/30">
          <ShieldAlert className="w-12 h-12 text-[var(--rose)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text)]">403 Access Denied</h2>
          <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
            This administration console is strictly restricted to platform administrators.
            Your current account credentials lack the required <code className="text-[var(--rose)] font-mono">ADMIN</code> role.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:bg-[var(--surface-3)] transition-colors"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      {/* Ambient glows */}
      <div className="ambient-glow-purple top-[5%] start-[10%]" />
      <div className="ambient-glow-blue top-[40%] end-[10%]" />

      <div className="container-custom relative z-10">
        {/* Console Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--orange)]/10 border border-[var(--orange)]/30 text-[11px] font-mono text-[var(--orange)] mb-2 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>HIGH-PRIVILEGE ADMIN CONSOLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
              DeepTools Platform Management
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)]">
              ADMIN: {user.email}
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: 'uploads', label: 'Moderation Review Queue', icon: CheckCircle, badge: uploads.filter(u => u.status === 'PENDING').length },
            { id: 'users', label: 'User Directory & Roles', icon: Users },
            { id: 'commission', label: 'Platform Commission %', icon: Percent },
            { id: 'insights', label: 'Marketplace Insights', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-[var(--blue)] text-white shadow-md shadow-[var(--blue)]/20 border border-[var(--blue-bright)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--line)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="ms-1 px-1.5 py-0.2 rounded-full bg-[var(--orange)] text-[#080b10] text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* TAB 1: MODERATION REVIEW QUEUE (F-B5) */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">
                Digital Assets Awaiting Decision
              </h2>
              <button
                onClick={() => setRefreshCount((c) => c + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
              >
                Refresh Queue
              </button>
            </div>

            {loadingUploads ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                Loading review queue...
              </div>
            ) : uploads.length > 0 ? (
              <div className="deeptools-card rounded-xl overflow-hidden border border-[var(--line)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--muted-2)] font-mono uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Asset Name & File</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Seller</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {uploads.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[var(--text)]">
                            <div>{item.name}</div>
                            <span className="file-pill mt-1 inline-block">
                              {getFileExtensionPill(item.fileKey, item.category)} ({formatBytes(item.fileSize)})
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[var(--blue-bright)] uppercase text-[10px]">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-[var(--muted)] font-mono">
                            {item.seller?.name || item.sellerId}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[var(--text)]">
                            {formatCents(item.price)}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                              item.status === 'APPROVED'
                                ? 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/30'
                                : item.status === 'PENDING'
                                ? 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/30'
                                : 'bg-[var(--rose)]/15 text-[var(--rose)] border border-[var(--rose)]/30'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[var(--muted-2)]">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(item.id)}
                                  disabled={actionLoading === item.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] flex items-center gap-1 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectModalProduct(item)
                                    setRejectReason('')
                                  }}
                                  disabled={actionLoading === item.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--rose)] hover:bg-rose-600 text-white flex items-center gap-1 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--muted-2)] font-mono italic">
                                Decided
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <CheckCircle className="w-10 h-10 text-[var(--green)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">Review Queue Clear</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  All seller uploads have been processed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY (F-A5) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Metric Summary Cards */}
            {userInsights && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="deeptools-card rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">TOTAL REGISTERED USERS</span>
                  <div className="text-xl font-bold font-mono text-[var(--text)] mt-1">{userInsights.totalUsers}</div>
                </div>
                <div className="deeptools-card rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">NEW SIGNUPS</span>
                  <div className="text-xl font-bold font-mono text-[var(--blue-bright)] mt-1">+{userInsights.newUsers}</div>
                </div>
                <div className="deeptools-card rounded-xl p-4">
                  <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">SAMPLE PERIOD</span>
                  <div className="text-xl font-bold font-mono text-[var(--green)] mt-1 capitalize">{userInsights.period.replace(/_/g, ' ')}</div>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-[var(--muted)] absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setRefreshCount((c) => c + 1)}
                  placeholder="Search user name or email..."
                  className="w-full ps-9 pe-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--muted-2)]">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'USER' | 'ADMIN')}
                  className="bg-[var(--surface-2)] text-xs text-[var(--text)] border border-[var(--line)] rounded-lg px-3 py-2 focus:outline-none font-mono"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <button
                  onClick={() => setRefreshCount((c) => c + 1)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--blue)] text-white font-mono"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users Table */}
            {loadingUsers ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                Loading users directory...
              </div>
            ) : usersList.length > 0 ? (
              <div className="deeptools-card rounded-xl overflow-hidden border border-[var(--line)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--muted-2)] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">User ID</th>
                      <th className="px-4 py-3">Display Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-mono">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                        <td className="px-4 py-3 text-[var(--muted-2)]">{u.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 font-semibold text-[var(--text)] font-sans">{u.name}</td>
                        <td className="px-4 py-3 text-[var(--blue-bright)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/30'
                              : 'bg-[var(--surface-3)] text-[var(--muted)]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-2)]">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <Users className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">No Users Found</h3>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMISSION CONTROLLER (F-B6) */}
        {activeTab === 'commission' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-[var(--text)] mb-2">
                Platform Commission Fee Configuration
              </h2>
              <p className="text-xs text-[var(--muted)] mb-6 leading-relaxed">
                Controls the percentage retained by the DeepTools platform on every completed sale.
                The remaining balance is credited automatically as the seller payout.
              </p>

              {commissionSuccessMsg && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs text-[var(--green)] flex items-center gap-2 font-mono">
                  <CheckCircle className="w-4 h-4" />
                  <span>Platform commission updated successfully to {commissionPercent}%.</span>
                </div>
              )}

              <form onSubmit={handleSaveCommission} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-mono uppercase text-[var(--muted-2)]">
                      COMMISSION RATE
                    </label>
                    <span className="text-2xl font-extrabold font-mono text-[var(--blue-bright)]">
                      {commissionPercent}%
                    </span>
                  </div>

                  {/* Interactive Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Number(e.target.value))}
                    className="w-full h-2 bg-[var(--surface-3)] rounded-lg appearance-none cursor-pointer accent-[var(--blue-bright)]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--muted-2)] mt-1">
                    <span>0% (Zero Fee)</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-1.5 text-xs font-mono">
                  <div className="text-[10px] text-[var(--muted-2)] uppercase font-semibold">
                    SIMULATION EXAMPLE ON $100.00 SALE:
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Platform Retained Fee:</span>
                    <span className="text-[var(--orange)] font-bold">${(100 * (commissionPercent / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Seller Payout Amount:</span>
                    <span className="text-[var(--green)] font-bold">${(100 * ((100 - commissionPercent) / 100)).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingCommission}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors disabled:opacity-50"
                >
                  {savingCommission ? 'Saving Changes...' : 'Save Commission Settings'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: MARKETPLACE INSIGHTS (F-B7) */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--text)]">
              Platform Marketplace Financial Overview
            </h2>

            {loadingInsights ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                Loading platform telemetry...
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* 4-Metric Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="deeptools-card rounded-xl p-5">
                    <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">TOTAL GROSS REVENUE</span>
                    <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1">
                      {formatCents(insights.orders.totalRevenue)}
                    </div>
                  </div>

                  <div className="deeptools-card rounded-xl p-5">
                    <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">TOTAL COMPLETED ORDERS</span>
                    <div className="text-2xl font-bold font-mono text-[var(--blue-bright)] mt-1">
                      {insights.orders.total}
                    </div>
                  </div>

                  <div className="deeptools-card rounded-xl p-5">
                    <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">PLATFORM COMMISSION EARNED</span>
                    <div className="text-2xl font-bold font-mono text-[var(--orange)] mt-1">
                      {formatCents(insights.orders.totalCommission)}
                    </div>
                  </div>

                  <div className="deeptools-card rounded-xl p-5">
                    <span className="text-[10px] font-mono text-[var(--muted-2)] uppercase block">SELLER PAYOUTS DISBURSED</span>
                    <div className="text-2xl font-bold font-mono text-[var(--green)] mt-1">
                      {formatCents(insights.orders.totalSellerPayouts)}
                    </div>
                  </div>
                </div>

                {/* Sub-metrics: Uploads & Sellers */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                    <span className="text-[9px] font-mono text-[var(--muted-2)] uppercase block">TOTAL UPLOADS</span>
                    <span className="text-base font-bold font-mono text-[var(--text)]">{insights.uploads.total}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                    <span className="text-[9px] font-mono text-[var(--muted-2)] uppercase block">PENDING REVIEW</span>
                    <span className="text-base font-bold font-mono text-[var(--orange)]">{insights.uploads.pending}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                    <span className="text-[9px] font-mono text-[var(--muted-2)] uppercase block">APPROVED</span>
                    <span className="text-base font-bold font-mono text-[var(--green)]">{insights.uploads.approved}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                    <span className="text-[9px] font-mono text-[var(--muted-2)] uppercase block">REJECTED</span>
                    <span className="text-base font-bold font-mono text-[var(--red)]">{insights.uploads.rejected}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--line)]">
                    <span className="text-[9px] font-mono text-[var(--muted-2)] uppercase block">ACTIVE SELLERS</span>
                    <span className="text-base font-bold font-mono text-[var(--blue-bright)]">{insights.sellers.total}</span>
                  </div>
                </div>

                {/* Top Products Table */}
                {insights.topProducts && insights.topProducts.length > 0 && (
                  <div className="deeptools-card rounded-xl overflow-hidden border border-[var(--line)]">
                    <div className="p-4 border-b border-[var(--line)] font-mono text-xs font-semibold text-[var(--text)] uppercase">
                      Top-Performing Marketplace Assets
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--muted-2)] font-mono uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Asset Title</th>
                          <th className="px-4 py-3">Units Sold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)] font-mono">
                        {insights.topProducts.map((p) => (
                          <tr key={p.productId} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-[var(--text)] font-sans">{p.productName}</td>
                            <td className="px-4 py-3 font-bold text-[var(--blue-bright)]">{p.salesCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <TrendingUp className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">No Marketplace Insights Available</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mandatory Reject Reason Modal (F-B5) */}
      {rejectModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md deeptools-card rounded-2xl p-6 border border-[var(--rose)]/40 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--rose)] mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Reject Submission with Feedback</span>
            </h3>
            <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
              State the specific reason for rejecting <strong className="text-[var(--text)]">{rejectModalProduct.name}</strong>.
              This feedback will be presented to the seller so they can rectify and resubmit.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                required
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Missing required environment variables in README, or invalid node schema syntax..."
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--rose)] font-sans"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setRejectModalProduct(null)}
                  className="px-4 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectModalProduct.id}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--rose)] hover:bg-rose-600 text-white transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
