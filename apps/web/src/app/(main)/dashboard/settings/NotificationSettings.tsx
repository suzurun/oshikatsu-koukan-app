'use client'

import { useState } from 'react'

const NOTIFICATION_ITEMS = [
  { id: 'new_message',      label: 'メッセージ',           desc: '取引相手からのメッセージ通知',          default: true  },
  { id: 'transaction',      label: '取引の進捗',           desc: '取引ステータスが変わったとき',          default: true  },
  { id: 'price_alert',      label: 'AI価格アラート',        desc: '推しグッズの相場が大きく動いたとき',    default: true  },
  { id: 'new_listing',      label: '新着出品',             desc: 'ウィッシュリストの商品が出品されたとき', default: true  },
  { id: 'event',            label: 'イベント・オフ会',      desc: '推しのオフ会が作成されたとき',          default: false },
  { id: 'community',        label: 'コミュニティ',         desc: 'ファンルームへの返信・いいね',           default: false },
  { id: 'review',           label: '評価・レビュー',        desc: '取引完了後の評価通知',                  default: true  },
  { id: 'campaign',         label: 'キャンペーン・お知らせ', desc: 'アプリからのお得情報',                 default: false },
]

export function NotificationSettings({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map(item => [item.id, item.default]))
  )
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="divide-y divide-gray-50">
        {NOTIFICATION_ITEMS.map(item => (
          <div key={item.id} className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-medium text-[#333333]">{item.label}</p>
              <p className="text-xs text-[#888888] mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={settings[item.id]}
                onChange={() => toggle(item.id)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-400"></div>
            </label>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 flex justify-end border-t border-gray-50">
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
            saved ? 'bg-green-400 text-white' : 'bg-gradient-to-r from-sky-400 to-pink-400 text-white hover:opacity-90'
          }`}
        >
          {saved ? '保存しました！' : '変更を保存'}
        </button>
      </div>
    </div>
  )
}



