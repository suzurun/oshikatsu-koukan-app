'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileData {
  display_name:     string
  username:         string
  bio:              string
  avatar_url:       string
  favorite_artists: string[]
}

export function ProfileEditForm({
  userId,
  initialData,
}: {
  userId: string
  initialData: ProfileData
}) {
  const router = useRouter()
  const [data, setData] = useState<ProfileData>(initialData)
  const [artistInput, setArtistInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addArtist() {
    const name = artistInput.trim()
    if (!name || data.favorite_artists.includes(name)) return
    if (data.favorite_artists.length >= 10) {
      setError('推しは最大10件まで登録できます')
      return
    }
    setData((d) => ({ ...d, favorite_artists: [...d.favorite_artists, name] }))
    setArtistInput('')
  }

  function removeArtist(name: string) {
    setData((d) => ({ ...d, favorite_artists: d.favorite_artists.filter((a) => a !== name) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!data.display_name.trim()) {
      setError('表示名は必須です')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name:    data.display_name.trim(),
        bio:             data.bio.trim() || null,
        favorite_artists: data.favorite_artists,
      })
      .eq('id', userId)

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => router.push('/dashboard'), 1000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* エラー / 成功 */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-3">
          保存しました！ダッシュボードに戻ります...
        </div>
      )}

      {/* 表示名 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          表示名 <span className="text-pink-500">*</span>
        </label>
        <input
          type="text"
          maxLength={50}
          value={data.display_name}
          onChange={(e) => setData((d) => ({ ...d, display_name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="例: 推し活太郎"
        />
        <p className="text-xs text-gray-400 mt-1">{data.display_name.length}/50</p>
      </div>

      {/* ユーザー名（読み取り専用） */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          ユーザー名
        </label>
        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
          <span className="text-gray-400 text-sm">@</span>
          <span className="text-sm text-gray-500 ml-1">{data.username}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">ユーザー名は変更できません</p>
      </div>

      {/* 自己紹介 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">自己紹介</label>
        <textarea
          maxLength={500}
          value={data.bio}
          onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
          rows={4}
          placeholder="推しへの愛を語ってください（500文字以内）"
        />
        <p className="text-xs text-gray-400 mt-1">{data.bio.length}/500</p>
      </div>

      {/* 推しアーティスト */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          推しアーティスト
          <span className="ml-1 text-xs font-normal text-gray-400">（最大10件）</span>
        </label>

        {/* タグ表示 */}
        {data.favorite_artists.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.favorite_artists.map((artist) => (
              <span
                key={artist}
                className="inline-flex items-center gap-1 bg-pink-50 text-pink-700 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {artist}
                <button
                  type="button"
                  onClick={() => removeArtist(artist)}
                  className="text-pink-400 hover:text-pink-600 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArtist() } }}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder="アーティスト名を入力"
          />
          <button
            type="button"
            onClick={addArtist}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            追加
          </button>
        </div>
      </div>

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl
                   hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? '保存中...' : '変更を保存する'}
      </button>
    </form>
  )
}
