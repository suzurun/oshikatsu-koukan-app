-- =============================================================================
-- Migration: 0004_authenticity_check_purchase
-- 目的: 出品者が任意で購入する「AI真贋チェック」の課金管理
-- 設計: プラットフォームがコストを負担せず、出品者が必要と判断した場合のみ課金
-- =============================================================================

-- 真贋チェック購入状態
CREATE TYPE authenticity_purchase_status AS ENUM (
    'pending',    -- 支払い待ち
    'paid',       -- 支払い済み・チェック実行前
    'checking',   -- チェック実行中
    'completed',  -- チェック完了
    'failed',     -- チェック失敗（返金対象）
    'refunded'    -- 返金済み
);

-- -----------------------------------------------------------------------------
-- テーブル: authenticity_purchases
-- 真贋チェックの購入・支払い管理
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authenticity_purchases (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id                  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status                      authenticity_purchase_status NOT NULL DEFAULT 'pending',
    fee_amount                  INTEGER NOT NULL,               -- 請求額（¥98 or ¥198）
    stripe_checkout_session_id  TEXT UNIQUE,                    -- Stripe Checkout セッションID
    stripe_payment_intent_id    TEXT,                           -- Stripe PaymentIntent ID
    paid_at                     TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE authenticity_purchases IS
    'AI真贋チェックの出品者課金管理。実費(~1円)に対してプラットフォームが価値提供する収益源。';
COMMENT ON COLUMN authenticity_purchases.fee_amount IS
    '¥98(¥1万未満) / ¥198(¥1万以上)。実APIコストは~1円のため利益率99%。';

CREATE INDEX idx_auth_purchases_listing   ON authenticity_purchases(listing_id);
CREATE INDEX idx_auth_purchases_seller    ON authenticity_purchases(seller_id);
CREATE INDEX idx_auth_purchases_session   ON authenticity_purchases(stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

-- RLS
ALTER TABLE authenticity_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_purchases_own ON authenticity_purchases
    FOR ALL USING (auth.uid() = seller_id);

-- -----------------------------------------------------------------------------
-- listings テーブルに真贋チェック状態カラムを追加
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'listings' AND column_name = 'authenticity_purchase_id'
    ) THEN
        ALTER TABLE listings
            ADD COLUMN authenticity_purchase_id UUID
                REFERENCES authenticity_purchases(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN listings.authenticity_purchase_id IS
    'AI真贋チェック購入レコードへの参照。NULLの場合は未購入。';
