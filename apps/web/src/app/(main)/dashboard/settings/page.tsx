import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NotificationSettings } from './NotificationSettings'
import { AccountSettings } from './AccountSettings'
import { OshiSettings } from './OshiSettings'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, email_notifications, push_notifications, favorite_artists, is_profile_public')
    .eq('id', user.id)
    .single()

  const sections = [
    { id: 'account',       label: 'アカウント',   icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z' },
    { id: 'oshi',          label: '推し設定',     icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
    { id: 'notification',  label: '通知',         icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9' },
    { id: 'privacy',       label: 'プライバシー', icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z' },
    { id: 'payment',       label: '支払い・振込',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z' },
    { id: 'security',      label: 'セキュリティ',  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">設定</h1>
          <p className="text-xs text-[#888888]">{user.email}</p>
        </div>
      </div>

      <div className="flex gap-6">

        {/* サイドナビ（PC） */}
        <aside className="hidden md:block w-48 flex-shrink-0">
          <nav className="space-y-1 sticky top-24">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#555555] hover:bg-sky-50 hover:text-sky-600 transition-colors group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0 group-hover:stroke-sky-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon}/>
                </svg>
                {s.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-100">
              <Link href="/auth/kyc"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-5m-4 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1m-4 0h4"/>
                </svg>
                本人確認（KYC）
              </Link>
            </div>
          </nav>
        </aside>

        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── アカウント ── */}
          <section id="account" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">アカウント</h2>
            </div>
            <AccountSettings email={user.email ?? ''} displayName={profile?.display_name ?? ''} username={profile?.username ?? ''} />
          </section>

          {/* ── 推し設定 ── */}
          <section id="oshi" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-400">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">推し設定</h2>
            </div>
            <OshiSettings favoriteArtists={(profile?.favorite_artists as string[] | null) ?? []} userId={user.id} />
          </section>

          {/* ── 通知 ── */}
          <section id="notification" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">通知設定</h2>
            </div>
            <NotificationSettings userId={user.id} />
          </section>

          {/* ── プライバシー ── */}
          <section id="privacy" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">プライバシー</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'プロフィールを公開する',     desc: 'オフにすると他のユーザーからプロフィールが見えなくなります' },
                { label: '取引履歴を公開する',         desc: '取引実績件数のみ表示されます' },
                { label: '推しアーティストを公開する', desc: 'プロフィールページに推し一覧を表示します' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#333333]">{item.label}</p>
                    <p className="text-xs text-[#888888] mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" defaultChecked={i === 0} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-400"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* ── 支払い・振込 ── */}
          <section id="payment" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">支払い・振込設定</h2>
            </div>
            <div className="px-5 py-5 space-y-3">
              <Link href="/dashboard/settings/bank"
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-sky-200 hover:bg-sky-50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-green-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333333]">振込口座を登録する</p>
                    <p className="text-xs text-[#888888]">売上金の受取口座を設定</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-sky-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/dashboard/settings/premium"
                className="flex items-center justify-between p-4 rounded-xl border border-violet-100 bg-violet-50 hover:bg-violet-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-500">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-violet-700">プレミアム会員（月額385円）</p>
                    <p className="text-xs text-violet-500">AI価格アラート・出品数無制限</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-violet-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </section>

          {/* ── セキュリティ ── */}
          <section id="security" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <h2 className="text-sm font-bold text-[#333333]">セキュリティ</h2>
            </div>
            <div className="divide-y divide-gray-50">
              <Link href="/dashboard/settings/password"
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-[#333333]">パスワードを変更する</p>
                  <p className="text-xs text-[#888888] mt-0.5">定期的な変更を推奨しています</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-sky-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/auth/kyc"
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div>
                  <p className="text-sm font-medium text-[#333333]">本人確認（KYC）</p>
                  <p className="text-xs text-[#888888] mt-0.5">取引上限を上げるには本人確認が必要です</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 group-hover:text-sky-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </Link>
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-[#333333] mb-1">ログイン中のデバイス</p>
                <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-gray-400 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-[#333333]">現在のデバイス</p>
                    <p className="text-xs text-[#888888]">最終ログイン：たった今</p>
                  </div>
                  <span className="ml-auto text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">現在</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 危険ゾーン ── */}
          <section className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-50 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-rose-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <h2 className="text-sm font-bold text-rose-500">アカウント削除</h2>
            </div>
            <div className="px-5 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#555555]">アカウントを削除すると、すべてのデータが失われます。</p>
                <p className="text-xs text-[#888888] mt-0.5">この操作は取り消せません。</p>
              </div>
              <button className="flex-shrink-0 text-xs font-bold text-rose-500 border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-50 transition-colors">
                削除する
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}



