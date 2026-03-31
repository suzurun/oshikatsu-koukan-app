import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    /**
     * 【設計方針】
     * - アーティスト・歌手の「識別」は価格分析の責務から除外
     *   （識別は verify-authenticity が担う。またユーザー自身が入力した情報を使う）
     * - 価格分析は「商品カテゴリ・状態・市場データ」に基づく客観的な数値計算に特化
     * - WEB_DETECTION は使用しない（人物・ブランド識別を避けるため）
     */
    const { imageUrl, categoryId, condition, artistName, eventId } = await req.json()

    // 1. Google Vision API: 商品の物理的特徴のみ取得（人物・ブランド識別なし）
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'LABEL_DETECTION',     maxResults: 10 }, // 商品種別ラベル（Tシャツ・缶バッジ等）
              { type: 'OBJECT_LOCALIZATION', maxResults: 5  }, // オブジェクト形状
              // ※ WEB_DETECTION は使用しない（アーティスト識別につながるため）
            ],
          }],
        }),
      },
    )
    const visionData = await visionRes.json()
    const labels = (visionData.responses?.[0]?.labelAnnotations ?? []) as Array<{ description: string }>
    const productTypeHint = labels.map((l) => l.description).join(', ') || '不明な商品'

    // 2. 自社DBの過去成約データを取得（カテゴリ絞り込み）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let marketQuery = supabase
      .from('market_price_data')
      .select('price, platform, sold_at')
      .order('collected_at', { ascending: false })
      .limit(50)

    if (categoryId) {
      marketQuery = marketQuery.eq('category_id', categoryId)
    }

    const { data: marketData } = await marketQuery

    const prices = (marketData ?? []).map((d: { price: number }) => d.price).filter(Boolean)
    const avgPrice = prices.length > 0
      ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length
      : null

    // 3. Claude API: 価格提案（アーティスト識別ではなく市場データに基づく）
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `中古グッズの市場価格を分析してください。

商品種別（Vision AI推定）: ${productTypeHint}
カテゴリID: ${categoryId ?? '未指定'}
商品の状態: ${condition ?? '未記入'}
ジャンル/アーティスト（出品者入力）: ${artistName ?? '未記入'}
イベントID: ${eventId ?? 'なし'}
市場平均価格: ${avgPrice ? `¥${Math.round(avgPrice)}` : 'データなし'}
市場データ件数: ${prices.length}件

以下のJSONのみ返してください（他のテキスト不要）:
{
  "suggestedPrice": 数値,
  "earlyBirdPrice": 数値,
  "premiumPrice": 数値または null,
  "rarityScore": 0〜100の整数,
  "rarityLabel": "common" | "semi_rare" | "rare" | "ultra_rare",
  "demandForecast30d": 整数,
  "priceTrend": "surge" | "peak" | "stable" | "declining" | "bottom",
  "confidenceScore": 0〜1の小数,
  "reasoning": "価格提案の根拠（日本語・1文・アーティスト名は含めない）"
}`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const analysisText = claudeData.content?.[0]?.text ?? '{}'
    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(analysisText)
    } catch {
      analysis = { suggestedPrice: avgPrice, rarityScore: 50, rarityLabel: 'common' }
    }

    return new Response(
      JSON.stringify({
        productTypeHint,  // ※ アーティスト名ではなく商品種別のみ返す
        analysis,
        marketData: marketData ?? [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
