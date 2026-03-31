import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * verify-authenticity Edge Function
 *
 * 【設計方針】
 * - アーティスト・歌手の「識別」は行わない（著作権・肖像権リスク回避）
 * - 「視覚的な偽物の特徴」のみをAIで検出する（消費者保護目的）
 * - これにより専門家不要のC2C取引を安全に実現する
 *
 * 検出対象:
 *   印刷品質 / ホログラム有無 / フォント整合性 / 縫製品質 /
 *   公式タグ・ロゴの正確性 / 素材の一致 / 価格タグの整合性
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { listingId, imageUrls } = await req.json() as {
      listingId: string
      imageUrls: string[]   // 商品画像URL（複数可）
    }

    if (!listingId || !imageUrls?.length) {
      return json({ error: 'listingId と imageUrls は必須です' }, 400)
    }

    // ─── Google Vision: 画像品質・視覚的特徴の検出 ─────────────────
    // ※ WEB_DETECTION（人物・ブランド識別）は使用しない
    const visionRequests = imageUrls.slice(0, 3).map((imageUri) => ({
      image: { source: { imageUri } },
      features: [
        { type: 'LABEL_DETECTION',    maxResults: 15 },  // 素材・品質ラベル
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 }, // オブジェクト検出
        { type: 'IMAGE_PROPERTIES',   maxResults: 1  },  // 色品質
        { type: 'SAFE_SEARCH_DETECTION' },               // 不正コンテンツ検出
      ],
    }))

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: visionRequests }),
      },
    )
    const visionData = await visionRes.json()

    // 各画像のラベル・色情報を集約
    const allLabels: string[] = []
    const dominantColors: number[] = []

    for (const response of (visionData.responses ?? [])) {
      const labels = (response.labelAnnotations ?? []) as Array<{ description: string; score: number }>
      allLabels.push(...labels.map((l) => `${l.description}(${Math.round(l.score * 100)}%)`))

      const colors = response.imagePropertiesAnnotation?.dominantColors?.colors ?? []
      const avgSaturation = colors.reduce(
        (sum: number, c: { color: { red: number; green: number; blue: number } }) => {
          const r = c.color.red / 255
          const g = c.color.green / 255
          const b = c.color.blue / 255
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          return sum + (max === 0 ? 0 : (max - min) / max)
        }, 0,
      ) / Math.max(colors.length, 1)
      dominantColors.push(Math.round(avgSaturation * 100))
    }

    // ─── Claude API: 真贋判定（偽物の視覚的特徴に特化） ───────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'x-api-key':        Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `あなたは中古グッズの真贋判定AIです。
以下の情報から「偽物の可能性」を判定してください。

【重要な制約】
- 特定のアーティスト・歌手・人物の識別は行わない
- グッズの視覚的品質のみで判定する
- 消費者保護を目的とした客観的な品質チェックを行う

【Vision AI 検出ラベル】
${allLabels.slice(0, 20).join(', ')}

【画像の色彩品質スコア（彩度、高いほど鮮明）】
${dominantColors.map((s, i) => `画像${i + 1}: ${s}%`).join(', ')}

以下のJSONのみ返してください（他のテキスト不要）:
{
  "authenticity_score": 0〜100の整数（100=本物の可能性高、0=偽物の可能性高）,
  "counterfeit_risk": "low" | "medium" | "high",
  "flags": ["検出された問題点（日本語）", ...] ,
  "reasoning": "判定根拠の要約（消費者向け、1〜2文、日本語）"
}

判定基準:
- authenticity_score 80以上: low（安心して取引可能）
- authenticity_score 50〜79: medium（購入前に出品者へ確認推奨）
- authenticity_score 49以下: high（偽物の疑いあり、管理者確認が必要）

flags の例:
- "印刷品質が低い（にじみ・ぼやけの可能性）"
- "色彩の鮮明さが公式グッズの基準を下回っている"
- "画像に不自然な編集の痕跡が見られる"
- "素材感が公式グッズと異なる可能性がある"
- "ホログラムや公式タグが確認できない"`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text ?? '{}'

    let result: {
      authenticity_score: number
      counterfeit_risk:   'low' | 'medium' | 'high'
      flags:              string[]
      reasoning:          string
    }

    try {
      result = JSON.parse(rawText)
    } catch {
      // パース失敗時はデフォルト（medium）を返す
      result = {
        authenticity_score: 60,
        counterfeit_risk:   'medium',
        flags:              ['自動判定に失敗しました。出品者へ直接確認をお勧めします。'],
        reasoning:          '画像解析中にエラーが発生しました。',
      }
    }

    // ─── DB に保存（ai_price_analyses に upsert） ──────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    await supabase
      .from('ai_price_analyses')
      .upsert(
        {
          listing_id:               listingId,
          authenticity_score:       result.authenticity_score,
          counterfeit_risk:         result.counterfeit_risk,
          authenticity_flags:       result.flags,
          authenticity_reasoning:   result.reasoning,
          authenticity_checked_at:  new Date().toISOString(),
        },
        { onConflict: 'listing_id' },
      )

    // high リスクの場合は出品を自動停止して管理者通知
    if (result.counterfeit_risk === 'high') {
      await supabase
        .from('listings')
        .update({ status: 'suspended', is_ai_flagged: true, ai_flag_reason: result.reasoning })
        .eq('id', listingId)

      await supabase.from('notifications').insert({
        user_id: null,   // 管理者テーブルへの通知（将来的に admin_id を指定）
        type:    'system',
        title:   '偽物疑い出品を自動停止しました',
        body:    `出品ID: ${listingId} / 理由: ${result.reasoning}`,
        related_entity_id:   listingId,
        related_entity_type: 'listing',
      })
    }

    return json({
      authenticity_score:     result.authenticity_score,
      counterfeit_risk:       result.counterfeit_risk,
      flags:                  result.flags,
      reasoning:              result.reasoning,
      auto_suspended:         result.counterfeit_risk === 'high',
    })
  } catch (err) {
    console.error('verify-authenticity error:', err)
    return json({ error: String(err) }, 500)
  }
})
