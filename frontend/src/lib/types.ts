export type Role = 'USER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

export type ProductCategory = 'workflow' | 'script' | 'code' | 'agentic'

export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Product {
  id: string
  name: string
  nameAr?: string | null
  description: string
  descriptionAr?: string | null
  category: ProductCategory
  price: number // integer cents ($49.00 = 4900)
  version?: string
  status?: ProductStatus
  badge?: string | null
  badgeAr?: string | null
  displayName?: string
  displayDescription?: string
  displayBadge?: string | null
  sellerId: string
  sellerName?: string | null
  fileExtension?: string | null
  publishedAt?: string | null
  seller?: {
    id: string
    name: string
  }
  fileKey?: string | null
  fileSize?: number | null
  fileMime?: string | null
  fileChecksum?: string | null
  rejectionNote?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface License {
  id: string
  productId: string
  licenseKey: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  productName: string
  productNameAr: string | null
}

export interface Order {
  id: string
  userId?: string
  productId?: string | null
  productName?: string | null
  fileExtension?: string | null
  amount: number // integer cents
  commissionPercent: number // e.g. 10
  commissionAmount: number // integer cents (platform fee)
  sellerAmount: number // integer cents (seller net payout)
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  paymentGateway?: string
  createdAt: string
  updatedAt?: string
  product?: Product
}

export interface SellerSale {
  orderId: string
  productId: string
  productName: string
  productNameAr?: string | null
  amount: number
  commissionPercent: number
  commissionAmount: number
  sellerAmount: number
  createdAt: string
}

export interface MarketplaceInsights {
  uploads: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  orders: {
    total: number
    totalRevenue: number
    totalCommission: number
    totalSellerPayouts: number
  }
  sellers: {
    total: number
  }
  topProducts: Array<{
    productId: string
    productName: string
    salesCount: number
  }>
}

export interface UserInsights {
  totalUsers: number
  newUsers: number
  period: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  statusCode?: number
  message?: string
  data: T
  errors?: Array<{ field?: string; message: string }> | string[]
}
