'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  email: string
  displayName: string
  username: string
}

export function AccountSettings({ email, displayName, username }: Props) {
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="divide-y divide-gray-50">
      {/* メールアドレス */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#888888] font-medium mb-0.5">メールアドレス</p>
          <p className="text-sm text-[#333333] font-medium truncate">{email}</p>
        </div>
        <button className="text-xs text-sky-500 hover:text-sky-600 font-medium flex-shrink-0">変更</button>
      </div>

      {/* 表示名 */}
      <div className="px-5 py-4">
        <label className="block text-xs text-[#888888] font-medium mb-1.5">表示名</label>
        <input
          type="text"
          defaultValue={displayName}
          placeholder="表示名を入力"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
        />
      </div>

      {/* ユーザー名 */}
      <div className="px-5 py-4">
        <label className="block text-xs text-[#888888] font-medium mb-1.5">ユーザー名（@）</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">@</span>
          <input
            type="text"
            defaultValue={username}
            placeholder="username"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#333333] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-[#aaaaaa] mt-1">英数字・アンダースコアのみ使用可</p>
      </div>

      {/* プロフィール編集リンク */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#333333]">プロフィール詳細編集</p>
          <p className="text-xs text-[#888888] mt-0.5">自己紹介・アバター画像の変更</p>
        </div>
        <Link href="/dashboard/edit"
          className="text-xs text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1">
          編集する
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* 保存ボタン */}
      <div className="px-5 py-4 flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
            saved
              ? 'bg-green-400 text-white'
              : 'bg-gradient-to-r from-sky-400 to-pink-400 text-white hover:opacity-90'
          }`}
        >
          {saved ? '保存しました！' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}



