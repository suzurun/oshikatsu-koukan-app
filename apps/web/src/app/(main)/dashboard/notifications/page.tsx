import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { MarkAllReadButton } from './MarkAllReadButton'

const TYPE_ICONS: Record<string, string> = {
  match_request:      '🛍️',
  transaction_status: '📦',
  payment_complete:   '💳',
  shipment_sent:      '🚚',
  delivery_confirmed: '✅',
  dispute_opened:     '⚠️',
  dispute_resolved:   '🏳️',
  credit_score_up:    '📈',
  credit_score_down:  '📉',
  kyc_approved:       '🪪',
  premium_renewed:    '👑',
  system:             '🔔',
}

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">通知</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">未読 {unreadCount}件</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <MarkAllReadButton userId={user.id} />}
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← ダッシュボード
          </Link>
        </div>
      </div>

      {/* 通知リスト */}
      {!notifications || notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔔</p>
          <p className="text-lg font-medium">通知はありません</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          {notifications.map((n) => {
            const icon = TYPE_ICONS[n.type] ?? '🔔'
            const link = n.related_entity_type === 'transaction'
              ? `/transactions/${n.related_entity_id}`
              : n.related_entity_type === 'listing'
              ? `/listings/${n.related_entity_id}`
              : null

            const timeAgo = formatDistanceToNow(new Date(n.created_at), {
              addSuffix: true,
              locale: ja,
            })

            const inner = (
              <div className={`flex gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-pink-50' : 'hover:bg-gray-50'}`}>
                <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title ?? n.type}
                      {!n.is_read && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-pink-500 align-middle" />
                      )}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                </div>
              </div>
            )

            return (
              <li key={n.id}>
                {link ? (
                  <Link href={link} className="block">{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
