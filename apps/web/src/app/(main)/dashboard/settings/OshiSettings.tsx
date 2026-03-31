'use client'

import { useState } from 'react'
import { OSHI_ARTISTS } from '@/components/oshi/OshiSection'

interface Props {
  favoriteArtists: string[]
  userId: string
}

const GENRES = ['すべて', 'K-POP', 'アイドル', 'アニメ']

export function OshiSettings({ favoriteArtists, userId }: Props) {
  const [selected, setSelected] = useState<string[]>(favoriteArtists)
  const [filterGenre, setFilterGenre] = useState('すべて')
  const [saved, setSaved] = useState(false)

  const filtered = filterGenre === 'すべて'
    ? OSHI_ARTISTS
    : OSHI_ARTISTS.filter(a => a.genre === filterGenre)

  function toggleArtist(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-5 py-5">
      <p className="text-xs text-[#888888] mb-3">推しアーティストを複数選択できます。トップページのパーソナライズに使われます。</p>

      {/* ジャンルタブ */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => setFilterGenre(g)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              filterGenre === g ? 'bg-violet-500 text-white' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* アーティスト一覧 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-5">
        {filtered.map(artist => {
          const isSelected = selected.includes(artist.id)
          return (
            <button
              key={artist.id}
              onClick={() => toggleArtist(artist.id)}
              className="flex flex-col items-center gap-1.5 group relative"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${artist.color} p-0.5 transition-all
                ${isSelected ? 'ring-2 ring-offset-1 ring-violet-400 scale-105' : 'opacity-60 hover:opacity-90 hover:scale-105'}`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.img} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                {isSelected && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-medium text-center leading-tight transition-colors ${
                isSelected ? 'text-violet-600 font-bold' : 'text-[#555555]'
              }`}>
                {artist.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* 選択中 */}
      {selected.length > 0 && (
        <div className="mb-4 p-3 bg-violet-50 rounded-xl">
          <p className="text-xs font-bold text-violet-500 mb-2">選択中（{selected.length}件）</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map(id => {
              const a = OSHI_ARTISTS.find(x => x.id === id)
              return a ? (
                <span key={id} className="flex items-center gap-1 text-xs bg-white text-violet-600 border border-violet-200 px-2.5 py-1 rounded-full font-medium">
                  {a.name}
                  <button onClick={() => toggleArtist(id)} className="text-violet-300 hover:text-violet-500">×</button>
                </span>
              ) : null
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className={`w-full py-2.5 rounded-full text-sm font-bold transition-all ${
          saved ? 'bg-green-400 text-white' : 'bg-gradient-to-r from-violet-400 to-pink-400 text-white hover:opacity-90'
        }`}
      >
        {saved ? '保存しました！' : '推し設定を保存'}
      </button>
    </div>
  )
}



