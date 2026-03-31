'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@oshikatsu/api-client'

interface Props {
  transactionId: string
  status: string
  isSeller: boolean
  isBuyer: boolean
  sellerShippingReady: boolean
  buyerShippingReady: boolean
}

export function TransactionActions({
  transactionId, status, isSeller, isBuyer,
  sellerShippingReady, buyerShippingReady,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDisputeConfirm, setShowDisputeConfirm] = useState(false)

  async function invoke(action: string) {
    setLoading(true)
    setError('')
    try {
      const { error: fnError } = await supabase.functions.invoke('transaction-action', {
        body: { transactionId, action },
      })
      if (fnError) throw fnError
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const myShippingReady = isSeller ? sellerShippingReady : buyerShippingReady
  const canShippingReady = (status === 'agreed' || status === 'deposit_held') && !myShippingReady
  const canConfirmReceipt = isBuyer && (
    status === 'shipped_by_seller' || status === 'both_shipped' || status === 'delivered'
  )
  const canCancel = status === 'requested' || (status === 'agreed' && isSeller)
  const canDispute = isBuyer && (
    status === 'shipped_by_seller' || status === 'both_shipped' || status === 'delivered'
  )

  if (!canShippingReady && !canConfirmReceipt && !canCancel && !canDispute) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-500 text-center">
        相手のアクション待ちです
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* 発送準備OK */}
      {canShippingReady && (
        <button
          onClick={() => invoke('shipping_ready')}
          disabled={loading}
          className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50
                     text-white font-bold rounded-xl transition-colors"
        >
          {loading ? '処理中...' : '発送準備OK ✓'}
        </button>
      )}

      {myShippingReady && (status === 'agreed' || status === 'deposit_held') && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-700 text-center">
          発送準備OKを送信済み。相手の確認待ちです。
        </div>
      )}

      {/* 受取確認 */}
      {canConfirmReceipt && (
        <button
          onClick={() => invoke('confirm_receipt')}
          disabled={loading}
          className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-50
                     text-white font-bold rounded-xl transition-colors"
        >
          {loading ? '処理中...' : '受取確認 → 取引完了'}
        </button>
      )}

      {/* キャンセル */}
      {canCancel && !showCancelConfirm && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          disabled={loading}
          className="w-full py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50
                     rounded-xl text-sm transition-colors"
        >
          キャンセルする
        </button>
      )}
      {showCancelConfirm && (
        <div className="border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-red-600 font-medium text-center">本当にキャンセルしますか？</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
            >
              戻る
            </button>
            <button
              onClick={() => invoke('cancel')}
              disabled={loading}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {loading ? '処理中...' : 'キャンセルする'}
            </button>
          </div>
        </div>
      )}

      {/* 紛争申立 */}
      {canDispute && !showDisputeConfirm && (
        <button
          onClick={() => setShowDisputeConfirm(true)}
          disabled={loading}
          className="w-full py-2 text-red-400 hover:text-red-600 text-sm underline transition-colors"
        >
          問題を報告（紛争申立）
        </button>
      )}
      {showDisputeConfirm && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-red-700 font-medium">紛争を申立しますか？</p>
          <p className="text-xs text-red-500">運営チームが確認し、エスクロー資金を保護します。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDisputeConfirm(false)}
              className="flex-1 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600"
            >
              戻る
            </button>
            <button
              onClick={() => invoke('dispute')}
              disabled={loading}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {loading ? '処理中...' : '申立する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
