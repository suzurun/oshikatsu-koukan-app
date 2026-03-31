import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const DUMMY_TX = [
  {
    id: 'tx1', type: 'sell',
    itemTitle: 'BTS RM フォトカード Indigo ver.',
    itemImg: 'https://picsum.photos/seed/bts-rm-card/80/80',
    otherUser: 'army_haruka',
    amount: 3500, status: 'shipping', updatedAt: '2026-02-24',
    canReview: false,
  },
  {
    id: 'tx2', type: 'buy',
    itemTitle: 'BTS JIMIN アクリルスタンド Face ver.',
    itemImg: 'https://picsum.photos/seed/bts-jimin/80/80',
    otherUser: 'kpop_mina',
    amount: 2200, status: 'negotiating', updatedAt: '2026-02-23',
    canReview: false,
  },
  {
    id: 'tx3', type: 'exchange',
    itemTitle: 'BTS V タワレコ 特典ポスター',
    itemImg: 'https://picsum.photos/seed/bts-v/80/80',
    otherUser: 'hoshi_fan99',
    amount: 0, status: 'completed', updatedAt: '2026-02-20',
    canReview: true,
  },
  {
    id: 'tx4', type: 'sell',
    itemTitle: 'BTS SUGA 缶バッジ Agust D ver.',
    itemImg: 'https://picsum.photos/seed/bts-suga/80/80',
    otherUser: 'suga_lover',
    amount: 800, status: 'completed', updatedAt: '2026-01-28',
    canReview: false,
  },
]

const STATUS_INFO: Record<string, { label: string; color: string; dot: string }> = {
  requested:   { label: '申請中',   color: 'bg-yellow-100 text-yellow-700',   dot: 'bg-yellow-400' },
  negotiating: { label: '交渉中',   color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400' },
  paid:        { label: '決済済み', color: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-400' },
  shipping:    { label: '発送中',   color: 'bg-sky-100 text-sky-700',         dot: 'bg-sky-400' },
  completed:   { label: '取引完了', color: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-300' },
  cancelled:   { label: 'キャンセル', color: 'bg-red-100 text-red-400',       dot: 'bg-red-300' },
}

const TYPE_LABEL: Record<string, string> = {
  sell: '出品', buy: '購入', exchange: '交換',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const txList = DUMMY_TX

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-[#333333]">取引管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">進行中・完了した取引の一覧</p>
        </div>
        <span className="text-xs bg-sky-100 text-sky-600 font-bold px-2.5 py-1 rounded-full">
          進行中 {txList.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length}件
        </span>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {['すべて', '進行中', '完了'].map((tab, i) => (
          <button key={tab}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors
              ${i === 0 ? 'bg-white text-[#333333] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="space-y-2">
        {txList.map(tx => {
          const si = STATUS_INFO[tx.status] ?? STATUS_INFO.requested
          return (
            <div key={tx.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-sky-200 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">

                {/* サムネ */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={tx.itemImg} alt="" className="w-full h-full object-cover"/>
                </div>

                {/* 中央 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">
                      {TYPE_LABEL[tx.type]}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${si.color}`}>
                      {si.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#333333] truncate">{tx.itemTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">@{tx.otherUser}</span>
                    <span className="text-gray-200">•</span>
                    <span className="text-xs text-gray-400">{tx.updatedAt}</span>
                    <span className="text-gray-200">•</span>
                    <span className={`text-xs font-bold ${tx.amount === 0 ? 'text-rose-500' : 'text-[#333333]'}`}>
                      {tx.amount === 0 ? '¥0 交換' : `¥${tx.amount.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2 mt-3">
                <Link href={`/messages/r1`}
                  className="flex-1 text-center text-xs font-bold py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  メッセージ
                </Link>
                {tx.status === 'completed' && tx.canReview ? (
                  <Link href={`/transactions/${tx.id}/review`}
                    className="flex-1 text-center text-xs font-black py-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                    ★ 評価する
                  </Link>
                ) : tx.status === 'shipping' ? (
                  <button className="flex-1 text-xs font-black py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                    受取確認
                  </button>
                ) : tx.status === 'completed' ? (
                  <span className="flex-1 text-center text-xs py-2 text-gray-400">評価済み</span>
                ) : (
                  <Link href={`/transactions/${tx.id}`}
                    className="flex-1 text-center text-xs font-bold py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                    詳細を見る
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
