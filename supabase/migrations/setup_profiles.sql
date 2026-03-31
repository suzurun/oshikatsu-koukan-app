-- =============================================================================
-- 最小限のセットアップSQL（登録・ログインに必要なテーブルのみ）
-- Supabase SQL Editorで実行してください
-- =============================================================================

-- ENUM型定義
DO $$ BEGIN
  CREATE TYPE membership_type AS ENUM ('free', 'premium');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('independent', 'parent', 'child');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended_24h', 'suspended_7d', 'suspended', 'banned', 'deactivated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- profiles テーブル
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name        VARCHAR(50)  NOT NULL DEFAULT '',
    username            VARCHAR(30)  UNIQUE NOT NULL,
    avatar_url          TEXT,
    bio                 TEXT,
    favorite_artists    TEXT[],
    account_type        account_type NOT NULL DEFAULT 'independent',
    parent_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
    membership_type     membership_type NOT NULL DEFAULT 'free',
    premium_expires_at  TIMESTAMPTZ,
    stripe_customer_id  VARCHAR(255) UNIQUE,
    status              user_status NOT NULL DEFAULT 'active',
    suspended_until     TIMESTAMPTZ,
    is_verified_seller  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_username_format CHECK (
        username ~ '^[a-z0-9_]{3,30}$'
    )
);

-- =============================================================================
-- credit_scores テーブル
-- =============================================================================
CREATE TABLE IF NOT EXISTS credit_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    score                   NUMERIC(5,2) NOT NULL DEFAULT 100.00
                            CHECK (score >= 0 AND score <= 100),
    total_transactions      INTEGER NOT NULL DEFAULT 0,
    completed_transactions  INTEGER NOT NULL DEFAULT 0,
    violation_adjustment    NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    recovery_transactions   INTEGER NOT NULL DEFAULT 0,
    deposit_amount          INTEGER NOT NULL DEFAULT 500,
    can_trade               BOOLEAN NOT NULL DEFAULT TRUE,
    daily_match_limit       SMALLINT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- fraud_risk_scores テーブル
-- =============================================================================
CREATE TABLE IF NOT EXISTS fraud_risk_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    risk_score              NUMERIC(5,2) NOT NULL DEFAULT 0
                            CHECK (risk_score BETWEEN 0 AND 100),
    risk_level              VARCHAR(20) NOT NULL DEFAULT 'low'
                            CHECK (risk_level IN ('low','medium','high','critical')),
    burst_listing_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
    unusual_login_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
    duplicate_image_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
    social_graph_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_under_review         BOOLEAN NOT NULL DEFAULT FALSE,
    is_auto_blocked         BOOLEAN NOT NULL DEFAULT FALSE,
    review_required_reason  TEXT,
    last_calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- updated_at 自動更新トリガー
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_updated_at_profiles ON profiles;
CREATE TRIGGER trig_updated_at_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trig_updated_at_credit_scores ON credit_scores;
CREATE TRIGGER trig_updated_at_credit_scores
BEFORE UPDATE ON credit_scores
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- プロフィール作成時に信用スコアを自動初期化
-- =============================================================================
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO credit_scores (user_id, score, deposit_amount, can_trade, daily_match_limit)
    VALUES (NEW.id, 100.00, 500, TRUE, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO fraud_risk_scores (user_id, risk_score, risk_level)
    VALUES (NEW.id, 0.00, 'low')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trig_initialize_user_data ON profiles;
CREATE TRIGGER trig_initialize_user_data
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION initialize_user_data();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_select_own ON credit_scores;
CREATE POLICY credit_select_own ON credit_scores
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 完了メッセージ
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE '✅ profiles, credit_scores, fraud_risk_scores テーブルの作成完了！';
END $$;



