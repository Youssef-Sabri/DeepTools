'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Database,
  Workflow,
  Key,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { fetchApi } from '@/lib/api'

interface Product {
  id: string
  name: string
  nameAr?: string | null
  description: string
  descriptionAr?: string | null
  category: string
  price: number
  badge: string | null
  badgeAr?: string | null
  version: string
  downloadUrl: string | null
  displayName?: string
  displayDescription?: string
  displayBadge?: string | null
}

interface Template {
  id: string
  name: string
  nameAr?: string | null
  description: string
  descriptionAr?: string | null
  category: string
  compatibility: string[]
  version: string
  downloads: number
  price: number
  downloadUrl: string | null
  displayName?: string
  displayDescription?: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface License {
  id: string
  licenseKey: string
  isActive: boolean
  expiresAt: string
  createdAt: string
  userName: string
  userEmail: string
  productName: string
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState<Product[]>()
  const [templates, setTemplates] = useState<Template[]>()
  const [usersList, setUsersList] = useState<UserProfile[]>()
  const [licenses, setLicenses] = useState<License[]>()
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Product Modals / Form states
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    category: 'aiAgents',
    price: 4900,
    version: '1.0.0',
    badge: '',
    badgeAr: '',
    downloadUrl: '',
  })

  // Template Modals / Form states
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    category: 'postgresql',
    compatibility: 'PostgreSQL 14+, Linux',
    price: 0,
    version: '1.0.0',
    downloadUrl: '',
  })

  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/')
      } else {
        loadDashboardData()
      }
    }
  }, [user, authLoading, router])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [prods, temps, usrs, lics] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/templates'),
        fetchApi('/admin/users'),
        fetchApi('/admin/licenses'),
      ])
      setProducts(prods)
      setTemplates(temps)
      setUsersList(usrs)
      setLicenses(lics)
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- Product Actions ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newProduct = await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(productForm),
      })
      setProducts((prev) => (prev ? [...prev, newProduct] : [newProduct]))
      setShowProductModal(false)
      setProductForm({ name: '', nameAr: '', description: '', descriptionAr: '', category: 'aiAgents', price: 4900, version: '1.0.0', badge: '', badgeAr: '', downloadUrl: '' })
    } catch (err) {
      alert('Failed to create product')
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    try {
      const updated = await fetchApi(`/products/${editingProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify(productForm),
      })
      setProducts((prev) => prev?.map((p) => (p.id === editingProduct.id ? updated : p)))
      setEditingProduct(null)
    } catch (err) {
      alert('Failed to update product')
    }
  }

  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      nameAr: product.nameAr || '',
      description: product.description,
      descriptionAr: product.descriptionAr || '',
      category: product.category,
      price: product.price,
      version: product.version,
      badge: product.badge || '',
      badgeAr: product.badgeAr || '',
      downloadUrl: product.downloadUrl || '',
    })
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setActionLoading(id)
    try {
      await fetchApi(`/products/${id}`, { method: 'DELETE' })
      setProducts((prev) => prev?.filter((p) => p.id !== id))
    } catch (err) {
      alert('Failed to delete product')
    } finally {
      setActionLoading(null)
    }
  }

  // --- Template Actions ---
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formattedForm = {
        ...templateForm,
        compatibility: templateForm.compatibility.split(',').map((c) => c.trim()),
      }
      const newTemplate = await fetchApi('/templates', {
        method: 'POST',
        body: JSON.stringify(formattedForm),
      })
      setTemplates((prev) => (prev ? [...prev, newTemplate] : [newTemplate]))
      setShowTemplateModal(false)
      setTemplateForm({ name: '', nameAr: '', description: '', descriptionAr: '', category: 'postgresql', compatibility: 'PostgreSQL 14+, Linux', price: 0, version: '1.0.0', downloadUrl: '' })
    } catch (err) {
      alert('Failed to create template')
    }
  }

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return
    try {
      const formattedForm = {
        ...templateForm,
        compatibility: templateForm.compatibility.split(',').map((c) => c.trim()),
      }
      const updated = await fetchApi(`/templates/${editingTemplate.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formattedForm),
      })
      setTemplates((prev) => prev?.map((t) => (t.id === editingTemplate.id ? updated : t)))
      setEditingTemplate(null)
    } catch (err) {
      alert('Failed to update template')
    }
  }

  const startEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      nameAr: template.nameAr || '',
      description: template.description,
      descriptionAr: template.descriptionAr || '',
      category: template.category,
      compatibility: template.compatibility.join(', '),
      price: template.price,
      version: template.version,
      downloadUrl: template.downloadUrl || '',
    })
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    setActionLoading(id)
    try {
      await fetchApi(`/templates/${id}`, { method: 'DELETE' })
      setTemplates((prev) => prev?.filter((t) => t.id !== id))
    } catch (err) {
      alert('Failed to delete template')
    } finally {
      setActionLoading(null)
    }
  }

  // --- License Actions ---
  const handleToggleLicense = async (id: string, currentStatus: boolean) => {
    setActionLoading(id)
    try {
      await fetchApi(`/admin/licenses/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      setLicenses((prev) =>
        prev?.map((lic) => (lic.id === id ? { ...lic, isActive: !currentStatus } : lic))
      )
    } catch (err) {
      alert('Failed to update license key status')
    } finally {
      setActionLoading(null)
    }
  }

  // --- User Actions ---
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    setActionLoading(id)
    try {
      await fetchApi(`/admin/users/${id}`, { method: 'DELETE' })
      setUsersList((prev) => prev?.filter((u) => u.id !== id))
    } catch (err) {
      alert('Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    )
  }

  return (
    <section className="min-h-[85vh]">
      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Admin Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="p-3 mb-4 border-b border-border">
                <div className="text-sm font-bold gradient-text uppercase tracking-wider">Admin Panel</div>
                <div className="text-xs text-muted-foreground mt-1">Logged in as Administrator</div>
              </div>
              <nav className="space-y-1">
                {[
                  { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
                  { key: 'products', icon: Database, label: 'Products CRUD' },
                  { key: 'templates', icon: Workflow, label: 'Templates CRUD' },
                  { key: 'users', icon: Users, label: 'Manage Users' },
                  { key: 'licenses', icon: Key, label: 'Manage Licenses' },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'text-accent-cyan bg-accent-cyan/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
                <button
                  onClick={() => router.push('/')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-6"
                >
                  <LogOut className="w-4 h-4" />
                  Exit Admin Panel
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Panel Content */}
          <main className="flex-1 min-w-0">
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h1 className="text-2xl font-bold mb-6">Administrative Dashboard Overview</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Products', value: products?.length || 0, icon: Database, color: 'text-accent-cyan' },
                    { label: 'Active Templates', value: templates?.length || 0, icon: Workflow, color: 'text-accent-violet' },
                    { label: 'Registered Users', value: usersList?.length || 0, icon: Users, color: 'text-accent-emerald' },
                    { label: 'Licenses Issued', value: licenses?.length || 0, icon: Key, color: 'text-accent-rose' },
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <div key={i} className="p-5 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2. Products Tab */}
            {activeTab === 'products' && (
              <div className="rounded-xl bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-accent-cyan" />
                    Products Management
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null)
                      setProductForm({ name: '', nameAr: '', description: '', descriptionAr: '', category: 'aiAgents', price: 4900, version: '1.0.0', badge: '', badgeAr: '', downloadUrl: '' })
                      setShowProductModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start text-muted-foreground">
                    <thead className="text-xs uppercase text-foreground bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-start">Name</th>
                        <th className="px-6 py-3 text-start">Category</th>
                        <th className="px-6 py-3 text-start">Price</th>
                        <th className="px-6 py-3 text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map((product) => (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div>{product.name}</div>
                            {product.nameAr && <div className="text-xs text-muted-foreground font-normal">{product.nameAr}</div>}
                          </td>
                          <td className="px-6 py-4">{product.category}</td>
                          <td className="px-6 py-4">${(product.price / 100).toFixed(2)}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="p-2 text-accent-cyan hover:bg-accent-cyan/10 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={actionLoading === product.id}
                              className="p-2 text-accent-rose hover:bg-accent-rose/10 rounded-lg disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Templates Tab */}
            {activeTab === 'templates' && (
              <div className="rounded-xl bg-card border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-accent-cyan" />
                    Automation Templates
                  </h2>
                  <button
                    onClick={() => {
                      setEditingTemplate(null)
                      setTemplateForm({ name: '', nameAr: '', description: '', descriptionAr: '', category: 'postgresql', compatibility: 'PostgreSQL 14+, Linux', price: 0, version: '1.0.0', downloadUrl: '' })
                      setShowTemplateModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan"
                  >
                    <Plus className="w-4 h-4" /> Add Template
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start text-muted-foreground">
                    <thead className="text-xs uppercase text-foreground bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-start">Name</th>
                        <th className="px-6 py-3 text-start">Category</th>
                        <th className="px-6 py-3 text-start">Price</th>
                        <th className="px-6 py-3 text-start">Downloads</th>
                        <th className="px-6 py-3 text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templates?.map((template) => (
                        <tr key={template.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div>{template.name}</div>
                            {template.nameAr && <div className="text-xs text-muted-foreground font-normal">{template.nameAr}</div>}
                          </td>
                          <td className="px-6 py-4">{template.category}</td>
                          <td className="px-6 py-4">
                            {template.price === 0 ? 'Free' : `$${(template.price / 100).toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4">{template.downloads}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button
                              onClick={() => startEditTemplate(template)}
                              className="p-2 text-accent-cyan hover:bg-accent-cyan/10 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={actionLoading === template.id}
                              className="p-2 text-accent-rose hover:bg-accent-rose/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Users Tab */}
            {activeTab === 'users' && (
              <div className="rounded-xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-accent-cyan" />
                  User Database Management
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start text-muted-foreground">
                    <thead className="text-xs uppercase text-foreground bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-start">Name</th>
                        <th className="px-6 py-3 text-start">Email</th>
                        <th className="px-6 py-3 text-start">Role</th>
                        <th className="px-6 py-3 text-start">Joined</th>
                        <th className="px-6 py-3 text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList?.map((usr) => (
                        <tr key={usr.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-6 py-4 font-semibold text-foreground">{usr.name}</td>
                          <td className="px-6 py-4">{usr.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              usr.role === 'admin' ? 'bg-accent-violet/20 text-accent-violet' : 'bg-muted text-muted-foreground'
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">{new Date(usr.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            {usr.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(usr.id)}
                                disabled={actionLoading === usr.id}
                                className="p-2 text-accent-rose hover:bg-accent-rose/10 rounded-lg disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. Licenses Tab */}
            {activeTab === 'licenses' && (
              <div className="rounded-xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <Key className="w-5 h-5 text-accent-cyan" />
                  Licenses Issued Audit Log
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start text-muted-foreground">
                    <thead className="text-xs uppercase text-foreground bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-start">User Email</th>
                        <th className="px-6 py-3 text-start">Product</th>
                        <th className="px-6 py-3 text-start">License Key</th>
                        <th className="px-6 py-3 text-start">Status</th>
                        <th className="px-6 py-3 text-start">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses?.map((lic) => (
                        <tr key={lic.id} className="border-b border-border hover:bg-muted/10">
                          <td className="px-6 py-4">{lic.userEmail}</td>
                          <td className="px-6 py-4 font-semibold text-foreground">{lic.productName}</td>
                          <td className="px-6 py-4 font-mono text-xs select-all">{lic.licenseKey}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              lic.isActive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'
                            }`}>
                              {lic.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleLicense(lic.id, lic.isActive)}
                              disabled={actionLoading === lic.id}
                              className="p-1 text-xs font-semibold rounded bg-muted hover:bg-border transition-colors disabled:opacity-50"
                            >
                              {lic.isActive ? 'Revoke' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Creation / Edition Modal */}
      {(showProductModal || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-2xl glass border border-border space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product (إضافة منتج)'}</h3>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
              {/* Product Names (EN & AR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-cyan">Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. QueryOptimizer AI"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-violet">الاسم بالعربية (Arabic Name)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={productForm.nameAr}
                    onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                    placeholder="مثال: مُحسّن الاستعلامات الذكي"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-violet"
                  />
                </div>
              </div>

              {/* Descriptions (EN & AR) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-cyan">Description (English) *</label>
                  <textarea
                    required
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="English product overview and capabilities..."
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-violet">الوصف بالعربية (Arabic Description)</label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={productForm.descriptionAr}
                    onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })}
                    placeholder="شرح تفصيلي للمنتج ومميزاته باللغة العربية..."
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-violet resize-none"
                  />
                </div>
              </div>

              {/* Badges (EN & AR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Badge (English)</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="e.g. Popular, New, Featured"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">الوسام بالعربية (Arabic Badge)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={productForm.badgeAr}
                    onChange={(e) => setProductForm({ ...productForm, badgeAr: e.target.value })}
                    placeholder="مثال: الأكثر طلباً، جديد، مميز"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-violet"
                  />
                </div>
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                  >
                    <option value="aiAgents">AI Agents</option>
                    <option value="utilities">Utilities</option>
                    <option value="scripts">SQL Scripts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Price (in cents) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Download URL</label>
                <input
                  type="text"
                  value={productForm.downloadUrl}
                  onChange={(e) => setProductForm({ ...productForm, downloadUrl: e.target.value })}
                  placeholder="https://example.com/download-file.zip or #"
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false)
                    setEditingProduct(null)
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Creation / Edition Modal */}
      {(showTemplateModal || editingTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl p-6 rounded-2xl glass border border-border space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{editingTemplate ? 'Edit Template' : 'Add Automation Template (إضافة قالب)'}</h3>
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              {/* Template Names (EN & AR) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-cyan">Template Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. High-Availability Postgres Cluster"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-violet">اسم القالب بالعربية (Arabic Name)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={templateForm.nameAr}
                    onChange={(e) => setTemplateForm({ ...templateForm, nameAr: e.target.value })}
                    placeholder="مثال: عنقود بوستجرس عالي التوافر"
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-violet"
                  />
                </div>
              </div>

              {/* Descriptions (EN & AR) */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-cyan">Description (English) *</label>
                  <textarea
                    required
                    rows={2}
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="English automation template details..."
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-accent-violet">الوصف بالعربية (Arabic Description)</label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={templateForm.descriptionAr}
                    onChange={(e) => setTemplateForm({ ...templateForm, descriptionAr: e.target.value })}
                    placeholder="شرح أتمتة القالب بالعربية ومجالات استخدامه..."
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-violet resize-none"
                  />
                </div>
              </div>

              {/* Compatibilities */}
              <div>
                <label className="block text-xs font-semibold mb-1">Compatibilities (Comma-separated) *</label>
                <input
                  type="text"
                  required
                  value={templateForm.compatibility}
                  onChange={(e) => setTemplateForm({ ...templateForm, compatibility: e.target.value })}
                  placeholder="PostgreSQL 14+, Docker, Linux"
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category *</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="sqlserver">SQL Server</option>
                    <option value="backup">Backup & Recovery</option>
                    <option value="etl">ETL Pipelines</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="devops">DevOps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Price (0 for Free)</label>
                  <input
                    type="number"
                    required
                    value={templateForm.price}
                    onChange={(e) => setTemplateForm({ ...templateForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Download URL */}
              <div>
                <label className="block text-xs font-semibold mb-1">Download URL</label>
                <input
                  type="text"
                  value={templateForm.downloadUrl}
                  onChange={(e) => setTemplateForm({ ...templateForm, downloadUrl: e.target.value })}
                  placeholder="https://example.com/download-template.zip or #"
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-cyan"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
