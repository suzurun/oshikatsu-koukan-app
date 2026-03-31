'use client'

import { useState, useTransition } from 'react'

export function WithdrawButton({ balance }: { balance: number }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState(String(balance))
  const fee = Number(amount) >= 10000 ? 0 : 200
  const net = Math.max(0, Number(amount) - fee)

  const handleWithdraw = () => {
    startTransition(async () => {
      await new Promise(r => setTimeout(r, 1000))
      setDone(true)
      setShowModal(false)
    })
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-green-700 font-bold text-sm">✅ 振込申請を受け付けました</p>
        <p className="text-green-500 text-xs mt-1">次回振込日（3月15日）に指定口座へお振込みします</p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={balance <= 0}
        className="w-full bg-gradient-to-r from-green-400 to-teal-500 hover:opacity-90 disabled:opacity-40
                   text-white font-black py-4 rounded-2xl transition-opacity text-sm shadow-md"
      >
        {balance <= 0 ? '振込できる残高がありません' : `¥${balance.toLocaleString()} を振込申請する`}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#333333]">振込申請</h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">申請金額</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  max={balance}
                  min={1}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">最大：¥{balance.toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>申請額</span>
                <span>¥{Number(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>振込手数料</span>
                <span>{fee === 0 ? '無料' : `-¥${fee}`}</span>
              </div>
              <div className="flex justify-between font-black text-[#333333] pt-1.5 border-t border-gray-200">
                <span>お受け取り額</span>
                <span>¥{net.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
              <button onClick={handleWithdraw} disabled={isPending || Number(amount) <= 0 || Number(amount) > balance}
                className="flex-1 py-3 bg-gradient-to-r from-green-400 to-teal-500 hover:opacity-90 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-opacity">
                {isPending ? '申請中...' : '申請する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



