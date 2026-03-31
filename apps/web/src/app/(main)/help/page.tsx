'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQ_CATEGORIES = [
  { id: 'exchange', label: '交換のしかた', icon: '🔄' },
  { id: 'account',  label: 'アカウント',  icon: '👤' },
  { id: 'payment',  label: '支払い・振込', icon: '💴' },
  { id: 'shipping', label: '発送・受取',   icon: '📦' },
  { id: 'safety',   label: '安全・詐欺対策', icon: '🛡️' },
  { id: 'kyc',      label: '本人確認(KYC)', icon: '🪪' },
]

const FAQS: Record<string, { q: string; a: string }[]> = {
  exchange: [
    {
      q: '¥0交換とは何ですか？',
      a: '持っているグッズと欲しいグッズをお金を使わずに交換できる機能です。双方が発送費用のみ負担して、グッズを交換します。取引手数料も¥0です。',
    },
    {
      q: '交換の流れを教えてください',
      a: '①交換したいグッズを出品 → ②欲しいグッズを見つけて交換申請 → ③出品者が承認 → ④双方が発送 → ⑤受取確認で完了、の5ステップです。',
    },
    {
      q: 'グッズの価値が違う場合はどうすればいいですか？',
      a: '価値の差分を現金で調整する「差額あり交換」も可能です。出品時に差額設定ができます。¥0交換は価値が同等のグッズ同士での交換を推奨しています。',
    },
    {
      q: '交換が成立しなかった場合はどうなりますか？',
      a: '申請から3日以内に出品者が承認しない場合、自動的にキャンセルになります。グッズは引き続き出品状態のままです。',
    },
  ],
  account: [
    {
      q: '登録は無料ですか？',
      a: 'はい、基本登録は完全無料です。プレミアム会員（月額385円）に登録するとAI相場アラートや出品数無制限などの特典が使えます。',
    },
    {
      q: 'パスワードを忘れました',
      a: 'ログイン画面の「パスワードをお忘れの方」をクリックすると、登録メールアドレスに再設定リンクが送られます。',
    },
    {
      q: '推しの設定はどこでできますか？',
      a: 'マイページ → 設定 → 推し設定から変更できます。推しを設定すると、トップページに推しのグッズ・コミュニティが優先表示されます。',
    },
    {
      q: 'アカウントを削除したいです',
      a: '設定 → セキュリティ → アカウント削除から手続きができます。取引中の場合は取引完了後に削除してください。',
    },
  ],
  payment: [
    {
      q: '支払い方法は何が使えますか？',
      a: 'クレジットカード（VISA・Mastercard・JCB・AmEx）、コンビニ払い、PayPay、Apple Pay / Google Payが使えます。',
    },
    {
      q: 'エスクロー決済とは何ですか？',
      a: '支払い金額を一時的に推しかつが預かり、商品の受取確認後に出品者へ振り込む仕組みです。支払い後に商品が届かないトラブルを防ぎます。',
    },
    {
      q: '売上金はいつ受け取れますか？',
      a: '毎月15日・月末の2回振込日があります。申請締切（2日前）までに振込申請すると、次の振込日に指定口座へ振り込まれます。',
    },
    {
      q: '手数料はいくらかかりますか？',
      a: '取引手数料は販売価格の2%です（¥0交換は手数料無料）。振込手数料は¥200（¥10,000以上は無料）です。',
    },
  ],
  shipping: [
    {
      q: '発送方法はどれがおすすめですか？',
      a: 'フォトカード・トレカなどの薄いものはレターパックライト（¥370）、アクスタなど厚みのあるものはヤマト宅急便コンパクト（¥520〜）がおすすめです。',
    },
    {
      q: '発送期限はいつまでですか？',
      a: '取引成立から3日以内に発送してください。期限を過ぎるとペナルティが付く場合があります。',
    },
    {
      q: '匿名発送は使えますか？',
      a: 'はい、ヤマト運輸の匿名配送（らくらくメルカリ便と同様の仕組み）を利用できます。住所を相手に知らせずに発送できます。',
    },
    {
      q: '商品が届かない場合はどうすればいいですか？',
      a: 'まず出品者にメッセージで確認してください。発送から7日以上経過して届かない場合は、サポートへお問い合わせください。エスクロー決済済みの場合は全額返金対応します。',
    },
  ],
  safety: [
    {
      q: 'AI鑑定済みとはどういう意味ですか？',
      a: 'AIが出品写真・価格・出品者の信用スコアを総合的に判断して、本物の可能性が高いと判定したグッズに付くバッジです。スコアが90以上で表示されます。',
    },
    {
      q: '偽物が届いた場合はどうなりますか？',
      a: '受取確認前であれば返金申請ができます。AI鑑定済みグッズで偽物だった場合は全額補償します。受取後7日以内にサポートへご連絡ください。',
    },
    {
      q: '詐欺被害に遭いました',
      a: 'すぐにサポートへご連絡ください。エスクロー決済を使っていた場合は全額保護されています。決済外で取引した場合の補償はできかねますのでご注意ください。',
    },
  ],
  kyc: [
    {
      q: 'なぜ本人確認が必要ですか？',
      a: '安全な取引のために全ユーザーの本人確認を求めています。身分証確認済みユーザーのみが取引・購入・出品できる仕組みにすることで、詐欺・なりすましを防止します。',
    },
    {
      q: '使える身分証は何ですか？',
      a: '運転免許証・マイナンバーカード・パスポート・在留カードが使えます。有効期限内のものに限ります。',
    },
    {
      q: '審査にどのくらい時間がかかりますか？',
      a: '通常5分〜数時間以内に審査が完了します。混雑時は最大24時間かかる場合があります。結果はメールでお知らせします。',
    },
    {
      q: '18歳未満でも登録できますか？',
      a: '18歳未満の方は保護者の同意のもとで登録できます。登録時の年齢確認で18歳未満と判定された場合、保護者同意フローへ案内されます。',
    },
  ],
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState('exchange')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = FAQS[activeCategory] ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-[#333333] mb-2">ヘルプ・よくある質問</h1>
        <p className="text-sm text-gray-500">わからないことがあればこちらをご確認ください</p>
      </div>

      {/* 検索ボックス */}
      <div className="relative mb-7">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"/>
        </svg>
        <input placeholder="質問を検索..."
          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white shadow-sm"/>
      </div>

      {/* カテゴリタブ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-7">
        {FAQ_CATEGORIES.map(cat => (
          <button key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setOpenFaq(null) }}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border
              ${activeCategory === cat.id
                ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white border-transparent shadow-md'
                : 'bg-white border-gray-100 text-gray-600 hover:border-sky-200 hover:text-sky-600'}`}>
            <span className="text-base">{cat.icon}</span>
            <span className="leading-tight text-center">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* FAQ アコーディオン */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden mb-8">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 font-black text-xs flex items-center justify-center mt-0.5">Q</span>
              <span className="flex-1 text-sm font-bold text-[#333333]">{faq.q}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 font-black text-xs flex items-center justify-center mt-0.5">A</span>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 解決しない場合のCTA */}
      <div className="bg-gradient-to-r from-sky-50 to-pink-50 border border-sky-100 rounded-2xl p-6 text-center">
        <h3 className="text-base font-black text-[#333333] mb-1">解決しない場合はお問い合わせ</h3>
        <p className="text-sm text-gray-500 mb-4">サポートチームが迅速に対応します（平日10:00〜18:00）</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="mailto:support@oshikatsu.jp"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
            メールで問い合わせ
          </a>
          <Link href="/"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
            TOPに戻る
          </Link>
        </div>
      </div>

      {/* フッターリンク */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs text-gray-400">
        <Link href="/terms" className="hover:text-sky-500 transition-colors">利用規約</Link>
        <Link href="/privacy" className="hover:text-sky-500 transition-colors">プライバシーポリシー</Link>
        <Link href="/about" className="hover:text-sky-500 transition-colors">推しかつについて</Link>
      </div>
    </div>
  )
}



