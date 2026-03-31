import Link from 'next/link'

const SECTIONS = [
  {
    title: '第1条（適用）',
    content: '本規約は、推しかつ（以下「本サービス」）を利用するすべてのユーザーに適用されます。ユーザーは本規約に同意した上で本サービスを利用するものとします。',
  },
  {
    title: '第2条（登録）',
    content: '本サービスの利用には会員登録が必要です。登録時には正確な情報を提供してください。18歳未満の方は保護者の同意が必要です。1人につき1アカウントのみ作成できます。',
  },
  {
    title: '第3条（本人確認）',
    content: '取引・出品・購入を行う際は、本人確認（KYC）が必要です。身分証明書の提出により本人確認を行い、確認完了後にすべての取引機能が利用可能となります。',
  },
  {
    title: '第4条（¥0交換機能）',
    content: '¥0交換はグッズ同士をお金を使わずに交換する機能です。発送費用は各自負担となります。AI鑑定で本物と判定されたグッズのみ交換できます。虚偽の出品・偽物の送付は利用停止・損害賠償の対象となります。',
  },
  {
    title: '第5条（禁止事項）',
    content: '①偽物・模造品の出品　②個人情報の不正収集　③なりすまし行為　④詐欺・不正取引　⑤ハラスメント・誹謗中傷　⑥サービスへの不正アクセス　⑦法令に違反する行為、を禁止します。',
  },
  {
    title: '第6条（エスクロー決済）',
    content: '現金での取引はエスクロー決済を採用しています。支払い金額は取引完了まで本サービスが預かり、受取確認後に出品者へ振り込みます。取引手数料は販売価格の2%です。',
  },
  {
    title: '第7条（AI鑑定）',
    content: 'AI鑑定は画像・価格・出品者の信用スコアを総合的に分析するものです。AI鑑定済みグッズで偽物が届いた場合、購入金額を全額返金します（受取後7日以内のご連絡が必要）。',
  },
  {
    title: '第8条（知的財産権）',
    content: '本サービスに含まれるコンテンツ・デザイン・システムの知的財産権は当社に帰属します。ユーザーが投稿したコンテンツの権利はユーザーに帰属しますが、本サービス運営のために使用することを許諾するものとします。',
  },
  {
    title: '第9条（免責事項）',
    content: '当社は、本サービスの利用によって生じた損害について、当社の故意または重大な過失による場合を除き、責任を負いません。本サービスの停止・変更・終了による損害についても同様です。',
  },
  {
    title: '第10条（規約の変更）',
    content: '当社は必要に応じて本規約を変更できます。変更後の規約はサービス内での告知または登録メールへの通知をもって効力を生じます。変更後も本サービスを利用した場合、変更後の規約に同意したものとみなします。',
  },
  {
    title: '第11条（準拠法・裁判管轄）',
    content: '本規約の解釈は日本法に準拠します。本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-sky-500 mb-4 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          トップに戻る
        </Link>
        <h1 className="text-2xl font-black text-[#333333]">利用規約</h1>
        <p className="text-sm text-gray-400 mt-1">最終更新日：2026年2月1日</p>
      </div>

      {/* 前文 */}
      <div className="bg-gradient-to-r from-sky-50 to-pink-50 border border-sky-100 rounded-2xl p-5 mb-7">
        <p className="text-sm text-[#555555] leading-relaxed">
          推しかつ（以下「本サービス」）は、K-POPをはじめとする推し活グッズの¥0交換・売買・コミュニティサービスを提供します。
          本サービスをご利用いただく前に、本規約をよくお読みください。
        </p>
      </div>

      {/* 各条項 */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-black text-[#333333] mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>

      {/* フッターリンク */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-center text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-sky-500 transition-colors">プライバシーポリシー</Link>
        <Link href="/help" className="hover:text-sky-500 transition-colors">ヘルプ・FAQ</Link>
        <Link href="/" className="hover:text-sky-500 transition-colors">トップへ</Link>
      </div>
    </div>
  )
}



