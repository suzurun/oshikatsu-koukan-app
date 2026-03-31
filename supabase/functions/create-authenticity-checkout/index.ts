import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

/**
 * create-authenticity-checkout
 *
 * 出品者が「AI真贋チェック」を購入するための Stripe Checkout セッションを作成する。
 *
 * 料金設定:
 *   - 出品価格 ¥1万未満: ¥98
 *   - 出品価格 ¥1万以上: ¥198（画像5枚まで・詳細レポート）
 *   - プレミアム会員: 月2回まで無料（本Functionが判定）
 *
 * 実APIコスト: ~1円/回 → 利益率99%
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '認証が必要です' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: '認証が必要です' }, 401)

    const { listingId } = await req.json() as { listingId: string }
    if (!listingId) return json({ error: 'listingId は必須です' }, 400)

    // ─── 出品情報取得 ───────────────────────────────────────────────
    const { data: listing } = await supabase
      .from('listings')
      .select('id, title, asking_price, seller_id, authenticity_purchase_id')
      .eq('id', listingId)
      .single()

    if (!listing) return json({ error: '出品が見つかりません' }, 404)
    if (listing.seller_id !== user.id) return json({ error: '出品者のみ申し込めます' }, 403)
    if (listing.authenticity_purchase_id) return json({ error: 'すでに申し込み済みです' }, 409)

    // ─── プレミアム会員の無料枠チェック ────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('membership_type, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.membership_type === 'premium'

    if (isPremium) {
      // 今月の無料利用回数チェック（月2回まで）
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('authenticity_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['paid', 'checking', 'completed'])

      if ((count ?? 0) < 2) {
        // 無料枠あり → 直接チェックを実行
        const purchase = await supabase
          .from('authenticity_purchases')
          .insert({
            listing_id: listingId,
            seller_id:  user.id,
            status:     'paid',
            fee_amount: 0,
            paid_at:    new Date().toISOString(),
          })
          .select()
          .single()

        if (purchase.data) {
          await supabase
            .from('listings')
            .update({ authenticity_purchase_id: purchase.data.id })
            .eq('id', listingId)

          // 真贋チェック実行（非同期）
          const images = await supabase
            .from('listing_images')
            .select('image_url')
            .eq('listing_id', listingId)
            .order('order_index')
            .limit(5)

          const imageUrls = (images.data ?? []).map((i) => i.image_url as string)
          await supabase.functions.invoke('verify-authenticity', {
            body: { listingId, imageUrls },
          })
        }

        return json({ free: true, remaining: 2 - (count ?? 0) - 1 })
      }
    }

    // ─── 料金決定 ───────────────────────────────────────────────────
    const price = (listing.asking_price as number | null) ?? 0
    const feeAmount = price >= 10000 ? 198 : 98

    // ─── Stripe Checkout セッション作成 ────────────────────────────
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 出品者の Stripe Customer ID を確認
    let customerId = profile?.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode:       'payment',
      customer:   customerId,
      line_items: [{
        price_data: {
          currency:     'jpy',
          unit_amount:  feeAmount,
          product_data: {
            name:        `AI真贋チェック：${String(listing.title).slice(0, 50)}`,
            description: feeAmount === 198
              ? '¥10,000以上の商品向け・画像5枚まで対応・詳細レポート付き'
              : '¥10,000未満の商品向け・標準チェック',
          },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/listings/${listingId}?authenticated=true`,
      cancel_url:  `${appUrl}/listings/${listingId}`,
      metadata: {
        type:       'authenticity_check',
        listing_id: listingId,
        seller_id:  user.id,
        fee_amount: String(feeAmount),
      },
    })

    // ─── 購入レコードを pending で作成 ─────────────────────────────
    const { data: purchase } = await supabase
      .from('authenticity_purchases')
      .insert({
        listing_id:                 listingId,
        seller_id:                  user.id,
        status:                     'pending',
        fee_amount:                 feeAmount,
        stripe_checkout_session_id: session.id,
      })
      .select()
      .single()

    if (purchase) {
      await supabase
        .from('listings')
        .update({ authenticity_purchase_id: purchase.id })
        .eq('id', listingId)
    }

    return json({ checkoutUrl: session.url, feeAmount })
  } catch (err) {
    console.error('create-authenticity-checkout error:', err)
    return json({ error: String(err) }, 500)
  }
})
