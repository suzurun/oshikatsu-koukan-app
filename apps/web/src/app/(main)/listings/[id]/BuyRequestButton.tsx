'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  listingId: string
  transactionType: string
  price: number | null
  isExchangeOnly: boolean
  isLoggedIn: boolean
}

export function BuyRequestButton({ listingId, transactionType, price, isExchangeOnly, isLoggedIn }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClick() {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }

    startTransition(async () => {
      // 本番ではSupabase RPCで取引申請を作成
      // ここはダミーで成功扱い
      await new Promise(r => setTimeout(r, 800))
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-700 font-bold text-sm">✅ 申請を送りました！</p>
        <p className="text-green-500 text-xs mt-1">出品者の承認をお待ちください。通知でお知らせします。</p>
      </div>
    )
  }

  if (isExchangeOnly || transactionType === 'exchange') {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-60
                   text-white font-black py-4 rounded-xl transition-opacity text-base shadow-md"
      >
        {isPending ? '送信中...' : '🔄 交換を申し込む'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:opacity-90 disabled:opacity-60
                 text-white font-black py-4 rounded-xl transition-opacity text-base shadow-md"
    >
      {isPending
        ? '送信中...'
        : price
          ? `¥${price.toLocaleString()} で購入申請する`
          : '購入を申し込む'}
    </button>
  )
}
