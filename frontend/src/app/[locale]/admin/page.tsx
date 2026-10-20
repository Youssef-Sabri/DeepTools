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
  Download,
  Eye,
  Layers,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  fetchApi,
  downloadAdminUploadFile,
  adminUploadViewUrl,
  fetchCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/api'
import type { Product, User, MarketplaceInsights, UserInsights, Category } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getFileExtensionPill } from '@/lib/utils'
import { SectionLoader } from '@/components/ui/SectionLoader'

type AdminTab = 'uploads' | 'users' | 'commission' | 'insights' | 'categories'
type UploadStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<AdminTab>('uploads')
  const [refreshCount, setRefreshCount] = useState(0)

  // Tab 1: Moderation Queue (F-B5)
  const [uploads, setUploads] = useState<Product[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const [uploadStatusFilter, setUploadStatusFilter] = useState<UploadStatusFilter>('ALL')
  const [uploadPage, setUploadPage] = useState(1)
  const [uploadTotalPages, setUploadTotalPages] = useState(1)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [rejectModalProduct, setRejectModalProduct] = useState<Product | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  // Tab 5: Dynamic Categories (F2-C4)
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryModal, setCategoryModal] = useState<{ mode: 'create' | 'edit'; category?: Category } | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
  })
  const [categoryActionLoading, setCategoryActionLoading] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return
    let ignore = false

    async function fetchTabData() {
      if (activeTab === 'uploads') {
        try {
          const params = new URLSearchParams({ page: String(uploadPage), limit: '20' })
          if (uploadStatusFilter !== 'ALL') params.set('status', uploadStatusFilter)
          const data = await fetchApi<{ items?: Product[]; uploads?: Product[]; total?: number; totalPages?: number } | Product[]>(`/admin/uploads?${params.toString()}`)
          if (!ignore) {
            if (!Array.isArray(data) && data.totalPages && uploadPage > data.totalPages) {
              setLoadingUploads(true)
              setUploadPage(data.totalPages)
              return
            }
            if (Array.isArray(data)) setUploads(data)
            else if (data && Array.isArray(data.items)) setUploads(data.items)
            else if (data && Array.isArray(data.uploads)) setUploads(data.uploads)
            else setUploads([])
            setUploadTotal(Array.isArray(data) ? data.length : data.total ?? 0)
            setUploadTotalPages(Array.isArray(data) ? 1 : data.totalPages ?? 1)
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
      } else if (activeTab === 'categories') {
        try {
          setLoadingCategories(true)
          const data = await fetchCategories()
          if (!ignore) {
            setCategoriesList(data)
            setLoadingCategories(false)
          }
        } catch (err) {
          console.error(err)
          if (!ignore) setLoadingCategories(false)
        }
      }
    }

    fetchTabData()

    return () => {
      ignore = true
    }
  }, [activeTab, isAdmin, roleFilter, userSearch, refreshCount, uploadPage, uploadStatusFilter])

  // Download the current uploaded file for any product status.
  const handleDownloadReviewFile = async (item: Product) => {
    setDownloadingId(item.id)
    try {
      const extension = getFileExtensionPill(item.fileKey)
      const fallbackName = item.name.toLowerCase().endsWith(extension.toLowerCase()) ? item.name : `${item.name}${extension}`
      await downloadAdminUploadFile(item.id, fallbackName)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Review file download failed')
    } finally {
      setDownloadingId(null)
    }
  }

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

  // Categories Management Handlers (F2-C4)
  const handleOpenCreateCategory = () => {
    setCategoryError(null)
    setCategoryForm({
      slug: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      icon: '',
      displayOrder: 0,
      isActive: true,
    })
    setCategoryModal({ mode: 'create' })
  }

  const handleOpenEditCategory = (cat: Category) => {
    setCategoryError(null)
    setCategoryForm({
      slug: cat.slug,
      name: cat.name,
      nameAr: cat.nameAr || '',
      description: cat.description || '',
      descriptionAr: cat.descriptionAr || '',
      icon: cat.icon || '',
      displayOrder: cat.displayOrder ?? 0,
      isActive: cat.isActive ?? true,
    })
    setCategoryModal({ mode: 'edit', category: cat })
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryModal) return
    setCategoryActionLoading(true)
    setCategoryError(null)

    try {
      if (categoryModal.mode === 'create') {
        await createAdminCategory({
          slug: categoryForm.slug.trim().toLowerCase(),
          name: categoryForm.name.trim(),
          nameAr: categoryForm.nameAr.trim(),
          description: categoryForm.description.trim() || undefined,
          descriptionAr: categoryForm.descriptionAr.trim() || undefined,
          icon: categoryForm.icon.trim() || undefined,
          displayOrder: Number(categoryForm.displayOrder) || 0,
        })
      } else if (categoryModal.category) {
        await updateAdminCategory(categoryModal.category.id, {
          name: categoryForm.name.trim(),
          nameAr: categoryForm.nameAr.trim(),
          description: categoryForm.description.trim() || undefined,
          descriptionAr: categoryForm.descriptionAr.trim() || undefined,
          icon: categoryForm.icon.trim() || undefined,
          displayOrder: Number(categoryForm.displayOrder) || 0,
          isActive: categoryForm.isActive,
        })
      }

      setCategoryModal(null)
      const updated = await fetchCategories()
      setCategoriesList(updated)
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : 'Category operation failed')
    } finally {
      setCategoryActionLoading(false)
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return
    try {
      await deleteAdminCategory(cat.id)
      const updated = await fetchCategories()
      setCategoriesList(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      alert(msg)
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
            { id: 'uploads', label: 'Asset Review', icon: CheckCircle },
            { id: 'users', label: 'User Directory & Roles', icon: Users },
            { id: 'categories', label: 'Categories Management', icon: Layers },
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
              </button>
            )
          })}
        </div>

        {/* TAB 1: MODERATION REVIEW QUEUE (F-B5) */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text)]">
                Digital Assets
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="admin-asset-status" className="text-xs text-[var(--muted)]">Status</label>
                <select
                  id="admin-asset-status"
                  value={uploadStatusFilter}
                  onChange={(event) => {
                    setLoadingUploads(true)
                    setUploadPage(1)
                    setUploadStatusFilter(event.target.value as UploadStatusFilter)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)]"
                >
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button
                  onClick={() => { setLoadingUploads(true); setRefreshCount((c) => c + 1) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--line)]"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loadingUploads ? (
              <SectionLoader label={"Loading assets..."} />
            ) : uploads.length > 0 ? (
              <div className="space-y-3">
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
                        <th className="px-4 py-3 text-right">File & Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {uploads.map((item) => (
                        <tr key={item.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[var(--text)]">
                            <div>{item.name}</div>
                            {item.fileKey && (
                              <span className="file-pill mt-1 inline-block">
                                {getFileExtensionPill(item.fileKey)} ({formatBytes(item.fileSize)})
                              </span>
                            )}
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
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadReviewFile(item)}
                                disabled={!item.fileKey || downloadingId !== null || actionLoading === item.id}
                                title={item.fileKey ? 'Download the uploaded file' : 'No file is available'}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] border border-[var(--line-bright)] text-[var(--blue-bright)] hover:bg-[var(--surface-3)] flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                <span>Download File</span>
                              </button>
                              {item.fileKey ? (
                                <a
                                  href={adminUploadViewUrl(item.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open the uploaded file in a new tab"
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] border border-[var(--line-bright)] text-[var(--blue-bright)] hover:bg-[var(--surface-3)] flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View in Browser</span>
                                </a>
                              ) : (
                                <span className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted-2)] opacity-50">View in Browser</span>
                              )}
                              {item.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(item.id)}
                                    disabled={actionLoading === item.id}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--green)] hover:brightness-110 text-white flex items-center gap-1 transition-colors"
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
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--rose)] hover:brightness-110 text-white flex items-center gap-1 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <span>{uploadTotal} assets, page {uploadPage} of {uploadTotalPages}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={uploadPage <= 1}
                    onClick={() => { setLoadingUploads(true); setUploadPage((page) => page - 1) }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] disabled:opacity-50"
                  >Previous</button>
                  <button
                    type="button"
                    disabled={uploadPage >= uploadTotalPages}
                    onClick={() => { setLoadingUploads(true); setUploadPage((page) => page + 1) }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <CheckCircle className="w-10 h-10 text-[var(--green)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">No assets found</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Try another status or refresh the list.
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
              <SectionLoader label={"Loading users directory..."} />
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
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white transition-colors disabled:opacity-50"
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
              <SectionLoader label={"Loading platform telemetry..."} />
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

        {/* TAB 5: CATEGORIES MANAGEMENT (F2-C4) */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Categories Management</h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Dynamic database taxonomies powering marketplace chips, search filters, and seller submission forms.
                </p>
              </div>

              <button
                onClick={handleOpenCreateCategory}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Category</span>
              </button>
            </div>

            {loadingCategories ? (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <Loader2 className="w-8 h-8 text-[var(--blue-bright)] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[var(--muted)]">Loading categories from database...</p>
              </div>
            ) : categoriesList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <Layers className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">No Categories Configured</h3>
                <p className="text-xs text-[var(--muted)] mt-1 mb-4">Create your first marketplace category to organize tools.</p>
                <button
                  onClick={handleOpenCreateCategory}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--blue)] text-white"
                >
                  Create Category
                </button>
              </div>
            ) : (
              <div className="deeptools-card rounded-2xl overflow-hidden border border-[var(--line)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs font-mono">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--muted-2)] text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-start">Slug</th>
                        <th className="px-4 py-3 text-start">Title (EN)</th>
                        <th className="px-4 py-3 text-start">Title (AR)</th>
                        <th className="px-4 py-3 text-center">Order</th>
                        <th className="px-4 py-3 text-center">Products</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {categoriesList.map((cat) => (
                        <tr key={cat.id} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="px-2.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] font-mono text-[11px]">
                              {cat.slug}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-sans font-semibold text-[var(--text)]">
                            {cat.name}
                          </td>
                          <td className="px-4 py-3.5 font-sans text-[var(--muted)]" dir="rtl">
                            {cat.nameAr || '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center text-[var(--muted-2)]">
                            {cat.displayOrder ?? 0}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--blue)]/10 text-[var(--blue-bright)] border border-[var(--blue)]/20">
                              {cat.productCount ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {cat.isActive !== false ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/25">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--muted-2)] border border-[var(--line)]">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCategory(cat)}
                                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1.5 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-400/10 transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--rose)] hover:brightness-110 text-white transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal (F2-C4) */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-2xl p-6 border border-[var(--line)] shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--blue-bright)]" />
                <span>
                  {categoryModal.mode === 'create'
                    ? 'Create Marketplace Category'
                    : `Edit Category: ${categoryModal.category?.name}`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setCategoryModal(null)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded-xl bg-rose-400/10 border border-rose-400/25 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-300" />
                <span>{categoryError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Category Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={categoryModal.mode === 'edit'}
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    }))
                  }
                  placeholder="e.g. voice-agents or rag-tools"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] font-mono focus:outline-none focus:border-[var(--blue)] disabled:opacity-60"
                />
                <p className="text-[11px] text-[var(--muted-2)] mt-1">
                  Unique URL path identifier. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    English Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Voice Agents"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Arabic Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={categoryForm.nameAr}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="مثال: وكلاء الصوت الذكية"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] font-sans focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    English Description
                  </label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description for SEO and category page..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Arabic Description
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={categoryForm.descriptionAr}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, descriptionAr: e.target.value }))}
                    placeholder="وصف مختصر للتصنيف..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] font-sans focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Lucide Icon
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                    placeholder="e.g. Cpu, Layers, Bot"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({ ...prev, displayOrder: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div className="pt-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-[var(--line)] text-[var(--blue)] focus:ring-[var(--blue)]"
                    />
                    <span className="text-xs font-semibold text-[var(--text)]">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setCategoryModal(null)}
                  className="px-4 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categoryActionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-blue-600 text-white transition-colors disabled:opacity-60"
                >
                  {categoryActionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : categoryModal.mode === 'create' ? (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Category</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
