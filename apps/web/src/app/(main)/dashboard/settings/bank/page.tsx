'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

const BANKS = [
  '三菱UFJ銀行', '三井住友銀行', 'みずほ銀行', 'りそな銀行',
  'ゆうちょ銀行', '楽天銀行', 'PayPay銀行', 'SBI新生銀行',
  'auじぶん銀行', 'セブン銀行', 'その他',
]
const ACCOUNT_TYPES = [
  { value: 'savings', label: '普通' },
  { value: 'checking', label: '当座' },
]

export default function BankSettingsPage() {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    bank_name: '',
    branch_name: '',
    account_type: 'savings',
    account_number: '',
    account_holder: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // 本番：Supabase profiles テーブルに bank_info を保存
      await new Promise(r => setTimeout(r, 800))
      setSaved(true)
    })
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">振込口座の登録</h1>
          <p className="text-xs text-gray-400">売上金の受取口座を設定します</p>
        </div>
      </div>

      {/* 注意バナー */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex gap-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div>
          <p className="text-xs font-bold text-amber-700">入力内容にご注意ください</p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            口座情報は暗号化して安全に保管されます。誤った情報を登録すると振込が失敗します。
          </p>
        </div>
      </div>

      {saved && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <p className="text-sm text-green-700 font-medium">口座情報を保存しました</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">金融機関情報</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">銀行名 <span className="text-rose-400">*</span></label>
            <select
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            >
              <option value="">選択してください</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">支店名 <span className="text-rose-400">*</span></label>
            <input
              name="branch_name"
              value={form.branch_name}
              onChange={handleChange}
              required
              placeholder="例：渋谷支店"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">口座種別</label>
            <div className="flex gap-3">
              {ACCOUNT_TYPES.map(t => (
                <label key={t.value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors
                    ${form.account_type === t.value ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="account_type" value={t.value} checked={form.account_type === t.value} onChange={handleChange} className="sr-only"/>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${form.account_type === t.value ? 'border-sky-500' : 'border-gray-300'}`}>
                    {form.account_type === t.value && <div className="w-2 h-2 rounded-full bg-sky-500"/>}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">口座番号 <span className="text-rose-400">*</span></label>
            <input
              name="account_number"
              value={form.account_number}
              onChange={handleChange}
              required
              maxLength={8}
              placeholder="1234567"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 tracking-widest"
            />
            <p className="text-[11px] text-gray-400 mt-1">数字のみ・7桁</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">口座名義（カタカナ） <span className="text-rose-400">*</span></label>
            <input
              name="account_holder"
              value={form.account_holder}
              onChange={handleChange}
              required
              placeholder="例：ヤマダ ハナコ"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 tracking-wide"
            />
            <p className="text-[11px] text-gray-400 mt-1">カタカナ・スペース区切り</p>
          </div>
        </div>

        {/* 振込スケジュール案内 */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-sky-700">振込スケジュール</p>
          <div className="space-y-1 text-xs text-sky-600">
            <p>• 取引完了後、売上金がウォレットに反映</p>
            <p>• 毎月15日・月末に申請分を翌営業日に振込</p>
            <p>• 振込手数料：¥200（¥10,000以上は無料）</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || saved}
          className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-60
                     text-white font-black py-3.5 rounded-xl transition-opacity text-sm shadow-md"
        >
          {isPending ? '保存中...' : '口座情報を登録する'}
        </button>
      </form>
    </div>
  )
}



