import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { TransactionActions } from './TransactionActions'

interface TransactionPageProps {
  params: Promise<{ id: string }>
}

const STATUS_STEPS = [
  { key: 'requested',         label: '申請',       desc: '購入申請が送られました' },
  { key: 'agreed',            label: '合意',       desc: '出品者が承認しました' },
  { key: 'deposit_held',      label: '決済',       desc: 'エスクロー決済が完了しました' },
  { key: 'shipping_unlocked', label: '発送解禁',   desc: '双方が発送準備OKを確認しました' },
  { key: 'delivered',         label: '配達',       desc: '商品が到着しました' },
  { key: 'completed',         label: '完了',       desc: '取引が完了しました' },
]

const STATUS_ORDER = [
  'requested', 'agreed', 'kyc_required', 'deposit_held',
  'shipping_unlocked', 'shipped_by_seller', 'shipped_by_buyer', 'both_shipped',
  'delivered', 'receipt_confirmed', 'completed',
]

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

export default async function TransactionDetailPage({ params }: TransactionPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tx } = await supabase
    .from('transactions')
    .select(`
      *,
      listings!listing_id(id, title, primary_image_url, description, condition),
      seller:profiles!seller_id(id, display_name, avatar_url),
      buyer:profiles!buyer_id(id, display_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!tx) notFound()

  const isSeller = tx.seller_id === user.id
  const isBuyer  = tx.buyer_id  === user.id
  if (!isSeller && !isBuyer) redirect('/transactions')

  const status    = String(tx.status ?? 'requested')
  const stepIdx   = getStepIndex(status)
  const isClosed  = ['completed', 'cancelled', 'auto_cancelled', 'disputed', 'dispute_resolved'].includes(status)
  const listing   = tx.listings as Record<string, unknown> | null
  const seller    = tx.seller  as Record<string, unknown> | null
  const buyer     = tx.buyer   as Record<string, unknown> | null

  const partnerName = isSeller
    ? String(buyer?.display_name ?? '購入者')
    : String(seller?.display_name ?? '出品者')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* 商品サマリー */}
      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4">
        <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {listing?.primary_image_url ? (
            <img src={String(listing.primary_image_url)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{String(listing?.title ?? '商品名なし')}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {isSeller ? `購入者: ${partnerName}` : `出品者: ${partnerName}`}
          </p>
          {tx.agreed_price && (
            <p className="text-sm font-bold text-primary-600 mt-0.5">
              ¥{(tx.agreed_price as number).toLocaleString()}
            </p>
          )}
        </div>
        <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full flex-shrink-0">
          {isSeller ? '出品者' : '購入者'}
        </span>
      </div>

      {/* ステータスタイムライン */}
      {!isClosed && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-4">取引ステップ</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const stepOrderIdx = getStepIndex(step.key)
              const done    = stepIdx > stepOrderIdx
              const current = stepIdx === stepOrderIdx ||
                (i < STATUS_STEPS.length - 1 && stepIdx > stepOrderIdx &&
                  getStepIndex(STATUS_STEPS[i + 1]?.key ?? '') > stepIdx)
              const active  = done || current

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 transition-colors
                      ${done    ? 'bg-green-500 border-green-500 text-white'
                      : current ? 'bg-primary-500 border-primary-500 text-white'
                      :           'bg-white border-gray-200 text-gray-300'}`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-0.5 ${done ? 'bg-green-300' : 'bg-gray-100'}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-300'}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${active ? 'text-gray-500' : 'text-gray-300'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 終了状態バナー */}
      {isClosed && (
        <div className={`rounded-2xl p-4 text-center font-semibold
          ${status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200'
          : status === 'disputed'  ? 'bg-red-50 text-red-700 border border-red-200'
          :                          'bg-gray-50 text-gray-500 border border-gray-200'}`}>
          {status === 'completed'        && '✅ 取引が完了しました'}
          {status === 'cancelled'        && '取引はキャンセルされました'}
          {status === 'auto_cancelled'   && '取引は自動キャンセルされました'}
          {status === 'disputed'         && '⚠️ 紛争申立が受付されました。運営が確認中です。'}
          {status === 'dispute_resolved' && '紛争が解決されました'}
        </div>
      )}

      {/* 発送期限 */}
      {tx.shipping_deadline && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
          ⏰ 発送期限: {new Date(String(tx.shipping_deadline)).toLocaleString('ja-JP')}
        </div>
      )}

      {/* アクションボタン */}
      {!isClosed && (
        <TransactionActions
          transactionId={id}
          status={status}
          isSeller={isSeller}
          isBuyer={isBuyer}
          sellerShippingReady={Boolean(tx.seller_shipping_ready)}
          buyerShippingReady={Boolean(tx.buyer_shipping_ready)}
        />
      )}

    </div>
  )
}
