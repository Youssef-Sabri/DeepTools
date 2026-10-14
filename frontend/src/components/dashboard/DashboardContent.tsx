'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ShoppingBag,
  Upload,
  Layers,
  TrendingUp,
  User as UserIcon,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit,
  Loader2,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Order, Product, ProductCategory, SellerSale } from '@/lib/types'
import { formatCents, dollarsToCents, formatBytes, formatDate, getFileExtensionPill } from '@/lib/utils'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import type { Dictionary } from '@/dictionaries'

interface DashboardContentProps {
  dict?: Dictionary
  locale: string
}

type TabType = 'purchases' | 'upload' | 'uploads' | 'sales' | 'profile'

const categoryOptions: { value: ProductCategory; label: string }[] = [
  { value: 'workflow', label: 'workflow (n8n, Make)' },
  { value: 'agentic', label: 'agentic (Autonomous AI Agents)' },
  { value: 'script', label: 'script (Python, Bash)' },
  { value: 'code', label: 'code (Templates, Schemas)' },
]

function orderStatusLabel(status: Order['status'], isAr: boolean): string {
  if (status === 'COMPLETED') return isAr ? 'مكتمل' : 'Completed'
  if (status === 'PENDING') return isAr ? 'بانتظار الدفع' : 'Pending Payment'
  if (status === 'FAILED') return isAr ? 'فشل الدفع' : 'Payment Failed'
  return isAr ? 'ملغى' : 'Cancelled'
}

interface PayoutBreakdownProps {
  priceCents: number
  commissionPercent: number | null
  commissionLoading: boolean
  commissionError: boolean
  isAr: boolean
  onRetry: () => void
}

function PayoutBreakdown({ priceCents, commissionPercent, commissionLoading, commissionError, isAr, onRetry }: PayoutBreakdownProps) {
  // Match the backend splitCommission rule: round commission down to whole cents.
  const commissionCents = commissionPercent === null ? null : Math.floor(priceCents * commissionPercent / 100)
  const sellerCents = commissionCents === null ? null : priceCents - commissionCents

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2 text-xs font-mono">
      <div className="text-[10px] uppercase text-[var(--muted-2)] font-semibold">
        {isAr ? 'تقدير صافي أرباح البائع' : 'ESTIMATED PAYOUT BREAKDOWN'}
      </div>
      <div className="flex justify-between text-[var(--muted)]">
        <span>{isAr ? 'سعر البيع' : 'Customer Price:'}</span>
        <span className="text-[var(--text)]">{formatCents(priceCents)} USD ({priceCents} cents)</span>
      </div>
      <div className="flex justify-between text-[var(--muted)] gap-3">
        <span>{isAr ? 'رسوم المنصة' : 'Platform Commission'}{commissionPercent === null ? ':' : ` (${commissionPercent}%):`}</span>
        <span className="text-[var(--orange)]">{commissionCents === null ? '—' : `-${formatCents(commissionCents)} USD`}</span>
      </div>
      <div className="border-t border-[var(--line)] pt-2 flex justify-between font-bold text-[var(--green)]">
        <span>{isAr ? 'صافي ربحك لكل عملية بيع' : 'Your Net Payout:'}</span>
        <span>{sellerCents === null ? '—' : `${formatCents(sellerCents)} USD`}</span>
      </div>
      {commissionPercent === null && (
        <div className="text-[var(--muted-2)]" aria-live="polite">
          {commissionLoading
            ? (isAr ? 'جارٍ تحميل نسبة العمولة...' : 'Loading commission rate...')
            : commissionError && (
              <span>
                {isAr ? 'تعذر تحميل نسبة العمولة. ' : 'Could not load the commission rate. '}
                <button type="button" onClick={onRetry} className="text-[var(--blue-bright)] underline underline-offset-2">
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </span>
            )}
        </div>
      )}
    </div>
  )
}

export default function DashboardContent({ locale }: DashboardContentProps) {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'purchases'

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // React to URL tab query changes (e.g. clicking Submit Tool from navbar)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType | null
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    } else if (!tabFromUrl && activeTab !== 'purchases') {
      setActiveTab('purchases')
    }
  }, [searchParams])

  // Tab 1: Purchases data
  const [purchases, setPurchases] = useState<Order[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [purchaseLoadError, setPurchaseLoadError] = useState(false)
  const [purchasePage, setPurchasePage] = useState(1)
  const [purchaseTotalPages, setPurchaseTotalPages] = useState(1)
  const [purchaseTotal, setPurchaseTotal] = useState(0)
  const [loadingMorePurchases, setLoadingMorePurchases] = useState(false)
  const [purchasePageError, setPurchasePageError] = useState(false)

  // Tab 2: Upload Studio state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadNameAr, setUploadNameAr] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadCategory, setUploadCategory] = useState<ProductCategory>('workflow')
  const [uploadPriceDollars, setUploadPriceDollars] = useState('29.00')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null)
  const [commissionLoading, setCommissionLoading] = useState(true)
  const [commissionError, setCommissionError] = useState(false)
  const [commissionRefreshKey, setCommissionRefreshKey] = useState(0)

  // Tab 3: My Uploads data & Edit/Resubmit modal
  const [myUploads, setMyUploads] = useState<Product[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const [uploadsLoadError, setUploadsLoadError] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState<ProductCategory>('workflow')
  const [editPriceDollars, setEditPriceDollars] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Tab 4: Sales data
  const [sales, setSales] = useState<SellerSale[]>([])
  const [loadingSales, setLoadingSales] = useState(true)
  const [salesLoadError, setSalesLoadError] = useState(false)
  const [salesPage, setSalesPage] = useState(1)
  const [salesTotalPages, setSalesTotalPages] = useState(1)
  const [salesTotal, setSalesTotal] = useState(0)
  const [salesGross, setSalesGross] = useState(0)
  const [sellerEarnings, setSellerEarnings] = useState(0)
  const [loadingMoreSales, setLoadingMoreSales] = useState(false)
  const [salesPageError, setSalesPageError] = useState(false)

  // Tab 5: Profile & Security state
  const [nameInput, setNameInput] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Download floating widget
  const [downloadState, setDownloadState] = useState<{
    isVisible: boolean
    fileName: string
    progress: number
    isComplete: boolean
  }>({
    isVisible: false,
    fileName: '',
    progress: 0,
    isComplete: false,
  })

  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const isAr = locale === 'ar'

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login`)
    }
  }, [user, authLoading, router, locale])

  useEffect(() => {
    if (!user) return
    let ignore = false

    async function loadCommission() {
      setCommissionLoading(true)
      setCommissionError(false)
      setCommissionPercent(null)
      try {
        const data = await fetchApi<{ commissionPercent: number }>('/settings/commission')
        if (!Number.isInteger(data.commissionPercent) || data.commissionPercent < 0 || data.commissionPercent > 100) {
          throw new Error('Invalid commission rate')
        }
        if (!ignore) setCommissionPercent(data.commissionPercent)
      } catch {
        if (!ignore) setCommissionError(true)
      } finally {
        if (!ignore) setCommissionLoading(false)
      }
    }

    loadCommission()
    return () => { ignore = true }
  }, [user?.id, commissionRefreshKey])

  // Load Tab 1: Purchases
  useEffect(() => {
    let ignore = false
    async function fetchPurchases() {
      try {
        const data = await fetchApi<{ orders: Order[]; total: number; totalPages: number }>('/orders/mine?page=1')
        if (!ignore) {
          setPurchaseLoadError(false)
          setPurchases(data.orders)
          setPurchaseTotal(data.total)
          setPurchaseTotalPages(data.totalPages)
          setPurchasePage(1)
          setLoadingPurchases(false)
        }
      } catch (err) {
        console.error('Failed to load purchases:', err)
        if (!ignore) { setPurchaseLoadError(true); setLoadingPurchases(false) }
      }
    }
    if (activeTab === 'purchases' && user) {
      fetchPurchases()
    }
    return () => {
      ignore = true
    }
  }, [activeTab, user])

  // Load Tab 3: My Uploads
  useEffect(() => {
    let ignore = false
    async function fetchUploads() {
      try {
        const data = await fetchApi<{ items?: Product[] } | Product[]>('/uploads/mine')
        if (!ignore) {
          setUploadsLoadError(false)
          if (Array.isArray(data)) {
            setMyUploads(data)
          } else if (data && Array.isArray(data.items)) {
            setMyUploads(data.items)
          } else {
            setMyUploads([])
          }
          setLoadingUploads(false)
        }
      } catch (err) {
        console.error('Failed to load uploads:', err)
        if (!ignore) { setUploadsLoadError(true); setLoadingUploads(false) }
      }
    }
    if (activeTab === 'uploads' && user) {
      fetchUploads()
    }
    return () => {
      ignore = true
    }
  }, [activeTab, user])

  // Load Tab 4: Sales
  useEffect(() => {
    let ignore = false
    async function fetchSales() {
      try {
        const data = await fetchApi<{ sales: SellerSale[]; totalSales: number; totalGrossSales: number; totalSellerEarnings: number; totalPages: number }>('/orders/sales?page=1')
        if (!ignore) {
          setSalesLoadError(false)
          setSales(data.sales)
          setSalesTotal(data.totalSales)
          setSalesGross(data.totalGrossSales)
          setSellerEarnings(data.totalSellerEarnings)
          setSalesTotalPages(data.totalPages)
          setSalesPage(1)
          setLoadingSales(false)
        }
      } catch (err) {
        console.error('Failed to load sales:', err)
        if (!ignore) { setSalesLoadError(true); setLoadingSales(false) }
      }
    }
    if (activeTab === 'sales' && user) {
      fetchSales()
    }
    return () => {
      ignore = true
    }
  }, [activeTab, user])

  const loadMorePurchases = async () => {
    if (loadingMorePurchases || purchasePage >= purchaseTotalPages) return
    setLoadingMorePurchases(true)
    setPurchasePageError(false)
    try {
      const data = await fetchApi<{ orders: Order[] }>(`/orders/mine?page=${purchasePage + 1}`)
      setPurchases((previous) => [...previous, ...data.orders])
      setPurchasePage((previous) => previous + 1)
    } catch {
      setPurchasePageError(true)
    } finally { setLoadingMorePurchases(false) }
  }

  const loadMoreSales = async () => {
    if (loadingMoreSales || salesPage >= salesTotalPages) return
    setLoadingMoreSales(true)
    setSalesPageError(false)
    try {
      const data = await fetchApi<{ sales: SellerSale[] }>(`/orders/sales?page=${salesPage + 1}`)
      setSales((previous) => [...previous, ...data.sales])
      setSalesPage((previous) => previous + 1)
    } catch {
      setSalesPageError(true)
    } finally { setLoadingMoreSales(false) }
  }

  // Download File Handler
  const handleDownloadFile = async (productId: string, fallbackName: string) => {
    setDownloadState({
      isVisible: true,
      fileName: fallbackName,
      progress: 30,
      isComplete: false,
    })

    try {
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, progress: 85 }))
      }, 300)

      await downloadProductFile(productId, fallbackName)

      setDownloadState({
        isVisible: true,
        fileName: fallbackName,
        progress: 100,
        isComplete: true,
      })

      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, isVisible: false }))
      }, 4000)
    } catch {
      setDownloadState((prev) => ({ ...prev, isVisible: false }))
      alert(isAr ? 'فشل التنزيل.' : 'Download failed.')
    }
  }

  // Upload Studio Submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) {
      setUploadError(isAr ? 'يرجى إرفاق ملف الأداة الرقمية' : 'Please select an asset file to upload')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('name', uploadName)
      if (uploadNameAr) formData.append('nameAr', uploadNameAr)
      formData.append('description', uploadDesc)
      formData.append('category', uploadCategory)
      formData.append('price', String(dollarsToCents(uploadPriceDollars)))

      await fetchApi('/uploads', {
        method: 'POST',
        body: formData,
      })

      setUploadSuccess(true)
      setUploadFile(null)
      setUploadName('')
      setUploadNameAr('')
      setUploadDesc('')
      setUploadPriceDollars('29.00')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload submission failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
    }
  }

  // Edit / Resubmit Handler
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod)
    setEditName(prod.name)
    setEditDesc(prod.description)
    setEditCategory(prod.category)
    setEditPriceDollars((prod.price / 100).toFixed(2))
    setEditFile(null)
  }

  const handleResubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setSubmittingEdit(true)

    try {
      const formData = new FormData()
      if (editFile) formData.append('file', editFile)
      formData.append('name', editName)
      formData.append('description', editDesc)
      formData.append('category', editCategory)
      formData.append('price', String(dollarsToCents(editPriceDollars)))

      await fetchApi(`/uploads/mine/${editingProduct.id}`, {
        method: 'PUT',
        body: formData,
      })

      setEditingProduct(null)
      // Refresh uploads table
      const updated = await fetchApi<{ items?: Product[] } | Product[]>('/uploads/mine')
      if (Array.isArray(updated)) {
        setMyUploads(updated)
      } else if (updated && Array.isArray(updated.items)) {
        setMyUploads(updated.items)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Resubmission failed')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      await fetchApi('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: nameInput || user.name }),
      })
      await refreshUser()
      setProfileMsg({ text: isAr ? 'تم حفظ الاسم بنجاح' : 'Profile updated successfully', isError: false })
    } catch (err: unknown) {
      setProfileMsg({ text: err instanceof Error ? err.message : 'Failed to update profile', isError: true })
    } finally {
      setSavingProfile(false)
    }
  }

  // Password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentPassword === newPassword) {
      setPasswordMsg({ text: isAr ? 'لا يمكن أن تكون كلمة المرور الجديدة مماثلة للحالية' : 'New password must differ from current password', isError: true })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      await fetchApi('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMsg({ text: isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully', isError: false })
    } catch (err: unknown) {
      setPasswordMsg({ text: err instanceof Error ? err.message : 'Failed to change password', isError: true })
    } finally {
      setSavingPassword(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--blue-bright)] animate-spin" />
      </div>
    )
  }

  const navTabs = [
    { id: 'purchases', label: isAr ? 'المشتريات والتنزيلات' : 'My Purchases', icon: ShoppingBag },
    { id: 'upload', label: isAr ? 'نشر أداة جديدة' : 'Upload Studio', icon: Upload },
    { id: 'uploads', label: isAr ? 'أدواتي المعروضة' : 'My Uploads', icon: Layers },
    { id: 'sales', label: isAr ? 'الأرباح والمبيعات' : 'Sales & Payouts', icon: TrendingUp },
    { id: 'profile', label: isAr ? 'الملف والأمان' : 'Profile & Security', icon: UserIcon },
  ]

  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      {/* Ambient lighting */}
      <div className="ambient-glow-blue top-[10%] start-[5%]" />
      <div className="ambient-glow-purple top-[45%] end-[5%]" />

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line-bright)] text-[11px] font-mono text-[var(--blue-bright)] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-bright)]" />
              <span>{isAr ? 'لوحة تحكم المهندس' : 'DEVELOPER WORKBENCH CONSOLE'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              {isAr ? 'أهلاً بك،' : 'Welcome back,'} {user.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-[var(--muted)]">
              ID: {user.id.slice(0, 8)}...
            </span>
            <span className="text-xs font-mono uppercase px-3 py-1.5 rounded-lg bg-[var(--blue)]/15 border border-[var(--blue)]/30 text-[var(--blue-bright)] font-semibold">
              {user.role}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  const newTab = tab.id as TabType
                  setActiveTab(newTab)
                  const targetUrl = newTab === 'purchases' ? `/${locale}/dashboard` : `/${locale}/dashboard?tab=${newTab}`
                  router.replace(targetUrl, { scroll: false })
                }}
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

        {/* TAB 1: PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">
                {isAr ? 'الأدوات المشتراة وتراخيص الاستخدام' : 'Orders & Licenses'}
              </h2>
              {!loadingPurchases && !purchaseLoadError && <span className="text-xs font-mono text-[var(--muted-2)]">
                {purchaseTotal} {isAr ? 'عنصر' : 'Items'}
              </span>}
            </div>

            {loadingPurchases ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                {isAr ? 'جارٍ تحميل المشتريات...' : 'Loading purchases...'}
              </div>
            ) : purchaseLoadError ? (
              <p role="alert" className="p-8 text-center text-sm text-[var(--rose)]">{isAr ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'}</p>
            ) : purchases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.map((order) => (
                  <div key={order.id} className="deeptools-card rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--blue-bright)]">
                          {order.product?.category || 'Asset'}
                        </span>
                        <span className={`text-xs font-mono flex items-center gap-1 font-semibold ${order.status === 'COMPLETED' ? 'text-[var(--green)]' : order.status === 'PENDING' ? 'text-[var(--orange)]' : 'text-[var(--rose)]'}`}>
                          {order.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                          {orderStatusLabel(order.status, isAr)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[var(--text)] line-clamp-1">
                        {isAr && order.product?.nameAr ? order.product.nameAr : order.productName || order.product?.name || `Order #${order.id.slice(0, 8).toUpperCase()}`}
                      </h3>

                      <div className="mt-3 text-xs font-mono text-[var(--muted-2)] space-y-1">
                        <div>{isAr ? 'مرجع الطلب:' : 'Order Ref:'} #{order.id.slice(0, 8).toUpperCase()}</div>
                        <div>{isAr ? 'تاريخ الطلب:' : 'Ordered:'} {formatDate(order.createdAt, locale)}</div>
                        <div>{order.status === 'COMPLETED' ? (isAr ? 'المدفوع:' : 'Paid:') : (isAr ? 'المبلغ المستحق:' : 'Due:')} {formatCents(order.amount)}</div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--line)]">
                      {order.status === 'COMPLETED' && <button
                        onClick={() =>
                          handleDownloadFile(
                            order.productId || order.product?.id || '',
                            `${order.productName || order.product?.name || 'asset'}${order.fileExtension || ''}`
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] flex items-center justify-center gap-2 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تحميل الملف الرقمي' : 'Download Asset File'}</span>
                      </button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <ShoppingBag className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
                  {isAr
                    ? 'تصفح الكتالوج لاكتشاف سيناريوهات وأدوات معتمدة من مهندسي الأتمتة.'
                    : 'Explore our catalog to acquire production-ready workflows and code.'}
                </p>
              </div>
            )}
            {purchasePage < purchaseTotalPages && <button onClick={() => void loadMorePurchases()} disabled={loadingMorePurchases} className="mt-6 px-4 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--text)] disabled:opacity-50">{loadingMorePurchases ? 'Loading...' : 'Load more orders'}</button>}
            {purchasePageError && <p role="alert" className="mt-2 text-sm text-[var(--rose)]">Could not load more orders. Please retry.</p>}
          </div>
        )}

        {/* TAB 2: UPLOAD STUDIO */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[var(--text)]">
                  {isAr ? 'نشر أداة أو سيناريو للبيع' : 'Seller Asset Upload Studio'}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {isAr
                    ? 'سيتم إرسال الملف إلى طابور مراجعة الإدارة (Pending Review) قبل اعتماده في الكتالوج العام.'
                    : 'Assets are submitted to the admin moderation queue before appearing on the public marketplace.'}
                </p>
              </div>

              {uploadSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs text-[var(--green)] flex items-center gap-3 font-mono">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>
                    {isAr
                      ? 'تم رفع الأداة بنجاح! الأداة الآن قيد المراجعة لدى فريق الإدارة.'
                      : 'Asset uploaded successfully! It is now pending admin moderation.'}
                  </span>
                </div>
              )}

              {uploadError && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-xs text-[var(--rose)] flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                {/* Drag Drop File Zone */}
                <div>
                  <label htmlFor="asset-upload-file" className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-2">
                    {isAr ? 'ملف الأصل الرقمي' : 'DIGITAL ASSET FILE'}
                  </label>
                  <div className="border-2 border-dashed border-[var(--line-bright)] rounded-xl p-6 text-center bg-[var(--surface-2)]/50">
                    <Upload className="w-8 h-8 text-[var(--blue-bright)] mx-auto mb-2" />
                    {uploadFile ? (
                      <div className="font-mono text-xs text-[var(--green)] font-semibold">
                        {uploadFile.name} ({formatBytes(uploadFile.size)})
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-semibold text-[var(--text)]">
                          {isAr ? 'اختر ملف الأداة الرقمية' : 'Select your asset file'}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--muted-2)] mt-1">
                          .json, .py, .ts, .js, .sh, .zip, .tar, .sql (Prohibited: .exe, .bat)
                        </div>
                      </>
                    )}
                    <input
                      id="asset-upload-file"
                      ref={fileInputRef}
                      type="file"
                      className="mt-4 block w-full cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)] file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--blue)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[var(--blue-bright)] transition-colors"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0])
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-1.5">
                      {isAr ? 'اسم الأداة (English)' : 'TOOL NAME (EN)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g. Stripe Webhook Sync to Postgres"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-1.5">
                      {isAr ? 'اسم الأداة (العربية - اختياري)' : 'TOOL NAME (AR - OPTIONAL)'}
                    </label>
                    <input
                      type="text"
                      value={uploadNameAr}
                      onChange={(e) => setUploadNameAr(e.target.value)}
                      placeholder="مثال: مزامنة أحداث سترايب مع بوستجرس"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-sans"
                    />
                  </div>
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-1.5">
                      {isAr ? 'القسم' : 'CATEGORY'}
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-mono"
                    >
                      {categoryOptions.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-1.5">
                      {isAr ? 'السعر بالدولار ($ USD)' : 'PRICE ($ USD)'}
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-[var(--muted-2)] absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={uploadPriceDollars}
                        onChange={(e) => setUploadPriceDollars(e.target.value)}
                        className="w-full ps-9 pe-3 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-2)] mb-1.5">
                    {isAr ? 'الوصف التقني والتعليمات' : 'TECHNICAL DESCRIPTION & USAGE'}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اشرح المتطلبات التقنية، المتغيرات البيئية المطلوبة، وكيفية تشغيل الأداة...'
                        : 'Explain setup steps, environment variables, nodes included, and execution guide...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-sans"
                  />
                </div>

                <PayoutBreakdown
                  priceCents={Math.max(0, dollarsToCents(uploadPriceDollars))}
                  commissionPercent={commissionPercent}
                  commissionLoading={commissionLoading}
                  commissionError={commissionError}
                  isAr={isAr}
                  onRetry={() => setCommissionRefreshKey((key) => key + 1)}
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {uploading
                      ? (isAr ? 'جارٍ رفع الأداة...' : 'Submitting to Review Queue...')
                      : (isAr ? 'إرسال الأداة للمراجعة والاعتماد' : 'Submit Tool for Verification')}
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: MY UPLOADS */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">
                {isAr ? 'أدواتي المعروضة وحالات المراجعة' : 'My Submissions & Review Status'}
              </h2>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--blue)] text-white flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isAr ? 'نشر أداة جديدة' : 'Upload New'}</span>
              </button>
            </div>

            {loadingUploads ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                {isAr ? 'جارٍ تحميل الأدوات...' : 'Loading submissions...'}
              </div>
            ) : uploadsLoadError ? (
              <p role="alert" className="p-8 text-center text-sm text-[var(--rose)]">{isAr ? 'تعذر تحميل الأصول المرفوعة.' : 'Could not load your uploads.'}</p>
            ) : myUploads.length > 0 ? (
              <div className="space-y-4">
                {myUploads.map((prod) => {
                  const isApproved = prod.status === 'APPROVED'
                  const isPending = prod.status === 'PENDING'
                  const isRejected = prod.status === 'REJECTED'

                  return (
                    <div
                      key={prod.id}
                      className="deeptools-card rounded-xl p-5 border border-[var(--line)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[var(--blue-bright)]">
                              {prod.category}
                            </span>
                            {prod.fileKey && getFileExtensionPill(prod.fileKey) && <span className="file-pill">{getFileExtensionPill(prod.fileKey)}</span>}
                            {prod.version && <span className="text-[10px] font-mono text-[var(--muted-2)]">v{prod.version}</span>}
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                                isApproved
                                  ? 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/30'
                                  : isPending
                                  ? 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/30'
                                  : 'bg-[var(--rose)]/15 text-[var(--rose)] border border-[var(--rose)]/30'
                              }`}
                            >
                              {prod.status}
                            </span>
                          </div>

                          <h3 className="font-bold text-base text-[var(--text)]">
                            {isAr && prod.nameAr ? prod.nameAr : prod.name}
                          </h3>
                          <p className="text-xs text-[var(--muted)] line-clamp-2">
                            {isAr && prod.descriptionAr ? prod.descriptionAr : prod.description}
                          </p>

                          <div className="text-xs font-mono text-[var(--muted-2)]">
                            {isAr ? 'السعر:' : 'Price:'} {formatCents(prod.price)} • {formatBytes(prod.fileSize)} • {formatDate(prod.createdAt, locale)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(isPending || isRejected) && (
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line)] flex items-center gap-1.5 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                              <span>{isAr ? 'تعديل وإعادة إرسال' : 'Edit & Resubmit'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Rejection Note Display */}
                      {isRejected && prod.rejectionNote && (
                        <div className="mt-4 p-3.5 rounded-lg bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-xs text-[var(--rose)] flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold font-mono uppercase text-[10px]">
                              {isAr ? 'ملاحظة الإدارة لسبب الرفض:' : 'ADMIN REJECTION REASON:'}
                            </div>
                            <div className="mt-0.5">{prod.rejectionNote}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <Layers className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? 'لا توجد أدوات مرفوعة حتى الآن' : 'No Submissions Found'}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {isAr ? 'انقر على "نشر أداة جديدة" لعرض أول ملف برمجيات لك.' : 'Click "Upload New" to publish your first engineering tool.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SALES & PAYOUTS */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[var(--text)]">
              {isAr ? 'أرباح البائع وسجل المبيعات' : 'Seller Revenue & Sales Ledger'}
            </h2>

            {/* Sales Summary Cards */}
            {!loadingSales && !salesLoadError && <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="deeptools-card rounded-xl p-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-2)] block">
                  {isAr ? 'إجمالي المبيعات' : 'TOTAL SALES'}
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--blue-bright)] mt-1">
                  {salesTotal}
                </div>
              </div>

              <div className="deeptools-card rounded-xl p-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-2)] block">
                  {isAr ? 'إجمالي الإيرادات' : 'GROSS SALES AMOUNT'}
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--text)] mt-1">
                  {formatCents(salesGross)}
                </div>
              </div>

              <div className="deeptools-card rounded-xl p-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-2)] block">
                  {isAr ? 'صافي أرباحك المحققة' : 'NET SELLER PAYOUT'}
                </span>
                <div className="text-2xl font-bold font-mono text-[var(--green)] mt-1">
                  {formatCents(sellerEarnings)}
                </div>
              </div>
            </div>}

            {/* Sales Table */}
            {loadingSales ? (
              <div className="p-12 text-center text-xs text-[var(--muted)]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
                {isAr ? 'جارٍ تحميل المبيعات...' : 'Loading sales records...'}
              </div>
            ) : salesLoadError ? (
              <p role="alert" className="p-8 text-center text-sm text-[var(--rose)]">{isAr ? 'تعذر تحميل المبيعات.' : 'Could not load sales.'}</p>
            ) : sales.length > 0 ? (
              <div className="deeptools-card rounded-xl overflow-hidden border border-[var(--line)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left rtl:text-right">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--muted-2)] font-mono uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">{isAr ? 'مرجع الطلب' : 'Order Ref'}</th>
                        <th className="px-4 py-3">{isAr ? 'الأداة' : 'Product'}</th>
                        <th className="px-4 py-3">{isAr ? 'المبلغ الإجمالي' : 'Gross Amount'}</th>
                        <th className="px-4 py-3">{isAr ? 'عمولة المنصة' : 'Commission'}</th>
                        <th className="px-4 py-3">{isAr ? 'صافي الربح' : 'Net Payout'}</th>
                        <th className="px-4 py-3">{isAr ? 'التاريخ' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] font-mono">
                      {sales.map((s) => (
                        <tr key={s.orderId} className="hover:bg-[var(--surface-2)]/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[var(--text)]">#{s.orderId.slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-[var(--blue-bright)] font-sans">{isAr && s.productNameAr ? s.productNameAr : s.productName}</td>
                          <td className="px-4 py-3 text-[var(--text)]">{formatCents(s.amount)}</td>
                          <td className="px-4 py-3 text-[var(--orange)]">-{formatCents(s.commissionAmount)}</td>
                          <td className="px-4 py-3 text-[var(--green)] font-bold">{formatCents(s.sellerAmount)}</td>
                          <td className="px-4 py-3 text-[var(--muted-2)]">{formatDate(s.createdAt, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)]">
                <TrendingUp className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {isAr ? 'لا توجد مبيعات مسجلة حتى الآن' : 'No Sales Recorded Yet'}
                </h3>
              </div>
            )}
            {salesPage < salesTotalPages && <button onClick={() => void loadMoreSales()} disabled={loadingMoreSales} className="mt-6 px-4 py-2 rounded-lg border border-[var(--line)] text-sm text-[var(--text)] disabled:opacity-50">{loadingMoreSales ? 'Loading...' : 'Load more sales'}</button>}
            {salesPageError && <p role="alert" className="mt-2 text-sm text-[var(--rose)]">Could not load more sales. Please retry.</p>}
          </div>
        )}

        {/* TAB 5: PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* User Info Form */}
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">
                {isAr ? 'بيانات الملف الشخصي' : 'User Profile Details'}
              </h2>

              {profileMsg && (
                <div
                  className={`mb-4 p-3.5 rounded-lg text-xs ${
                    profileMsg.isError
                      ? 'bg-[var(--rose)]/10 text-[var(--rose)] border border-[var(--rose)]/30'
                      : 'bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1">
                    {isAr ? 'البريد الإلكتروني (غير قابل للتعديل)' : 'EMAIL (READ-ONLY)'}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-3)] border border-[var(--line)] text-xs text-[var(--muted)] font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1">
                    {isAr ? 'الاسم الكامل' : 'DISPLAY NAME'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput !== '' ? nameInput : (user?.name || '')}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors disabled:opacity-50"
                >
                  {savingProfile ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
                </button>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-[var(--text)] mb-4">
                {isAr ? 'أمان الحساب وكلمة المرور' : 'Change Password'}
              </h2>

              {passwordMsg && (
                <div
                  className={`mb-4 p-3.5 rounded-lg text-xs ${
                    passwordMsg.isError
                      ? 'bg-[var(--rose)]/10 text-[var(--rose)] border border-[var(--rose)]/30'
                      : 'bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/30'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1">
                    {isAr ? 'كلمة المرور الحالية' : 'CURRENT PASSWORD'}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1">
                    {isAr ? 'كلمة المرور الجديدة' : 'NEW PASSWORD'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--surface-3)] hover:bg-[var(--line-bright)] text-[var(--text)] border border-[var(--line)] transition-colors disabled:opacity-50"
                >
                  {savingPassword ? (isAr ? 'جارٍ التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Edit & Resubmit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto deeptools-card rounded-2xl p-6 border border-[var(--line-bright)] shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text)] mb-4">
              {isAr ? 'تعديل الأداة وإعادة تقديمها للمراجعة' : 'Edit & Resubmit Asset'}
            </h3>

            <form onSubmit={handleResubmitUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--muted-2)] mb-1">NAME</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)]"
                />
              </div>

              <div>
                <label htmlFor="asset-edit-category" className="block text-xs font-mono text-[var(--muted-2)] mb-1">
                  {isAr ? 'القسم' : 'CATEGORY'}
                </label>
                <select
                  id="asset-edit-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] font-mono"
                >
                  {categoryOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--muted-2)] mb-1">PRICE ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPriceDollars}
                  onChange={(e) => setEditPriceDollars(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--muted-2)] mb-1">DESCRIPTION</label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)]"
                />
              </div>

              <PayoutBreakdown
                priceCents={Math.max(0, dollarsToCents(editPriceDollars))}
                commissionPercent={commissionPercent}
                commissionLoading={commissionLoading}
                commissionError={commissionError}
                isAr={isAr}
                onRetry={() => setCommissionRefreshKey((key) => key + 1)}
              />

              <div>
                <label htmlFor="asset-edit-file" className="block text-xs font-mono text-[var(--muted-2)] mb-1">
                  REPLACE ASSET FILE (OPTIONAL)
                </label>
                <input
                  id="asset-edit-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditFile(e.target.files[0])
                    }
                  }}
                  className="block w-full cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)] file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[var(--blue)] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[var(--blue-bright)] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white"
                >
                  {submittingEdit ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : (isAr ? 'إعادة الإرسال للمراجعة' : 'Resubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Download Overlay */}
      <DownloadOverlay
        isVisible={downloadState.isVisible}
        fileName={downloadState.fileName}
        progress={downloadState.progress}
        isComplete={downloadState.isComplete}
        onClose={() => setDownloadState((prev) => ({ ...prev, isVisible: false }))}
        locale={locale}
      />
    </div>
  )
}
