// ============================================================
// @oshikatsu/types - 共通TypeScript型定義
// ============================================================
// NOTE: database.types.ts は `npm run db:types` で自動生成される
// ============================================================

// --- ENUMミラー型 -------------------------------------------

export type UserStatus =
  | 'active'
  | 'suspended_24h'
  | 'suspended_7d'
  | 'suspended'
  | 'banned'
  | 'deactivated'

export type MembershipType = 'free' | 'premium'

export type KycStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'

export type AccountType = 'independent' | 'parent' | 'child'

export type ListingStatus =
  | 'draft'
  | 'ai_checking'
  | 'active'
  | 'reserved'
  | 'sold'
  | 'withdrawn'
  | 'removed'

export type TransactionType = 'sale' | 'exchange' | 'local_exchange'

export type TransactionStatus =
  | 'requested'
  | 'agreed'
  | 'kyc_required'
  | 'deposit_held'
  | 'shipping_unlocked'
  | 'shipped_by_seller'
  | 'shipped_by_buyer'
  | 'both_shipped'
  | 'delivered'
  | 'receipt_confirmed'
  | 'completed'
  | 'cancelled'
  | 'auto_cancelled'
  | 'disputed'
  | 'dispute_resolved'

export type DisputeReason =
  | 'item_not_received'
  | 'item_not_as_described'
  | 'counterfeit'
  | 'damaged'
  | 'wrong_item'
  | 'seller_non_responsive'
  | 'other'

export type RarityLabel = 'common' | 'uncommon' | 'rare' | 'super_rare'

export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type NotificationType =
  | 'price_alert'
  | 'transaction_status'
  | 'match_request'
  | 'match_accepted'
  | 'shipping_reminder'
  | 'auto_cancel_warning'
  | 'receipt_reminder'
  | 'dispute_update'
  | 'kyc_result'
  | 'credit_score_change'
  | 'moderation_action'
  | 'system'

// --- ドメインモデル -----------------------------------------

export interface Profile {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  bio: string | null
  favoriteArtists: string[]
  accountType: AccountType
  parentId: string | null
  membershipType: MembershipType
  premiumExpiresAt: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface CreditScore {
  userId: string
  score: number            // 0〜100
  totalTransactions: number
  completedTransactions: number
  depositAmount: number    // 円
  canTrade: boolean
  dailyMatchLimit: number  // 当日モード上限
}

export interface Listing {
  id: string
  sellerId: string
  title: string
  description: string
  categoryId: string
  price: number | null
  isExchangeOnly: boolean
  exchangeDescription: string | null
  condition: string
  status: ListingStatus
  transactionType: TransactionType
  artistName: string | null
  eventId: string | null
  viewCount: number
  wishlistCount: number
  primaryImageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AiPriceAnalysis {
  listingId: string
  suggestedPrice: number | null
  earlyBirdPrice: number | null
  premiumPrice: number | null
  rarityScore: number       // 0〜100
  rarityLabel: RarityLabel
  demandForecast30d: number // 推定需要人数
  priceTrend: 'rising' | 'stable' | 'falling' | null
  confidenceScore: number   // 0〜1
  analyzedAt: string
}

export interface MarketPriceData {
  listingId: string
  platform: string
  price: number
  currency: string
  soldAt: string | null
  listedAt: string
  url: string | null
}

export interface Transaction {
  id: string
  sellerId: string
  buyerId: string
  listingId: string
  exchangeListingId: string | null
  transactionType: TransactionType
  status: TransactionStatus
  agreedPrice: number | null
  depositAmount: number
  shippingDeadline: string | null
  createdAt: string
  updatedAt: string
}

export interface EscrowRecord {
  transactionId: string
  stripePaymentIntentId: string
  amount: number
  currency: string
  status: 'holding' | 'released' | 'refunded' | 'forfeited'
  heldAt: string
  releasedAt: string | null
}

// --- API レスポンス型 ----------------------------------------

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// --- AI価格分析リクエスト/レスポンス -----------------------

export interface PriceAnalysisRequest {
  imageUrl: string
  categoryId?: string
  condition?: string
  artistName?: string
  eventId?: string
}

export interface PriceAnalysisResponse {
  productName: string
  categoryGuess: string
  conditionScore: number
  analysis: AiPriceAnalysis
  marketData: MarketPriceData[]
}
