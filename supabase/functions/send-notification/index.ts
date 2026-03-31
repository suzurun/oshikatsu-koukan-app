import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userId: string
  type: string
  title: string
  body: string
  relatedEntityId?: string
  relatedEntityType?: string
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const payload = await req.json() as NotificationPayload | NotificationPayload[]
    const notifications = Array.isArray(payload) ? payload : [payload]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const results = await Promise.allSettled(
      notifications.map((n) => sendOne(supabase, n))
    )

    const sent     = results.filter((r) => r.status === 'fulfilled').length
    const failed   = results.filter((r) => r.status === 'rejected').length

    return json({ sent, failed })
  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
})

async function sendOne(
  supabase: ReturnType<typeof createClient>,
  n: NotificationPayload,
) {
  // ① DB に通知レコードを保存（InApp 通知）
  await supabase.from('notifications').insert({
    user_id:              n.userId,
    type:                 n.type,
    title:                n.title,
    body:                 n.body,
    related_entity_id:    n.relatedEntityId ?? null,
    related_entity_type:  n.relatedEntityType ?? null,
  })

  // ② Expo プッシュトークンを取得
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', n.userId)
    .eq('is_active', true)

  if (!tokens || tokens.length === 0) return

  // ③ Expo Push API に送信
  const messages = tokens.map((t) => ({
    to:    t.token,
    title: n.title,
    body:  n.body,
    data:  {
      type:              n.type,
      relatedEntityId:   n.relatedEntityId,
      relatedEntityType: n.relatedEntityType,
    },
    sound:  'default',
    badge:  1,
  }))

  const res = await fetch(EXPO_PUSH_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify(messages),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Expo push failed: ${text}`)
  }

  const result = await res.json()

  // ④ 無効なトークンを非アクティブ化
  const data = result.data as Array<{ status: string; details?: { error?: string } }>
  const invalidTokens = tokens
    .filter((_, i) => data[i]?.details?.error === 'DeviceNotRegistered')
    .map((t) => t.token)

  if (invalidTokens.length > 0) {
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .in('token', invalidTokens)
  }
}
