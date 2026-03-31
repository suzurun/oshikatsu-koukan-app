import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'shipping_ready' | 'confirm_receipt' | 'cancel' | 'dispute'

const ACTION_STATUS_MAP: Record<Action, string> = {
  shipping_ready: 'shipping_unlocked',
  confirm_receipt: 'receipt_confirmed',
  cancel: 'cancelled',
  dispute: 'disputed',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId, action }: { transactionId: string; action: Action } = await req.json()

    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader! } } },
    )

    // 認証ユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '認証が必要です' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // 取引を取得して権限確認
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !tx) {
      return new Response(JSON.stringify({ error: '取引が見つかりません' }), {
        status: 404,
        headers: corsHeaders,
      })
    }

    const isSeller = tx.seller_id === user.id
    const isBuyer = tx.buyer_id === user.id

    if (!isSeller && !isBuyer) {
      return new Response(JSON.stringify({ error: '権限がありません' }), {
        status: 403,
        headers: corsHeaders,
      })
    }

    const newStatus = ACTION_STATUS_MAP[action]
    if (!newStatus) {
      return new Response(JSON.stringify({ error: '無効なアクション' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // ステータス更新
    const updateData: Record<string, unknown> = { status: newStatus }

    if (action === 'shipping_ready') {
      // 双方準備OKの場合のみ shipping_unlocked へ遷移
      const sellerReady = isSeller ? true : tx.seller_shipping_ready
      const buyerReady = isBuyer ? true : tx.buyer_shipping_ready

      await supabase.from('transactions').update({
        seller_shipping_ready: sellerReady,
        buyer_shipping_ready: buyerReady,
      }).eq('id', transactionId)

      if (!sellerReady || !buyerReady) {
        return new Response(
          JSON.stringify({ message: '発送準備OKを記録しました。相手の確認待ちです。' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // 双方揃ったので発送期限を設定（72時間後）
      const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      updateData.shipping_deadline = deadline
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, newStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
