import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ─── Webhook 署名検証 ───────────────────────────────────────────
    const signature = req.headers.get('stripe-signature')
    if (!signature) return json({ error: 'No signature' }, 400)

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      )
    } catch {
      return json({ error: 'Invalid signature' }, 400)
    }

    // ─── 冪等性チェック（重複処理防止） ────────────────────────────
    const { data: existing } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single()

    if (existing) return json({ received: true, duplicate: true })

    await supabase.from('stripe_events').insert({
      id:   event.id,
      type: event.type,
      payload: event,
    })

    // ─── イベント処理 ───────────────────────────────────────────────
    switch (event.type) {

      // 決済成功 → デポジット保留状態へ
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const txId = pi.metadata?.transaction_id
        if (!txId) break

        await supabase
          .from('transactions')
          .update({ status: 'deposit_held' })
          .eq('id', txId)
          .eq('status', 'agreed')   // agreed の時のみ更新

        await supabase
          .from('escrow_records')
          .update({ status: 'holding', held_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', pi.id)

        // 双方に通知
        const { data: tx } = await supabase
          .from('transactions')
          .select('seller_id, buyer_id, listings!listing_id(title)')
          .eq('id', txId)
          .single()

        if (tx) {
          const listing = tx.listings as Record<string, unknown> | null
          await supabase.from('notifications').insert([
            {
              user_id: tx.seller_id,
              type: 'transaction_status',
              title: '決済が完了しました',
              body: `「${listing?.title ?? ''}」の決済が完了しました。発送準備をお願いします。`,
              related_entity_id: txId,
              related_entity_type: 'transaction',
            },
            {
              user_id: tx.buyer_id,
              type: 'transaction_status',
              title: '決済が完了しました',
              body: `「${listing?.title ?? ''}」の決済が完了しました。`,
              related_entity_id: txId,
              related_entity_type: 'transaction',
            },
          ])
        }
        break
      }

      // 決済失敗 → 取引キャンセル
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const txId = pi.metadata?.transaction_id
        if (!txId) break

        await supabase
          .from('transactions')
          .update({ status: 'cancelled', cancel_reason: '決済失敗' })
          .eq('id', txId)

        // 出品を active に戻す
        const { data: tx } = await supabase
          .from('transactions')
          .select('listing_id, buyer_id')
          .eq('id', txId)
          .single()

        if (tx) {
          await supabase
            .from('listings')
            .update({ status: 'active' })
            .eq('id', tx.listing_id)

          await supabase.from('notifications').insert({
            user_id: tx.buyer_id,
            type: 'transaction_status',
            title: '決済に失敗しました',
            body: '決済処理に失敗しました。カード情報を確認してください。',
            related_entity_id: txId,
            related_entity_type: 'transaction',
          })
        }
        break
      }

      // エスクロー送金完了（出品者への支払い）
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        const txId = transfer.metadata?.transaction_id
        if (!txId) break

        await supabase
          .from('escrow_records')
          .update({ status: 'released', released_at: new Date().toISOString() })
          .eq('transaction_id', txId)

        const { data: tx } = await supabase
          .from('transactions')
          .select('seller_id, listings!listing_id(title)')
          .eq('id', txId)
          .single()

        if (tx) {
          const listing = tx.listings as Record<string, unknown> | null
          await supabase.from('notifications').insert({
            user_id: tx.seller_id,
            type: 'transaction_status',
            title: '売上金が送金されました',
            body: `「${listing?.title ?? ''}」の売上金が振り込まれます。`,
            related_entity_id: txId,
            related_entity_type: 'transaction',
          })
        }
        break
      }

      // プレミアム解約
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        await supabase
          .from('profiles')
          .update({ membership_type: 'free', premium_expires_at: null })
          .eq('stripe_customer_id', customerId)
        break
      }

      // プレミアム更新
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break

        const customerId = invoice.customer as string
        const periodEnd = new Date((invoice.lines.data[0]?.period?.end ?? 0) * 1000).toISOString()

        await supabase
          .from('profiles')
          .update({ membership_type: 'premium', premium_expires_at: periodEnd })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    return json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return json({ error: String(err) }, 500)
  }
})
