import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

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
    const { listingId, type, exchangeListingId } = await req.json() as {
      listingId: string
      type: 'sale' | 'exchange'
      exchangeListingId?: string
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '認証が必要です' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    // ─── 認証ユーザー取得 ───────────────────────────────────────────
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: '認証が必要です' }, 401)

    // ─── 出品データ取得 ─────────────────────────────────────────────
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('*, profiles!seller_id(id, display_name, stripe_customer_id)')
      .eq('id', listingId)
      .single()

    if (listingErr || !listing) return json({ error: '出品が見つかりません' }, 404)
    if (listing.status !== 'active')  return json({ error: 'この出品は現在取引できません' }, 409)
    if (listing.seller_id === user.id) return json({ error: '自分の出品には申請できません' }, 400)

    // ─── 信用スコアチェック ─────────────────────────────────────────
    const { data: creditScore } = await supabase
      .from('credit_scores')
      .select('can_trade, deposit_amount, score')
      .eq('user_id', user.id)
      .single()

    if (creditScore && !creditScore.can_trade) {
      return json({ error: '信用スコアが低いため取引できません（スコア20%未満）' }, 403)
    }

    // ─── KYC チェック ───────────────────────────────────────────────
    const { data: kyc } = await supabase
      .from('kyc_records')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const kycApproved = kyc?.status === 'approved'
    const agreedPrice = listing.asking_price as number | null

    // ─── 重複申請チェック ───────────────────────────────────────────
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('listing_id', listingId)
      .not('status', 'in', '(completed,cancelled,auto_cancelled,disputed,dispute_resolved)')
      .limit(1)
      .single()

    if (existing) return json({ error: 'この出品は現在他のユーザーと取引中です' }, 409)

    // ─── デポジット額決定 ───────────────────────────────────────────
    const depositAmount = (creditScore?.deposit_amount as number | null) ?? 500

    // ─── 取引ステータス決定 ─────────────────────────────────────────
    // 3万円超かつ KYC 未承認 → kyc_required
    const initialStatus = (!kycApproved && agreedPrice && agreedPrice >= 30000)
      ? 'kyc_required'
      : 'requested'

    // ─── トランザクション開始: listings → reserved, transactions → INSERT ─
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        seller_id:           listing.seller_id,
        buyer_id:            user.id,
        listing_id:          listingId,
        exchange_listing_id: exchangeListingId ?? null,
        transaction_type:    type,
        status:              initialStatus,
        agreed_price:        agreedPrice,
        deposit_amount:      depositAmount,
      })
      .select()
      .single()

    if (txErr || !tx) throw txErr ?? new Error('取引の作成に失敗しました')

    // 出品を reserved に更新
    await supabase
      .from('listings')
      .update({ status: 'reserved' })
      .eq('id', listingId)

    // ─── Stripe Payment Intent 作成（sale かつ 価格あり） ──────────
    let stripePaymentIntentId: string | null = null

    if (type === 'sale' && agreedPrice && agreedPrice > 0 && initialStatus === 'requested') {
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
          apiVersion: '2024-06-20',
          httpClient: Stripe.createFetchHttpClient(),
        })

        // 購入者の Stripe Customer ID を取得または作成
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('stripe_customer_id, display_name')
          .eq('id', user.id)
          .single()

        let customerId = buyerProfile?.stripe_customer_id as string | null
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: String(buyerProfile?.display_name ?? ''),
            metadata: { supabase_uid: user.id },
          })
          customerId = customer.id
          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id)
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount:   agreedPrice + depositAmount,        // 商品代金 + デポジット
          currency: 'jpy',
          customer: customerId,
          capture_method: 'manual',                    // エスクロー: 手動キャプチャ
          metadata: {
            transaction_id: String(tx.id),
            listing_id:     listingId,
            buyer_id:       user.id,
            seller_id:      listing.seller_id,
          },
          description: `推し活マーケット: ${listing.title}`,
        })

        stripePaymentIntentId = paymentIntent.id

        // エスクローレコード作成
        await supabase.from('escrow_records').insert({
          transaction_id:          tx.id,
          stripe_payment_intent_id: paymentIntent.id,
          amount:                  agreedPrice + depositAmount,
          currency:                'JPY',
          status:                  'holding',
        })
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr)
        // Stripe エラーは取引自体をキャンセル
        await supabase
          .from('transactions')
          .update({ status: 'cancelled' })
          .eq('id', tx.id)
        await supabase
          .from('listings')
          .update({ status: 'active' })
          .eq('id', listingId)
        return json({ error: '決済の準備中にエラーが発生しました' }, 500)
      }
    }

    // ─── 出品者へ通知 ───────────────────────────────────────────────
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    await supabase.from('notifications').insert({
      user_id:           listing.seller_id,
      type:              'match_request',
      title:             '購入申請が届きました',
      body:              `${buyerProfile?.display_name ?? 'ユーザー'}さんから「${listing.title}」への申請が届きました`,
      related_entity_id: tx.id,
      related_entity_type: 'transaction',
    })

    return json({
      id:                     tx.id,
      status:                 tx.status,
      stripe_payment_intent_id: stripePaymentIntentId,
    })
  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
})
