import { createClient } from '@supabase/supabase-js'
import type {
  Listing,
  Transaction,
  PriceAnalysisRequest,
  PriceAnalysisResponse,
  PaginatedResponse,
  ApiResponse,
} from '@oshikatsu/types'

// ============================================================
// Supabaseクライアント初期化
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// 出品 API
// ============================================================

export async function fetchActiveListings(
  page = 1,
  limit = 20,
  categoryId?: string,
): Promise<PaginatedResponse<Listing>> {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('v_active_listings')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: (data ?? []) as unknown as Listing[],
    total: count ?? 0,
    page,
    limit,
    hasMore: (count ?? 0) > to + 1,
  }
}

export async function fetchListingById(id: string): Promise<ApiResponse<Listing>> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles!seller_id(display_name, avatar_url, username),
      listing_images(*),
      ai_price_analyses(*),
      credit_scores!seller_id(score, can_trade)
    `)
    .eq('id', id)
    .single()

  return { data: data as unknown as Listing, error: error?.message ?? null }
}

export async function createListing(
  payload: Partial<Listing>,
): Promise<ApiResponse<Listing>> {
  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select()
    .single()

  return { data: data as unknown as Listing, error: error?.message ?? null }
}

// ============================================================
// ウィッシュリスト API
// ============================================================

export async function toggleWishlist(listingId: string): Promise<{ added: boolean }> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('ログインが必要です')

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.user.id)
    .eq('listing_id', listingId)
    .single()

  if (existing) {
    await supabase.from('wishlists').delete().eq('id', existing.id)
    return { added: false }
  } else {
    await supabase.from('wishlists').insert({ user_id: user.user.id, listing_id: listingId })
    return { added: true }
  }
}

// ============================================================
// 取引 API
// ============================================================

export async function requestTransaction(
  listingId: string,
  type: 'sale' | 'exchange',
  exchangeListingId?: string,
): Promise<ApiResponse<Transaction>> {
  const { data, error } = await supabase.functions.invoke('create-transaction', {
    body: { listingId, type, exchangeListingId },
  })

  return { data: data as Transaction, error: error?.message ?? null }
}

export async function confirmShippingReady(transactionId: string): Promise<ApiResponse<null>> {
  const { data, error } = await supabase.functions.invoke('transaction-action', {
    body: { transactionId, action: 'shipping_ready' },
  })

  return { data, error: error?.message ?? null }
}

export async function confirmReceipt(transactionId: string): Promise<ApiResponse<null>> {
  const { data, error } = await supabase.functions.invoke('transaction-action', {
    body: { transactionId, action: 'confirm_receipt' },
  })

  return { data, error: error?.message ?? null }
}

// ============================================================
// AI価格分析 API
// ============================================================

export async function analyzePrice(
  req: PriceAnalysisRequest,
): Promise<ApiResponse<PriceAnalysisResponse>> {
  const { data, error } = await supabase.functions.invoke('analyze-price', {
    body: req,
  })

  return { data: data as PriceAnalysisResponse, error: error?.message ?? null }
}

// ============================================================
// 認証ヘルパー
// ============================================================

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export { createClient } from '@supabase/supabase-js'
