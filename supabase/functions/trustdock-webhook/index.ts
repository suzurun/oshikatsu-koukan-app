import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { encode } from 'https://deno.land/std@0.168.0/encoding/hex.ts'

serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ─── TRUSTDOCK 署名検証 ─────────────────────────────────────────
    // TRUSTDOCK は X-Trustdock-Signature ヘッダーで HMAC-SHA256 を送付
    const signature = req.headers.get('x-trustdock-signature')
    const body = await req.text()

    if (signature) {
      const secret = Deno.env.get('TRUSTDOCK_WEBHOOK_SECRET')
      if (secret) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        )
        const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
        const expected = new TextDecoder().decode(encode(new Uint8Array(mac)))
        if (signature !== expected) {
          return json({ error: 'Invalid signature' }, 400)
        }
      }
    }

    const event = JSON.parse(body) as {
      event:           string        // 'verification_completed' | 'verification_failed'
      verification_id: string        // TRUSTDOCK 審査ID
      result:          'approved' | 'rejected' | 'expired'
      user_id?:        string        // TRUSTDOCK側ユーザーID（任意）
      reason?:         string        // 否認理由
    }

    // ─── 対象の kyc_record 取得 ────────────────────────────────────
    const { data: kycRecord, error: kycErr } = await supabase
      .from('kyc_records')
      .select('id, user_id, status')
      .eq('external_kyc_id', event.verification_id)
      .single()

    if (kycErr || !kycRecord) {
      console.warn('kyc_record not found for verification_id:', event.verification_id)
      return json({ received: true, warning: 'record not found' })
    }

    // 既に最終ステータスなら冪等で返す
    if (kycRecord.status === 'approved' || kycRecord.status === 'rejected') {
      return json({ received: true, duplicate: true })
    }

    // ─── kyc_record ステータス更新 ─────────────────────────────────
    const newStatus = event.result === 'approved' ? 'approved' : 'rejected'

    await supabase
      .from('kyc_records')
      .update({
        status:     newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', kycRecord.id)

    // ─── 承認時: kyc_required 取引を requested へ昇格 ──────────────
    if (newStatus === 'approved') {
      const { data: pendingTxs } = await supabase
        .from('transactions')
        .select('id, listing_id')
        .eq('buyer_id', kycRecord.user_id)
        .eq('status', 'kyc_required')

      if (pendingTxs && pendingTxs.length > 0) {
        await supabase
          .from('transactions')
          .update({ status: 'requested' })
          .in('id', pendingTxs.map((t) => t.id))
      }

      // ユーザーへ承認通知
      await supabase.from('notifications').insert({
        user_id:    kycRecord.user_id,
        type:       'kyc_approved',
        title:      '本人確認が完了しました',
        body:       'eKYCが承認されました。3万円以上の取引が可能になりました。',
        related_entity_type: 'kyc',
      })
    } else {
      // 否認: 出品を active に戻し、取引をキャンセル
      const { data: pendingTxs } = await supabase
        .from('transactions')
        .select('id, listing_id')
        .eq('buyer_id', kycRecord.user_id)
        .eq('status', 'kyc_required')

      if (pendingTxs && pendingTxs.length > 0) {
        await supabase
          .from('transactions')
          .update({ status: 'cancelled', cancel_reason: 'KYC否認' })
          .in('id', pendingTxs.map((t) => t.id))

        await supabase
          .from('listings')
          .update({ status: 'active' })
          .in('id', pendingTxs.map((t) => t.listing_id))
      }

      // ユーザーへ否認通知
      await supabase.from('notifications').insert({
        user_id:    kycRecord.user_id,
        type:       'kyc_approved',    // type カラムは既存 ENUM に合わせる
        title:      '本人確認が否認されました',
        body:       `eKYC審査が否認されました。${event.reason ? `理由: ${event.reason}` : '再度お試しください。'}`,
        related_entity_type: 'kyc',
      })
    }

    return json({ received: true, status: newStatus })
  } catch (err) {
    console.error('TRUSTDOCK webhook error:', err)
    return json({ error: String(err) }, 500)
  }
})
