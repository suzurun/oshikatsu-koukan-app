-- =============================================================================
-- Migration: 0003_authenticity_analysis
-- 目的: ai_price_analyses テーブルに真贋判定フィールドを追加
--       ※ アーティスト識別（プロの鑑定代替）ではなく、
--          消費者保護のための偽物検出（C2C安全取引を実現）として設計
-- =============================================================================

DO $$
BEGIN
    -- 真贋スコア（0〜100: 100=本物の確率高、0=偽物の可能性高）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_price_analyses' AND column_name = 'authenticity_score'
    ) THEN
        ALTER TABLE ai_price_analyses
            ADD COLUMN authenticity_score    NUMERIC(5,2)
                CHECK (authenticity_score IS NULL OR authenticity_score BETWEEN 0 AND 100);
    END IF;

    -- 偽物リスクレベル
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_price_analyses' AND column_name = 'counterfeit_risk'
    ) THEN
        ALTER TABLE ai_price_analyses
            ADD COLUMN counterfeit_risk      VARCHAR(10)
                CHECK (counterfeit_risk IS NULL OR counterfeit_risk IN ('low', 'medium', 'high'));
    END IF;

    -- 検出された具体的な問題点（JSON配列）
    -- 例: ["印刷品質が低い", "公式ホログラムなし", "フォントが不一致"]
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_price_analyses' AND column_name = 'authenticity_flags'
    ) THEN
        ALTER TABLE ai_price_analyses
            ADD COLUMN authenticity_flags    JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 真贋判定の根拠テキスト（消費者向けに表示）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_price_analyses' AND column_name = 'authenticity_reasoning'
    ) THEN
        ALTER TABLE ai_price_analyses
            ADD COLUMN authenticity_reasoning TEXT;
    END IF;

    -- 真贋判定実施日時
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ai_price_analyses' AND column_name = 'authenticity_checked_at'
    ) THEN
        ALTER TABLE ai_price_analyses
            ADD COLUMN authenticity_checked_at TIMESTAMPTZ;
    END IF;
END $$;

COMMENT ON COLUMN ai_price_analyses.authenticity_score IS
    '真贋スコア。100=本物の確率高、0=偽物の可能性高。アーティスト識別ではなく視覚的特徴（印刷品質・ホログラム・縫製等）から判定。';
COMMENT ON COLUMN ai_price_analyses.counterfeit_risk IS
    'low=低リスク（安心）/ medium=要確認 / high=偽物の疑いあり（出品停止対象）';
COMMENT ON COLUMN ai_price_analyses.authenticity_flags IS
    '具体的な問題点の配列。消費者が確認できるよう日本語で記録。';

CREATE INDEX IF NOT EXISTS idx_ai_analyses_authenticity
    ON ai_price_analyses(counterfeit_risk)
    WHERE counterfeit_risk IS NOT NULL;
