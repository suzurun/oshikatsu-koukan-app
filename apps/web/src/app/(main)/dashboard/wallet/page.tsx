import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WithdrawButton } from './WithdrawButton'

const DUMMY_HISTORY = [
  { id: 'h1', type: 'sale',     label: 'BTS RM フォトカード 売上',    amount: 3500,   date: '2026-02-22', status: 'available' },
  { id: 'h2', type: 'fee',      label: '取引手数料 (2%)',              amount: -70,    date: '2026-02-22', status: '' },
  { id: 'h3', type: 'sale',     label: 'BTS V タワレコポスター 売上', amount: 2800,   date: '2026-01-28', status: 'available' },
  { id: 'h4', type: 'fee',      label: '取引手数料 (2%)',              amount: -56,    date: '2026-01-28', status: '' },
  { id: 'h5', type: 'withdraw', label: '振込申請',                     amount: -5000,  date: '2026-01-15', status: 'completed' },
  { id: 'h6', type: 'sale',     label: 'SUGA 缶バッジ 売上',          amount: 800,    date: '2026-01-10', status: 'available' },
  { id: 'h7', type: 'fee',      label: '取引手数料 (2%)',              amount: -16,    date: '2026-01-10', status: '' },
]

const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  sale:     { icon: '💰', color: 'text-green-600', bg: 'bg-green-50' },
  fee:      { icon: '📋', color: 'text-gray-400',  bg: 'bg-gray-50' },
  withdraw: { icon: '🏦', color: 'text-blue-600',  bg: 'bg-blue-50' },
  deposit:  { icon: '➕', color: 'text-sky-600',   bg: 'bg-sky-50' },
}

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 本番: wallets テーブルから取得
  const balance    = 6958   // 引き出し可能残高
  const pending    = 3500   // 取引中（まだ引き出し不可）
  const totalEarned = 16800

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">ウォレット</h1>
          <p className="text-xs text-gray-400">売上金の管理・振込申請</p>
        </div>
      </div>

      {/* 残高カード */}
      <div className="relative bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 rounded-3xl p-6 overflow-hidden text-white">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
        <div className="absolute bottom-0 left-16 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium mb-1">引き出し可能残高</p>
          <p className="text-4xl font-black mb-1">¥{balance.toLocaleString()}</p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-white/60 text-[11px]">取引中（保留）</p>
              <p className="text-white font-bold text-sm">¥{pending.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-white/20"/>
            <div>
              <p className="text-white/60 text-[11px]">累計売上</p>
              <p className="text-white font-bold text-sm">¥{totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 振込申請ボタン */}
      <WithdrawButton balance={balance} />

      {/* 振込スケジュール */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-sky-700 mb-2">振込スケジュール</p>
        <div className="space-y-1 text-xs text-sky-600">
          <p>• 次回振込日：<strong>2026年3月15日（土）</strong></p>
          <p>• 申請締切：3月13日（木）23:59まで</p>
          <p>• 振込手数料：¥200（¥10,000以上は無料）</p>
        </div>
        {!true && (
          <Link href="/dashboard/settings/bank"
            className="inline-block mt-3 text-xs bg-sky-500 text-white font-bold px-3 py-1.5 rounded-full hover:bg-sky-600 transition-colors">
            口座を登録する
          </Link>
        )}
      </div>

      {/* クイックリンク */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/settings/bank"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#333333]">振込口座</p>
            <p className="text-[11px] text-gray-400">三菱UFJ 〇〇支店</p>
          </div>
        </Link>
        <Link href="/transactions"
          className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm transition-all">
          <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#333333]">取引管理</p>
            <p className="text-[11px] text-gray-400">進行中 3件</p>
          </div>
        </Link>
      </div>

      {/* 取引履歴 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">入出金履歴</h2>
          <span className="text-xs text-gray-400">{DUMMY_HISTORY.length}件</span>
        </div>
        <div className="divide-y divide-gray-50">
          {DUMMY_HISTORY.map(item => {
            const t = TYPE_ICON[item.type] ?? TYPE_ICON.sale
            const isNeg = item.amount < 0
            return (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-9 h-9 rounded-full ${t.bg} flex items-center justify-center flex-shrink-0 text-base`}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#333333] truncate">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${isNeg ? 'text-gray-400' : 'text-green-600'}`}>
                  {isNeg ? '-' : '+'}¥{Math.abs(item.amount).toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}



