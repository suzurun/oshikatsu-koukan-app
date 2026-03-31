import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileEditForm } from './ProfileEditForm'

export const dynamic = 'force-dynamic'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, bio, avatar_url, favorite_artists')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">プロフィール編集</h1>
        <p className="text-sm text-gray-500 mt-1">表示名・自己紹介・推しを変更できます</p>
      </div>
      <ProfileEditForm
        userId={user.id}
        initialData={{
          display_name:    profile.display_name,
          username:        profile.username,
          bio:             profile.bio ?? '',
          avatar_url:      profile.avatar_url ?? '',
          favorite_artists: (profile.favorite_artists as string[] | null) ?? [],
        }}
      />
    </div>
  )
}
