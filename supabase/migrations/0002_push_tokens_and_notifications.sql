-- =============================================================================
-- Migration: 0002_push_tokens_and_notifications
-- Expo プッシュ通知トークン管理テーブルと通知テーブル拡張
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: push_tokens
-- 目的: Expo Push Notification トークンの管理
-- RLS方針: 本人のみ参照・操作可
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,                          -- Expo Push Token
    platform    VARCHAR(10) NOT NULL                    -- 'ios' | 'android' | 'web'
                CHECK (platform IN ('ios', 'android', 'web')),
    device_id   TEXT,                                   -- デバイス識別子（重複防止）
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,          -- 有効フラグ
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_push_token UNIQUE (user_id, token)
);

COMMENT ON TABLE push_tokens IS 'Expo プッシュ通知トークン。platform別に管理。DeviceNotRegistered時にis_active=falseに更新。';

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own_only" ON push_tokens
    FOR ALL USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- テーブル: notifications の拡張（カラム追加）
-- related_entity_type カラムが未定義の場合に追加
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'related_entity_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_entity_type VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'title'
    ) THEN
        ALTER TABLE notifications ADD COLUMN title VARCHAR(200);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'body'
    ) THEN
        ALTER TABLE notifications ADD COLUMN body TEXT;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- テーブル: stripe_events
-- 目的: Stripe Webhook イベントの冪等性管理（重複処理防止）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events (
    id              VARCHAR(255) PRIMARY KEY,           -- Stripe Event ID
    type            VARCHAR(100) NOT NULL,              -- イベント種別
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload         JSONB                               -- 元データ（デバッグ用）
);

COMMENT ON TABLE stripe_events IS 'Stripe Webhookイベントの処理済み記録。冪等性のために使用。';

CREATE INDEX idx_stripe_events_type ON stripe_events(type);
CREATE INDEX idx_stripe_events_processed ON stripe_events(processed_at);
