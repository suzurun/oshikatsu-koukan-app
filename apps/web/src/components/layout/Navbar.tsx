'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/* ─────────────────────────────────────────
   カテゴリタブ定義（SVGシルエット）
───────────────────────────────────────── */
const NAV_CATEGORIES = [
  {
    href: '/search',
    label: 'おすすめ',
    bg: 'bg-gradient-to-br from-amber-400 to-yellow-400',
    iconPath: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  },
  {
    href: '/search?category=photo-cards',
    label: 'フォトカード',
    bg: 'bg-gradient-to-br from-pink-400 to-rose-500',
    iconPath: 'M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm3-5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
  {
    href: '/search?category=acrylic-stand',
    label: 'アクスタ',
    bg: 'bg-gradient-to-br from-sky-400 to-cyan-500',
    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  },
  {
    href: '/search?category=uchiwa',
    label: 'うちわ',
    bg: 'bg-gradient-to-br from-fuchsia-400 to-pink-500',
    iconPath: 'M12 2a8 8 0 1 0 0 16A8 8 0 0 0 12 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm-1 2h2v4h-2v-4z',
  },
  {
    href: '/search?category=badges',
    label: '缶バッジ',
    bg: 'bg-gradient-to-br from-violet-400 to-purple-500',
    iconPath: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z',
  },
  {
    href: '/search?category=bromide',
    label: 'ブロマイド',
    bg: 'bg-gradient-to-br from-rose-400 to-orange-400',
    iconPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 8H8v-.57C8 14.14 9.37 13 12 13s4 1.14 4 2.43V16z',
  },
  {
    href: '/search?category=clearfile',
    label: 'クリアファイル',
    bg: 'bg-gradient-to-br from-teal-400 to-green-500',
    iconPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
  },
  {
    href: '/search?category=concert-goods',
    label: 'コンサートグッズ',
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    iconPath: 'M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4zm-2 16.9V20H8v2h8v-2h-2v-2.1A7 7 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 5 6.9z',
  },
  {
    href: '/search?category=others',
    label: 'その他',
    bg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    iconPath: 'M4 6h16M4 12h16M4 18h16',
  },
  {
    href: '/community',
    label: 'コミュニティ',
    bg: 'bg-gradient-to-br from-violet-400 to-pink-400',
    iconPath: 'M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
]

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    const supabase = createClient()
    const fetchCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setUnreadCount(count ?? 0)
    }
    fetchCount()
    const channel = supabase
      .channel('notifications-badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchCount())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <header className="bg-gradient-to-r from-sky-400 to-pink-300 sticky top-0 z-50 shadow-md">

      {/* ── メインナビ ── */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-sky-500 font-black text-lg tracking-tight leading-none">推し活</span>
            <span className="text-pink-400 font-black text-lg tracking-tight leading-none">マーケット</span>
          </div>
        </Link>

        {/* 検索バー */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex items-center bg-white rounded-full overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="グッズ名・アーティスト名で検索..."
              className="flex-1 px-5 py-2.5 text-sm text-[#333333] bg-transparent focus:outline-none placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-sky-400 hover:bg-sky-500 text-white px-5 py-2.5 text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              検索
            </button>
          </div>
        </form>

        {/* 右側アクション */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* 通知 */}
          {user && (
            <Link
              href="/dashboard/notifications"
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
              aria-label="通知"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* 言語設定 */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(v => !v); setMenuOpen(false) }}
              className="flex items-center gap-1.5 text-white hover:bg-white/20 px-3 py-2 rounded-full transition-colors text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
              </svg>
              日本語
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-12 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                {[
                  { code: 'ja', label: '日本語', flag: 'JP' },
                  { code: 'en', label: 'English', flag: 'US' },
                  { code: 'zh', label: '中文', flag: 'CN' },
                  { code: 'ko', label: '한국어', flag: 'KR' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-sky-50 hover:text-sky-600"
                    onClick={() => setLangOpen(false)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ログイン / ユーザーメニュー */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => { setMenuOpen(v => !v); setLangOpen(false) }}
                className="flex items-center gap-2 hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sky-500 text-sm font-black shadow-sm">
                  {user.email?.[0].toUpperCase() ?? 'U'}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {[
                    { href: '/dashboard',           label: 'ダッシュボード' },
                    { href: '/transactions',         label: '取引中' },
                    { href: '/dashboard/wishlist',   label: 'ウィッシュリスト' },
                    { href: '/auth/kyc',             label: '本人確認' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-[#333333] hover:bg-sky-50 hover:text-sky-600"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50"
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sky-500 bg-white hover:bg-sky-50 font-bold px-4 py-2 rounded-full text-sm transition-colors shadow-sm"
            >
              ログイン
            </Link>
          )}

          {/* 出品ボタン */}
          <Link
            href="/listings/new"
            className="bg-white text-pink-500 hover:bg-pink-50 font-black px-5 py-2 rounded-full text-sm transition-colors shadow-sm border-2 border-white hidden sm:block"
          >
            出品・交換する！
          </Link>
        </div>
      </div>

      {/* ── カテゴリタブバー ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-2">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {NAV_CATEGORIES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2 border-b-2 border-transparent hover:border-sky-400 transition-all group"
              >
                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center
                                group-hover:scale-110 group-hover:shadow-md transition-all duration-200 shadow-sm`}>
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d={item.iconPath} />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#555555] group-hover:text-sky-500 whitespace-nowrap transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </header>
  )
}
