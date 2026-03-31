import Link from 'next/link'

const SECTIONS = [
  {
    title: '1. 収集する情報',
    items: [
      { label: '登録情報', desc: 'メールアドレス・パスワード（ハッシュ化）・表示名・生年月日' },
      { label: '本人確認情報', desc: '身分証明書の画像（審査後に暗号化保存）・顔写真' },
      { label: '取引情報', desc: '出品・購入・交換の履歴、メッセージ内容' },
      { label: '利用ログ', desc: 'IPアドレス・デバイス情報・閲覧履歴（サービス改善のため）' },
      { label: '推し設定', desc: '好きなアーティスト・ジャンルの設定情報（パーソナライズに使用）' },
    ],
  },
  {
    title: '2. 情報の利用目的',
    items: [
      { label: 'サービス提供', desc: '取引処理・本人確認・メッセージ機能の提供' },
      { label: 'AI鑑定', desc: '偽物・詐欺防止のためのAI審査' },
      { label: 'パーソナライズ', desc: '推し設定に基づくコンテンツの最適化' },
      { label: 'サービス改善', desc: '利用データの分析による機能改善' },
      { label: '法的対応', desc: '不正利用の調査・法令に基づく開示' },
    ],
  },
  {
    title: '3. 第三者提供',
    content: '以下の場合を除き、個人情報を第三者に提供しません：①法令に基づく場合　②ユーザーの同意がある場合　③取引の相手方への必要最小限の情報（匿名配送使用時は住所を除く）　④決済処理業者への支払い情報（暗号化）',
  },
  {
    title: '4. 情報の保護',
    content: 'SSL/TLSによる通信暗号化、身分証画像のAES-256暗号化保存、定期的なセキュリティ監査、アクセス権限の最小化、などのセキュリティ対策を実施しています。',
  },
  {
    title: '5. Cookie・トラッキング',
    content: 'セッション管理・ユーザー設定の保持にCookieを使用します。分析には匿名化したデータのみを使用し、広告目的でのトラッキングは行いません。ブラウザの設定からCookieを無効にできますが、一部機能が使えなくなる場合があります。',
  },
  {
    title: '6. データの保存期間',
    content: 'アカウント情報はアカウント削除後30日間保持します（不正利用調査のため）。取引情報は法令に基づき7年間保存します。本人確認書類は審査完了後に暗号化の上で3年間保存します。',
  },
  {
    title: '7. ユーザーの権利',
    content: 'ユーザーはいつでも①個人情報の開示請求　②訂正・削除の請求　③利用停止の請求ができます。設定ページまたはサポートへのメールでお手続きいただけます。',
  },
  {
    title: '8. 未成年のプライバシー',
    content: '18歳未満のユーザーの個人情報は、保護者の同意のもとで収集します。未成年ユーザーの情報は特に厳格に管理し、マーケティング目的での使用はしません。',
  },
  {
    title: '9. プライバシーポリシーの変更',
    content: '本ポリシーを変更する場合は、サービス内で告知するとともに登録メールアドレスへ通知します。重要な変更の場合は再同意をいただく場合があります。',
  },
  {
    title: '10. お問い合わせ',
    content: 'プライバシーに関するご質問・ご要望はサポートページまたは privacy@oshikatsu.jp までお問い合わせください。',
  },
]

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-black text-[#333333]">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400 mt-1">最終更新日：2026年2月1日</p>
      </div>

      {/* 前文 */}
      <div className="bg-gradient-to-r from-sky-50 to-pink-50 border border-sky-100 rounded-2xl p-5 mb-7">
        <div className="flex items-start gap-3">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-sky-500 flex-shrink-0 mt-0.5">
            <path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <p className="text-sm text-[#555555] leading-relaxed">
            推しかつは、ユーザーのプライバシーを最優先に考えています。本ポリシーでは、どのような情報をどのように収集・利用するかを明確にしています。
            身分証情報はAES-256で暗号化し、AI鑑定審査のみに使用します。
          </p>
        </div>
      </div>

      {/* 各セクション */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-black text-[#333333] mb-3">{section.title}</h2>
            {section.items ? (
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex gap-2">
                    <span className="flex-shrink-0 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full h-fit mt-0.5 whitespace-nowrap">
                      {item.label}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
            )}
          </div>
        ))}
      </div>

      {/* フッターリンク */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-center text-xs text-gray-400">
        <Link href="/terms" className="hover:text-sky-500 transition-colors">利用規約</Link>
        <Link href="/help" className="hover:text-sky-500 transition-colors">ヘルプ・FAQ</Link>
        <Link href="/" className="hover:text-sky-500 transition-colors">トップへ</Link>
      </div>
    </div>
  )
}



