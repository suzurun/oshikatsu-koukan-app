-- =============================================================================
-- 推し活×AI C2Cプラットフォーム - PostgreSQL (Supabase) スキーマ定義
-- Database: oshikatsu_marketplace
-- Version: 1.0.0
-- Created: 2026-02-23
-- Target Scale: Phase1=100K users, Phase3=10M users / 1B+ records
-- =============================================================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- 全文検索用
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- 範囲インデックス用

-- =============================================================================
-- ENUM型定義
-- =============================================================================

-- ユーザーステータス
CREATE TYPE user_status AS ENUM (
    'active',       -- 通常利用可
    'suspended_24h',-- 24時間停止
    'suspended_7d', -- 7日停止
    'suspended',    -- 無期限停止
    'banned',       -- 永久停止
    'deactivated'   -- 退会
);

-- 会員種別
CREATE TYPE membership_type AS ENUM (
    'free',     -- 無料会員
    'premium'   -- プレミアム会員（月額385円）
);

-- eKYCステータス
CREATE TYPE kyc_status AS ENUM (
    'not_started', -- 未実施
    'pending',     -- 審査中
    'approved',    -- 承認済
    'rejected',    -- 否認
    'expired'      -- 有効期限切れ（再認証が必要）
);

-- 親子アカウント種別
CREATE TYPE account_type AS ENUM (
    'independent', -- 単独（成人）
    'parent',      -- 親アカウント
    'child'        -- 子アカウント（18歳未満）
);

-- 出品ステータス
CREATE TYPE listing_status AS ENUM (
    'draft',       -- 下書き
    'ai_checking', -- AI審査中
    'active',      -- 公開中
    'reserved',    -- 取引中（予約済み）
    'sold',        -- 売却済み・交換完了
    'withdrawn',   -- 取り下げ（出品者都合）
    'removed'      -- 強制削除（モデレーション）
);

-- 取引種別
CREATE TYPE transaction_type AS ENUM (
    'sale',          -- 売買
    'exchange',      -- 物々交換
    'local_exchange' -- 現地交換
);

-- 取引ステータス（エスクローフロー対応）
CREATE TYPE transaction_status AS ENUM (
    'requested',            -- 申請中（購入者が申し込み）
    'agreed',               -- 双方合意済み
    'kyc_required',         -- KYC待ち（初回取引）
    'deposit_held',         -- デポジット保留中
    'shipping_unlocked',    -- 発送解禁（双方「発送準備OK」済み）
    'shipped_by_seller',    -- 出品者発送済み
    'shipped_by_buyer',     -- 購入者（交換相手）発送済み
    'both_shipped',         -- 双方発送済み
    'delivered',            -- 配達完了
    'receipt_confirmed',    -- 受取確認済み
    'completed',            -- 取引完了（代金リリース済み）
    'cancelled',            -- キャンセル（双方合意）
    'auto_cancelled',       -- 自動キャンセル（72h未発送）
    'disputed',             -- 紛争申立中
    'dispute_resolved'      -- 紛争解決済み
);

-- エスクロー・デポジットステータス
CREATE TYPE escrow_status AS ENUM (
    'holding',   -- 保留中
    'released',  -- リリース済み（出品者へ）
    'refunded',  -- 返金済み（購入者へ）
    'forfeited'  -- 没収（違反による）
);

-- 紛争理由
CREATE TYPE dispute_reason AS ENUM (
    'item_not_received',     -- 商品未着
    'item_not_as_described', -- 商品説明と相違
    'counterfeit',           -- 偽物・コピー品
    'damaged',               -- 破損
    'wrong_item',            -- 誤送品
    'seller_non_responsive', -- 出品者連絡不通
    'other'                  -- その他
);

-- 紛争判定結果
CREATE TYPE dispute_outcome AS ENUM (
    'pending',           -- 審査中
    'buyer_wins',        -- 申立者（買い手）勝訴
    'seller_wins',       -- 被申立者（売り手）勝訴
    'mutual_agreement',  -- 双方合意解決
    'no_fault'           -- 双方無過失
);

-- 通知種別
CREATE TYPE notification_type AS ENUM (
    'price_alert',          -- 価格アラート
    'transaction_status',   -- 取引状態変更
    'match_request',        -- マッチリクエスト
    'match_accepted',       -- マッチ承認
    'shipping_reminder',    -- 発送リマインド（24h/48h）
    'auto_cancel_warning',  -- 自動キャンセル警告（72h直前）
    'receipt_reminder',     -- 受取確認リマインド
    'dispute_update',       -- 紛争更新
    'kyc_result',           -- KYC審査結果
    'credit_score_change',  -- 信用スコア変更
    'moderation_action',    -- モデレーション処分
    'system'                -- システム通知
);

-- 証拠ファイル種別
CREATE TYPE evidence_type AS ENUM (
    'image',  -- 画像
    'video'   -- 動画
);

-- 通報対象種別
CREATE TYPE report_target_type AS ENUM (
    'listing', -- 出品
    'user'     -- ユーザー
);

-- モデレーション処分種別
CREATE TYPE moderation_action_type AS ENUM (
    'warning',          -- 警告
    'suspend_24h',      -- 24時間停止
    'suspend_7d',       -- 7日停止
    'permanent_ban',    -- 永久停止
    'listing_removed',  -- 出品強制削除
    'credit_deduct'     -- 信用スコア減点
);

-- 価格アラート条件種別
CREATE TYPE price_alert_condition AS ENUM (
    'below',      -- 指定価格以下
    'above',      -- 指定価格以上
    'any_change'  -- 変動検知
);

-- 違反種別（信用スコア減点用）
CREATE TYPE violation_type AS ENUM (
    'unshipped',              -- 未発送（−15%）
    'dispute_lost',           -- 紛争敗北（−20%）
    'local_no_show',          -- 現地ドタキャン（−10%）
    'policy_violation',       -- 重大規約違反（−10%）
    'fraud_detected',         -- 詐欺行為検知（即時停止）
    'both_unshipped_minor'    -- 双方未発送・軽微（−2%相当）
);

-- 配送業者
CREATE TYPE carrier_type AS ENUM (
    'yamato',     -- ヤマト運輸
    'sagawa',     -- 佐川急便
    'japanpost',  -- 日本郵便
    'seino',      -- 西濃運輸
    'other'       -- その他
);

-- 詐欺行動ログ種別
CREATE TYPE fraud_signal_type AS ENUM (
    'burst_listing',         -- バースト出品
    'unusual_login',         -- 通常と異なるログイン
    'duplicate_image',       -- 重複画像使い回し
    'inconsistent_payment',  -- 不整合な決済情報
    'suspicious_review',     -- 不審なレビューパターン
    'external_redirect',     -- 外部誘導
    'social_graph_cluster'   -- 詐欺師ネットワーク検出
);


-- =============================================================================
-- 1. ユーザー・認証ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: profiles
-- 目的: Supabase Auth（auth.users）と1:1で紐づくユーザープロフィール
--       auth.usersのidをPKとして利用（UUIDが一致）
-- RLS方針: 全ユーザーが参照可（公開情報）、本人のみ更新可
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name        VARCHAR(50)  NOT NULL,                          -- 表示名（公開）
    username            VARCHAR(30)  UNIQUE NOT NULL,                   -- @ユーザー名（公開）
    avatar_url          TEXT,                                           -- アイコン画像URL（Supabase Storage）
    bio                 TEXT CHECK (LENGTH(bio) <= 500),                -- 自己紹介（500文字以内）
    favorite_artists    TEXT[],                                         -- 推しアーティスト（最大10件）
    account_type        account_type NOT NULL DEFAULT 'independent',    -- 親子アカウント種別
    parent_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,-- 親アカウントID（子のみ）
    membership_type     membership_type NOT NULL DEFAULT 'free',        -- 会員種別
    premium_expires_at  TIMESTAMPTZ,                                    -- プレミアム有効期限
    stripe_customer_id  VARCHAR(255) UNIQUE,                            -- Stripe顧客ID
    status              user_status NOT NULL DEFAULT 'active',          -- アカウントステータス
    suspended_until     TIMESTAMPTZ,                                    -- 停止解除日時
    is_verified_seller  BOOLEAN NOT NULL DEFAULT FALSE,                 -- 継続的販売者フラグ（特商法）
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_child_has_parent CHECK (
        account_type != 'child' OR parent_id IS NOT NULL               -- 子は必ず親IDを持つ
    ),
    CONSTRAINT chk_username_format CHECK (
        username ~ '^[a-z0-9_]{3,30}$'                                -- 英小文字・数字・アンダースコア3〜30文字
    )
);

COMMENT ON TABLE profiles IS 'ユーザープロフィール（Supabase Auth連携）。auth.usersと1:1対応。';
COMMENT ON COLUMN profiles.favorite_artists IS '推しアーティスト配列。最大10件推奨。';
COMMENT ON COLUMN profiles.account_type IS 'independent=単独成人, parent=親, child=18歳未満の子';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Connect 顧客ID（エスクロー・デポジット決済用）';

-- インデックス
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_status ON profiles(status) WHERE status != 'active';
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_profiles_membership ON profiles(membership_type, premium_expires_at);


-- -----------------------------------------------------------------------------
-- テーブル: kyc_records
-- 目的: eKYC（電子本人確認）の申請・審査状態管理
-- RLS方針: 本人のみ参照・更新可。管理者は全件参照可。
-- -----------------------------------------------------------------------------
CREATE TABLE kyc_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status              kyc_status NOT NULL DEFAULT 'not_started',      -- 審査ステータス
    kyc_provider        VARCHAR(50),                                     -- 利用eKYCプロバイダ（TRUSTDOCK等）
    external_kyc_id     VARCHAR(255),                                   -- プロバイダ側の審査ID
    kyc_fee_paid        BOOLEAN NOT NULL DEFAULT FALSE,                  -- KYC費用300円支払済み
    kyc_fee_payment_id  VARCHAR(255),                                   -- Stripe Payment Intent ID
    submitted_at        TIMESTAMPTZ,                                    -- 申請日時
    approved_at         TIMESTAMPTZ,                                    -- 承認日時
    rejected_at         TIMESTAMPTZ,                                    -- 否認日時
    rejection_reason    TEXT,                                           -- 否認理由（非公開）
    expires_at          TIMESTAMPTZ,                                    -- KYC有効期限
    nfc_verified        BOOLEAN NOT NULL DEFAULT FALSE,                  -- NFCマイナンバーカード認証済み
    liveness_verified   BOOLEAN NOT NULL DEFAULT FALSE,                  -- ライブ動画認証済み
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_kyc_one_active_per_user UNIQUE (user_id, status)    -- 同一ユーザーが複数active持てない
);

COMMENT ON TABLE kyc_records IS 'eKYC（電子本人確認）申請・審査記録。古物営業法3万円超取引で必須。';
COMMENT ON COLUMN kyc_records.kyc_fee_paid IS '審査費用300円。審査通過後返金不可、不通過は全額返金。';


-- =============================================================================
-- 2. 信用スコアドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: credit_scores
-- 目的: ユーザーの信用スコア（0〜100%）のスナップショット管理
--       計算式: 正常完了 ÷ 全取引 × 100 − 重大違反補正
-- RLS方針: 本人・取引相手は参照可。管理者は全件参照・更新可。
-- -----------------------------------------------------------------------------
CREATE TABLE credit_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    score                   NUMERIC(5,2) NOT NULL DEFAULT 100.00          -- 信用スコア（0.00〜100.00）
                            CHECK (score >= 0 AND score <= 100),
    total_transactions      INTEGER NOT NULL DEFAULT 0,                   -- 全取引数
    completed_transactions  INTEGER NOT NULL DEFAULT 0,                   -- 正常完了取引数
    violation_adjustment    NUMERIC(5,2) NOT NULL DEFAULT 0.00,           -- 重大違反による補正値（負の値）
    recovery_transactions   INTEGER NOT NULL DEFAULT 0,                   -- 回復用正常取引カウンタ（最大3）
    -- デポジット連動ロジック（DB計算）
    deposit_amount          INTEGER NOT NULL DEFAULT 500                  -- 必要デポジット額（円）
                            CHECK (deposit_amount >= 0),
    can_trade               BOOLEAN NOT NULL DEFAULT TRUE,                -- 取引可否（20%未満で false）
    -- 当日モード上限（スコア連動）
    daily_match_limit       SMALLINT NOT NULL DEFAULT 0,                  -- 当日モード上限回数
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE credit_scores IS '信用スコア管理。score = 完了÷全取引×100 − 違反補正。20%未満は取引不可。';
COMMENT ON COLUMN credit_scores.recovery_transactions IS '正常取引3回で違反補正を完全回復。このカウンタが3に達したらviolation_adjustmentをリセット。';
COMMENT ON COLUMN credit_scores.deposit_amount IS '信頼度80%以上=500円, 60-79%=500円, 40-59%=800円, 20-39%=1000円, 20%未満=取引不可';

-- インデックス
CREATE INDEX idx_credit_scores_score ON credit_scores(score);
CREATE INDEX idx_credit_scores_can_trade ON credit_scores(can_trade);


-- -----------------------------------------------------------------------------
-- テーブル: violation_records
-- 目的: 信用スコアに影響する違反履歴の詳細記録
-- RLS方針: 本人・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE violation_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_id      UUID,                                           -- 関連取引ID（後でFK追加）
    violation_type      violation_type NOT NULL,                        -- 違反種別
    score_deduction     NUMERIC(5,2) NOT NULL,                          -- 実際の減点値（正の数で記録）
    is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,                  -- 解決済みか（解決で補正半減）
    resolved_at         TIMESTAMPTZ,                                    -- 解決日時
    recovery_count      INTEGER NOT NULL DEFAULT 0,                     -- この違反後の回復取引数
    is_recovered        BOOLEAN NOT NULL DEFAULT FALSE,                  -- 正常取引3回で完全回復済み
    notes               TEXT,                                           -- 管理者メモ
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE violation_records IS '信用スコア違反履歴。解決成立で補正半減、正常取引3回で完全回復。';
COMMENT ON COLUMN violation_records.score_deduction IS '未発送=15, 紛争敗北=20, 現地ドタキャン=10, 規約違反=10, 双方未発送=2';

-- インデックス
CREATE INDEX idx_violations_user_id ON violation_records(user_id);
CREATE INDEX idx_violations_type ON violation_records(violation_type);
CREATE INDEX idx_violations_unresolved ON violation_records(user_id, is_resolved) WHERE NOT is_resolved;


-- =============================================================================
-- 3. カテゴリ・出品・商品ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: categories
-- 目的: 階層カテゴリマスター（コンサートグッズ・アニメ等）
-- RLS方針: 全ユーザー参照可。管理者のみ更新可。
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES categories(id) ON DELETE RESTRICT,  -- 親カテゴリ（NULLはルート）
    name            VARCHAR(100) NOT NULL,                               -- カテゴリ名
    name_en         VARCHAR(100),                                        -- 英語名（将来グローバル展開用）
    slug            VARCHAR(100) UNIQUE NOT NULL,                        -- URLスラッグ
    description     TEXT,                                                -- 説明
    icon_url        TEXT,                                                -- アイコンURL
    sort_order      INTEGER NOT NULL DEFAULT 0,                          -- 表示順
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,                       -- 有効フラグ
    depth           SMALLINT NOT NULL DEFAULT 0,                         -- 階層深さ（0=ルート）
    path            TEXT NOT NULL DEFAULT '',                            -- 階層パス（例: /concert-goods/photo）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS '階層カテゴリマスター。Phase1=推し活特化、Phase3=全品目拡張対応。';
COMMENT ON COLUMN categories.path IS '階層パス（例: /idol-goods/concert/photo）。全文検索・階層フィルタ用。';

-- インデックス
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_path ON categories USING GIN (path gin_trgm_ops);


-- -----------------------------------------------------------------------------
-- テーブル: listings
-- 目的: 出品マスター。売買・物々交換・現地交換を統合管理。
-- RLS方針: activeは全員参照可。本人のみdraft参照・編集可。管理者は全件参照可。
-- 注意: 1,000万件超を想定。created_atによるパーティショニング計画あり。
-- -----------------------------------------------------------------------------
CREATE TABLE listings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    category_id             UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title                   VARCHAR(100) NOT NULL,                       -- 商品タイトル
    description             TEXT NOT NULL CHECK (LENGTH(description) <= 10000),
    condition               VARCHAR(20) NOT NULL                         -- 商品状態
                            CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    transaction_type        transaction_type NOT NULL,                    -- 取引種別
    asking_price            INTEGER,                                     -- 希望価格（円）。交換のみの場合はNULL可
    exchange_wants          TEXT,                                        -- 交換希望商品の説明
    -- AIフラグ
    ai_authenticity_score   NUMERIC(5,2) CHECK (ai_authenticity_score BETWEEN 0 AND 100), -- AI真贋スコア
    ai_checked_at           TIMESTAMPTZ,                                 -- AI審査完了日時
    is_ai_flagged           BOOLEAN NOT NULL DEFAULT FALSE,              -- AI要確認フラグ
    ai_flag_reason          TEXT,                                        -- AIフラグ理由
    -- ウォッチ・人気指標（非正規化キャッシュ）
    wishlist_count          INTEGER NOT NULL DEFAULT 0,                   -- 「欲しい！」登録数
    view_count              INTEGER NOT NULL DEFAULT 0,                   -- 閲覧数
    -- ステータス
    status                  listing_status NOT NULL DEFAULT 'draft',
    published_at            TIMESTAMPTZ,                                 -- 公開日時
    sold_at                 TIMESTAMPTZ,                                 -- 売却・交換完了日時
    -- アーティスト・イベント連携（推し活特化）
    artist_name             VARCHAR(100),                                -- アーティスト名（フリー入力）
    event_id                UUID,                                        -- 関連イベントID（後でFK追加）
    -- 検索用
    search_vector           TSVECTOR,                                    -- 全文検索ベクトル
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listings IS '出品テーブル。売買・物々交換・現地交換を統一管理。Phase3では1000万件超を想定。';
COMMENT ON COLUMN listings.condition IS 'new=新品, like_new=未使用に近い, good=良い, fair=目立つ傷あり, poor=傷・汚れあり';
COMMENT ON COLUMN listings.search_vector IS 'title+descriptionの全文検索ベクトル。トリガーで自動更新。';

-- インデックス（クエリパターン最適化）
CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_active ON listings(category_id, published_at DESC) WHERE status = 'active';
CREATE INDEX idx_listings_price ON listings(asking_price) WHERE status = 'active';
CREATE INDEX idx_listings_artist ON listings(artist_name) WHERE artist_name IS NOT NULL;
CREATE INDEX idx_listings_search ON listings USING GIN (search_vector);
CREATE INDEX idx_listings_ai_flagged ON listings(is_ai_flagged) WHERE is_ai_flagged = TRUE;
CREATE INDEX idx_listings_wishlist ON listings(wishlist_count DESC) WHERE status = 'active';
CREATE INDEX idx_listings_event ON listings(event_id) WHERE event_id IS NOT NULL;

-- 全文検索ベクトル自動更新トリガー
CREATE OR REPLACE FUNCTION update_listing_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('japanese', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('japanese', COALESCE(NEW.artist_name, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_listing_search
BEFORE INSERT OR UPDATE OF title, description, artist_name ON listings
FOR EACH ROW EXECUTE FUNCTION update_listing_search_vector();


-- -----------------------------------------------------------------------------
-- テーブル: listing_images
-- 目的: 出品商品画像（複数枚対応）
-- RLS方針: 出品参照権限に準じる。本人のみ登録・削除可。
-- -----------------------------------------------------------------------------
CREATE TABLE listing_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_path    TEXT NOT NULL,                                       -- Supabase Storage パス
    url             TEXT NOT NULL,                                       -- 公開URL
    sort_order      SMALLINT NOT NULL DEFAULT 0,                         -- 表示順（0が先頭）
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,                      -- メイン画像フラグ
    -- AI画像解析結果
    image_hash      VARCHAR(64),                                         -- perceptual hash（重複検知用）
    ai_label        VARCHAR(100),                                        -- AI識別ラベル（商品名等）
    ai_condition    VARCHAR(20),                                         -- AI判定状態
    ai_authenticity_score NUMERIC(5,2),                                  -- AIの真贋スコア
    width_px        INTEGER,                                             -- 画像幅（px）
    height_px       INTEGER,                                             -- 画像高さ（px）
    file_size_bytes INTEGER,                                             -- ファイルサイズ
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listing_images IS '出品商品画像。複数枚対応。image_hashで重複画像を検知（詐欺防止）。';
COMMENT ON COLUMN listing_images.image_hash IS 'perceptual hash値。同一・類似画像の使い回しを検知する詐欺防止機能。';

-- インデックス
CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX idx_listing_images_hash ON listing_images(image_hash) WHERE image_hash IS NOT NULL;
CREATE UNIQUE INDEX idx_listing_images_primary ON listing_images(listing_id) WHERE is_primary = TRUE;


-- -----------------------------------------------------------------------------
-- テーブル: wishlists
-- 目的: 「欲しい！」登録（ウォッチリスト）
-- RLS方針: 登録者本人のみ参照・操作可
-- -----------------------------------------------------------------------------
CREATE TABLE wishlists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_user_listing UNIQUE (user_id, listing_id)
);

COMMENT ON TABLE wishlists IS '「欲しい！」登録。AI需要予測のシグナルとして活用。listings.wishlist_countと同期。';

-- インデックス
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_listing_id ON wishlists(listing_id);

-- wishlist_count同期トリガー
CREATE OR REPLACE FUNCTION sync_wishlist_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE listings SET wishlist_count = wishlist_count + 1 WHERE id = NEW.listing_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE listings SET wishlist_count = GREATEST(wishlist_count - 1, 0) WHERE id = OLD.listing_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_sync_wishlist_count
AFTER INSERT OR DELETE ON wishlists
FOR EACH ROW EXECUTE FUNCTION sync_wishlist_count();


-- =============================================================================
-- 4. AI価格分析ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: ai_price_analyses
-- 目的: AI算出の価格分析結果（出品ごとに最新1件を保持・更新）
-- RLS方針: 出品参照権限に準じる（activeは全員可、freemiumで一部制限）
-- -----------------------------------------------------------------------------
CREATE TABLE ai_price_analyses (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id                  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    -- AI価格提案3パターン
    early_sell_price            INTEGER,                                 -- 早期売却価格（すぐ売れる下限）
    recommended_price           INTEGER,                                 -- 推奨価格（市場中央値）
    premium_price               INTEGER,                                 -- プレミア価格（希少性高の場合）
    price_range_min             INTEGER,                                 -- 推奨価格下限
    price_range_max             INTEGER,                                 -- 推奨価格上限
    -- 希少性スコア
    rarity_score                NUMERIC(5,2) NOT NULL DEFAULT 0          -- 希少性スコア（0〜100）
                                CHECK (rarity_score BETWEEN 0 AND 100),
    rarity_label                VARCHAR(20)                              -- 'common'|'semi_rare'|'rare'|'ultra_rare'
                                CHECK (rarity_label IN ('common','semi_rare','rare','ultra_rare')),
    -- 需要予測
    demand_forecast_30d         INTEGER,                                 -- 今後30日の推定需要人数
    demand_forecast_updated_at  TIMESTAMPTZ,                            -- 需要予測最終更新日時
    -- 供給情報（全プラットフォーム合計）
    total_supply_count          INTEGER,                                 -- 全プラットフォームの現在出品数
    -- イベントドリブン価格予測
    price_trend                 VARCHAR(20)                              -- 'surge'|'peak'|'declining'|'stable'|'bottom'
                                CHECK (price_trend IN ('surge','peak','declining','stable','bottom')),
    event_id                    UUID,                                    -- 関連イベントID（価格予測の根拠）
    -- AI解析メタ情報
    ai_model_version            VARCHAR(50),                             -- 使用AIモデルバージョン
    analysis_confidence         NUMERIC(3,2)                            -- 分析信頼度（0.00〜1.00）
                                CHECK (analysis_confidence BETWEEN 0 AND 1),
    analyzed_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_analysis_at            TIMESTAMPTZ,                             -- 次回再分析予定日時
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_price_analyses IS 'AI価格分析結果。早期売却・推奨・プレミアの3価格帯を提示。希少性スコア・需要予測を含む。';
COMMENT ON COLUMN ai_price_analyses.rarity_label IS '0-20=common, 21-50=semi_rare, 51-80=rare, 81-100=ultra_rare';
COMMENT ON COLUMN ai_price_analyses.price_trend IS '公演前後のイベントドリブン価格トレンド予測';

-- インデックス
CREATE UNIQUE INDEX idx_ai_analyses_listing ON ai_price_analyses(listing_id);
CREATE INDEX idx_ai_analyses_rarity ON ai_price_analyses(rarity_score DESC);
CREATE INDEX idx_ai_analyses_trend ON ai_price_analyses(price_trend) WHERE price_trend IS NOT NULL;


-- -----------------------------------------------------------------------------
-- テーブル: market_price_data
-- 目的: クロスプラットフォーム相場データ（メルカリ・ヤフオク・eBay等）
--       日次バッチで収集・更新。出品ごとではなく商品カテゴリ・キーワード単位で管理。
-- RLS方針: プレミアム会員は全件参照可。無料会員は最新件数のみ参照可。
-- -----------------------------------------------------------------------------
CREATE TABLE market_price_data (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID REFERENCES listings(id) ON DELETE SET NULL, -- 関連出品（NULL=汎用相場）
    product_keyword     VARCHAR(200) NOT NULL,                           -- 検索キーワード（商品名等）
    artist_name         VARCHAR(100),                                    -- アーティスト名
    platform            VARCHAR(20) NOT NULL                             -- データ取得元プラットフォーム
                        CHECK (platform IN ('mercari','yahoo_auction','ebay','vinted','depop','internal')),
    platform_item_id    VARCHAR(255),                                    -- プラットフォーム側のアイテムID
    sold_price          INTEGER NOT NULL,                                -- 成約価格（円換算）
    original_currency   VARCHAR(3) NOT NULL DEFAULT 'JPY',              -- 元の通貨
    original_price      NUMERIC(12,2),                                  -- 元の価格（外貨の場合）
    exchange_rate       NUMERIC(10,4),                                   -- 為替レート（USD/GBP→JPY）
    condition           VARCHAR(20),                                     -- 出品状態
    sold_at             TIMESTAMPTZ NOT NULL,                            -- 成約日時
    url                 TEXT,                                            -- 元データURL
    total_count         INTEGER,                                         -- 同キーワードの収集件数
    price_min           INTEGER,                                         -- 価格帯下限
    price_max           INTEGER,                                         -- 価格帯上限
    price_median        INTEGER,                                         -- 価格帯中央値
    collected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),              -- データ収集日時
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE market_price_data IS 'クロスプラットフォーム相場データ。日次バッチ収集。AI価格分析の入力データ。';
COMMENT ON COLUMN market_price_data.platform IS 'mercari/yahoo_auction/ebay/vinted/depop/internal（自社）';

-- インデックス
CREATE INDEX idx_market_data_listing ON market_price_data(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_market_data_keyword ON market_price_data USING GIN (product_keyword gin_trgm_ops);
CREATE INDEX idx_market_data_platform ON market_price_data(platform, sold_at DESC);
CREATE INDEX idx_market_data_artist ON market_price_data(artist_name) WHERE artist_name IS NOT NULL;


-- -----------------------------------------------------------------------------
-- テーブル: price_alerts
-- 目的: ユーザーが設定した価格アラート（欲しいリスト連動）
-- RLS方針: 本人のみ参照・設定可
-- -----------------------------------------------------------------------------
CREATE TABLE price_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id      UUID REFERENCES listings(id) ON DELETE CASCADE,      -- 特定出品へのアラート
    keyword         VARCHAR(200),                                        -- キーワードアラート（出品監視）
    artist_name     VARCHAR(100),                                        -- アーティスト名フィルタ
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,   -- カテゴリフィルタ
    condition       price_alert_condition NOT NULL DEFAULT 'below',      -- アラート条件
    target_price    INTEGER,                                             -- 目標価格（円）
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,                       -- アラート有効フラグ
    is_premium_only BOOLEAN NOT NULL DEFAULT FALSE,                      -- プレミアム専用アラートフラグ
    last_notified_at TIMESTAMPTZ,                                        -- 最終通知日時
    triggered_count INTEGER NOT NULL DEFAULT 0,                          -- 通知回数
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_alert_has_target CHECK (
        listing_id IS NOT NULL OR keyword IS NOT NULL                    -- どちらか必須
    )
);

COMMENT ON TABLE price_alerts IS 'AI価格アラート設定。プレミアム会員は全プラットフォーム横断アラートが可能。';
COMMENT ON COLUMN price_alerts.is_premium_only IS 'TRUEの場合、プレミアム会員のみ利用可能なアラート設定。';

-- インデックス
CREATE INDEX idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_listing ON price_alerts(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active, keyword) WHERE is_active = TRUE;


-- =============================================================================
-- 5. 取引ドメイン（最重要）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: transactions
-- 目的: 全取引の中核テーブル。売買・交換・現地交換を統合管理。
-- RLS方針: 当事者（売買双方）のみ参照可。管理者は全件参照可。
-- 注意: エスクロー・デポジット情報を含む機密テーブル。
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type            transaction_type NOT NULL,               -- 取引種別
    status                      transaction_status NOT NULL DEFAULT 'requested',
    -- 当事者
    seller_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    buyer_id                    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    -- 出品
    listing_id                  UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    exchange_listing_id         UUID REFERENCES listings(id) ON DELETE RESTRICT, -- 交換の場合の相手出品
    -- 価格
    agreed_price                INTEGER,                                 -- 合意価格（円）。交換のみはNULL可
    platform_fee                INTEGER,                                 -- プラットフォーム手数料（180円×2）
    -- 発送情報（売り手側）
    seller_tracking_number      VARCHAR(100),                            -- 追跡番号（売り手）
    seller_carrier              carrier_type,                            -- 配送業者（売り手）
    seller_shipped_at           TIMESTAMPTZ,                             -- 発送日時（売り手）
    seller_shipping_deadline    TIMESTAMPTZ,                             -- 発送期限（発送解禁後72時間）
    seller_ready_to_ship        BOOLEAN NOT NULL DEFAULT FALSE,          -- 「発送準備OK」フラグ
    -- 発送情報（買い手側・交換の場合）
    buyer_tracking_number       VARCHAR(100),                            -- 追跡番号（買い手）
    buyer_carrier               carrier_type,                            -- 配送業者（買い手）
    buyer_shipped_at            TIMESTAMPTZ,                             -- 発送日時（買い手）
    buyer_shipping_deadline     TIMESTAMPTZ,                             -- 発送期限（交換の場合）
    buyer_ready_to_ship         BOOLEAN NOT NULL DEFAULT FALSE,          -- 「発送準備OK」フラグ（交換時）
    -- 受取確認
    buyer_received_at           TIMESTAMPTZ,                             -- 受取確認日時（買い手）
    seller_received_at          TIMESTAMPTZ,                             -- 受取確認日時（売り手・交換時）
    auto_complete_at            TIMESTAMPTZ,                             -- 自動完了予定日時（配達後72h）
    -- キャンセル
    cancelled_by                UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    cancel_reason               TEXT,
    cancelled_at                TIMESTAMPTZ,
    -- タイムライン
    agreed_at                   TIMESTAMPTZ,                             -- 双方合意日時
    shipping_unlocked_at        TIMESTAMPTZ,                             -- 発送解禁日時
    completed_at                TIMESTAMPTZ,                             -- 完了日時
    -- KYC連携
    kyc_required                BOOLEAN NOT NULL DEFAULT FALSE,          -- KYC必要フラグ
    kyc_completed               BOOLEAN NOT NULL DEFAULT FALSE,          -- KYC完了フラグ
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_not_self_trade CHECK (seller_id != buyer_id),
    CONSTRAINT chk_exchange_listing CHECK (
        transaction_type != 'exchange' OR exchange_listing_id IS NOT NULL
    )
);

COMMENT ON TABLE transactions IS '取引テーブル。エスクローフロー: 申請→合意→発送解禁→発送→受取確認→完了。';
COMMENT ON COLUMN transactions.seller_shipping_deadline IS '発送解禁後72時間以内に発送必須。超過で自動判定。';
COMMENT ON COLUMN transactions.auto_complete_at IS '配達完了から72時間後。申立なし→自動完了→代金リリース。';

-- インデックス
CREATE INDEX idx_transactions_seller ON transactions(seller_id, status);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id, status);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_active ON transactions(status, auto_complete_at)
    WHERE status IN ('shipped_by_seller','both_shipped','delivered');
CREATE INDEX idx_transactions_shipping_deadline ON transactions(seller_shipping_deadline)
    WHERE status = 'shipping_unlocked';


-- -----------------------------------------------------------------------------
-- テーブル: escrow_records
-- 目的: Stripe Connectを利用したエスクロー管理
--       購入者が支払い → 代金保留 → 受取確認後にリリース
-- RLS方針: 当事者のみ参照可。管理者は全件参照・操作可。
-- -----------------------------------------------------------------------------
CREATE TABLE escrow_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id              UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    -- Stripe情報
    stripe_payment_intent_id    VARCHAR(255) UNIQUE,                     -- Stripe PaymentIntent ID
    stripe_charge_id            VARCHAR(255),                            -- Stripe Charge ID
    stripe_transfer_id          VARCHAR(255),                            -- Stripe Transfer ID（出品者へのリリース）
    stripe_refund_id            VARCHAR(255),                            -- Stripe Refund ID（返金時）
    -- 金額
    held_amount                 INTEGER NOT NULL,                        -- 保留金額（円）
    platform_fee_amount         INTEGER NOT NULL DEFAULT 0,              -- プラットフォーム手数料額
    release_amount              INTEGER,                                 -- リリース予定額（手数料差引後）
    -- ステータス
    status                      escrow_status NOT NULL DEFAULT 'holding',
    released_at                 TIMESTAMPTZ,                             -- リリース日時
    refunded_at                 TIMESTAMPTZ,                             -- 返金日時
    release_reason              TEXT,                                    -- リリース理由
    refund_reason               TEXT,                                    -- 返金理由
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE escrow_records IS 'Stripe Connect エスクロー管理。受取確認or72h経過で自動リリース。';
COMMENT ON COLUMN escrow_records.stripe_payment_intent_id IS 'Stripe PaymentIntent ID。決済・返金の根拠レコード。';


-- -----------------------------------------------------------------------------
-- テーブル: deposit_records
-- 目的: 取引ごとのデポジット管理
--       信用スコア連動デポジット（500〜1000円）の保留・没収・返却
-- RLS方針: 当事者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE deposit_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id              UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    user_id                     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    -- Stripe情報
    stripe_payment_intent_id    VARCHAR(255) UNIQUE,                     -- デポジット用 PaymentIntent
    stripe_refund_id            VARCHAR(255),                            -- 返金時の Refund ID
    -- 金額
    deposit_amount              INTEGER NOT NULL,                        -- デポジット額（円）
    -- ステータス
    status                      escrow_status NOT NULL DEFAULT 'holding',
    forfeited_reason            TEXT,                                    -- 没収理由（未発送等）
    forfeited_at                TIMESTAMPTZ,                             -- 没収日時
    returned_at                 TIMESTAMPTZ,                             -- 返却日時
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE deposit_records IS 'デポジット管理。信頼度80%以上=500円、20%未満=取引不可。未発送時は没収。';
COMMENT ON COLUMN deposit_records.status IS 'holding=保留中, released=返却済, forfeited=没収（未発送等違反時）';


-- =============================================================================
-- 6. 現地交換・当日モードドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: events
-- 目的: イベント・公演マスター（アーティスト・会場・日時）
-- RLS方針: 全ユーザー参照可。管理者・認証ユーザーが登録可。
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,                               -- イベント名
    artist_name     VARCHAR(100) NOT NULL,                               -- アーティスト名
    venue_name      VARCHAR(200),                                        -- 会場名
    venue_address   TEXT,                                                -- 会場住所
    venue_lat       NUMERIC(10,7),                                       -- 緯度（当日モードのGeo利用）
    venue_lng       NUMERIC(10,7),                                       -- 経度
    event_date      DATE NOT NULL,                                       -- 公演日
    start_time      TIME,                                                -- 開演時間
    end_time        TIME,                                                -- 終演予定時間
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,                        -- 有効フラグ
    source_url      TEXT,                                                -- 公演情報ソースURL
    created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,     -- 登録ユーザー
    verified        BOOLEAN NOT NULL DEFAULT FALSE,                      -- 管理者確認済みフラグ
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE events IS 'イベント・公演マスター。AI価格予測のイベントドリブン分析・当日モードの基盤。';
COMMENT ON COLUMN events.venue_lat IS '当日モードのGeo位置情報活用（半径500m以内チェックイン判定等）';

-- インデックス
CREATE INDEX idx_events_artist ON events(artist_name);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_active ON events(event_date, is_active) WHERE is_active = TRUE;

-- listings.event_id FK追加（循環回避のため後から追加）
ALTER TABLE listings
    ADD CONSTRAINT fk_listings_event FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE SET NULL;

ALTER TABLE ai_price_analyses
    ADD CONSTRAINT fk_ai_analyses_event FOREIGN KEY (event_id)
    REFERENCES events(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------------------
-- テーブル: event_checkins
-- 目的: 公演チェックイン管理（当日モード・現地交換の入場証明）
--       1公演につき1ユーザー1チェックイン
-- RLS方針: 本人のみ参照・操作可
-- -----------------------------------------------------------------------------
CREATE TABLE event_checkins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),                  -- チェックイン日時
    lat             NUMERIC(10,7),                                       -- チェックイン時の緯度
    lng             NUMERIC(10,7),                                       -- チェックイン時の経度
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,                      -- 位置情報・QR検証済みフラグ
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_checkin_user_event UNIQUE (user_id, event_id)         -- 1公演1回のみ
);

COMMENT ON TABLE event_checkins IS '公演チェックイン。当日モード利用条件の一つ（チェックイン必須）。1公演1ユーザー1回のみ。';

-- インデックス
CREATE INDEX idx_checkins_event ON event_checkins(event_id, checked_in_at);
CREATE INDEX idx_checkins_user ON event_checkins(user_id);


-- -----------------------------------------------------------------------------
-- テーブル: instant_match_requests
-- 目的: 当日モード（即マッチ）リクエスト管理
--       利用条件: プレミアム会員 + 信頼度60%以上 + チェックイン済
-- RLS方針: 本人・マッチ相手のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE instant_match_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE, -- 自分の出品
    wants_description   TEXT NOT NULL,                                   -- 欲しい商品の説明
    wants_artist        VARCHAR(100),                                    -- 欲しいアーティスト
    status              VARCHAR(20) NOT NULL DEFAULT 'open'             -- open|matched|cancelled|expired
                        CHECK (status IN ('open','matched','cancelled','expired')),
    matched_with        UUID REFERENCES profiles(id) ON DELETE SET NULL, -- マッチした相手
    match_transaction_id UUID,                                           -- 発生した取引ID
    expires_at          TIMESTAMPTZ,                                     -- リクエスト有効期限
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE instant_match_requests IS '当日モード即マッチリクエスト。プレミアム会員+信頼度60%以上+チェックイン済が利用条件。';

-- インデックス
CREATE INDEX idx_match_requests_event ON instant_match_requests(event_id, status) WHERE status = 'open';
CREATE INDEX idx_match_requests_requester ON instant_match_requests(requester_id);


-- -----------------------------------------------------------------------------
-- テーブル: match_histories
-- 目的: 当日マッチ履歴・キャンセル回数管理（乱用防止）
-- RLS方針: 本人のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE match_histories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    matched_user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_request_id    UUID NOT NULL REFERENCES instant_match_requests(id) ON DELETE CASCADE,
    transaction_id      UUID,                                            -- 発生した取引ID
    is_cancelled        BOOLEAN NOT NULL DEFAULT FALSE,                   -- キャンセルされたか
    cancelled_by        UUID REFERENCES profiles(id) ON DELETE SET NULL, -- キャンセルした側
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE match_histories IS '当日マッチ履歴。3回連続キャンセルで公演中停止。同一相手1公演1回制限の検証用。';

-- インデックス
CREATE INDEX idx_match_history_event_user ON match_histories(event_id, user_id);
CREATE INDEX idx_match_history_cancel ON match_histories(user_id, is_cancelled) WHERE is_cancelled = TRUE;
-- 同一相手1公演1回制限チェック用
CREATE UNIQUE INDEX idx_match_history_unique_pair
    ON match_histories(event_id, LEAST(user_id::text, matched_user_id::text)::uuid,
                                  GREATEST(user_id::text, matched_user_id::text)::uuid);


-- =============================================================================
-- 7. 紛争ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: disputes
-- 目的: 紛争申立の管理。申立期限は配達完了から48時間以内。
-- RLS方針: 申立者・被申立者・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE disputes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id          UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
    claimant_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, -- 申立者
    respondent_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT, -- 被申立者
    reason                  dispute_reason NOT NULL,                     -- 紛争理由
    description             TEXT NOT NULL CHECK (LENGTH(description) <= 5000),
    -- 判定
    outcome                 dispute_outcome NOT NULL DEFAULT 'pending',
    outcome_reason          TEXT,                                        -- 判定理由
    decided_by              UUID REFERENCES profiles(id) ON DELETE RESTRICT, -- 判定した管理者
    decided_at              TIMESTAMPTZ,
    -- 返送処理
    return_required         BOOLEAN NOT NULL DEFAULT FALSE,               -- 返送が必要か
    return_tracking_number  VARCHAR(100),                                -- 返送追跡番号
    return_carrier          carrier_type,                                -- 返送配送業者
    return_completed_at     TIMESTAMPTZ,                                 -- 返送完了日時
    return_shipping_payer   UUID REFERENCES profiles(id) ON DELETE RESTRICT, -- 送料負担者
    -- 申立期限
    claim_deadline          TIMESTAMPTZ NOT NULL,                        -- 申立期限（配達完了+48h）
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE disputes IS '紛争申立。配達完了から48時間以内が申立期限。開封動画なしは原則不利。';
COMMENT ON COLUMN disputes.return_shipping_payer IS '問題発生側が送料負担。追跡必須。返送完了で処理確定。';

-- インデックス
CREATE INDEX idx_disputes_transaction ON disputes(transaction_id);
CREATE INDEX idx_disputes_claimant ON disputes(claimant_id);
CREATE INDEX idx_disputes_outcome ON disputes(outcome) WHERE outcome = 'pending';


-- -----------------------------------------------------------------------------
-- テーブル: dispute_evidences
-- 目的: 紛争申立の証拠ファイル（画像・動画URL）
-- RLS方針: 申立者・被申立者・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE dispute_evidences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id      UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    submitted_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    evidence_type   evidence_type NOT NULL,                              -- image/video
    storage_path    TEXT NOT NULL,                                       -- Supabase Storage パス
    url             TEXT NOT NULL,                                       -- 公開URL
    description     TEXT,                                                -- 証拠の説明
    is_opening_video BOOLEAN NOT NULL DEFAULT FALSE,                     -- 開封動画フラグ（有利証拠）
    file_size_bytes INTEGER,
    duration_sec    INTEGER,                                             -- 動画の場合の再生時間（秒）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dispute_evidences IS '紛争証拠ファイル。開封動画は is_opening_video=TRUE でフラグ。動画なしは原則不利。';

-- インデックス
CREATE INDEX idx_dispute_evidences_dispute ON dispute_evidences(dispute_id);


-- =============================================================================
-- 8. 詐欺検知ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: fraud_risk_scores
-- 目的: ユーザーごとの詐欺リスクスコア（0〜100）
--       行動ログ・ルールエンジンにより算出・更新
-- RLS方針: 本人は参照可（スコアのみ）。管理者は全件参照・更新可。
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_risk_scores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    risk_score              NUMERIC(5,2) NOT NULL DEFAULT 0              -- 詐欺リスクスコア（0〜100）
                            CHECK (risk_score BETWEEN 0 AND 100),
    risk_level              VARCHAR(20) NOT NULL DEFAULT 'low'           -- low|medium|high|critical
                            CHECK (risk_level IN ('low','medium','high','critical')),
    -- 個別シグナルスコア
    burst_listing_score     NUMERIC(5,2) NOT NULL DEFAULT 0,             -- バースト出品シグナル
    unusual_login_score     NUMERIC(5,2) NOT NULL DEFAULT 0,             -- 異常ログインシグナル
    duplicate_image_score   NUMERIC(5,2) NOT NULL DEFAULT 0,             -- 重複画像シグナル
    social_graph_score      NUMERIC(5,2) NOT NULL DEFAULT 0,             -- ソーシャルグラフ異常
    -- 処置状態
    is_under_review         BOOLEAN NOT NULL DEFAULT FALSE,               -- 審査中フラグ
    is_auto_blocked         BOOLEAN NOT NULL DEFAULT FALSE,               -- 自動ブロック中
    review_required_reason  TEXT,                                        -- 審査が必要な理由
    last_calculated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),          -- 最終計算日時
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fraud_risk_scores IS '詐欺リスクスコア。0-30=通常, 31-60=追加確認, 61-80=要認証, 81-100=取引停止+管理者通知。';
COMMENT ON COLUMN fraud_risk_scores.risk_level IS 'low(0-30)/medium(31-60)/high(61-80)/critical(81-100)';

-- インデックス
CREATE INDEX idx_fraud_scores_risk ON fraud_risk_scores(risk_score DESC);
CREATE INDEX idx_fraud_scores_level ON fraud_risk_scores(risk_level) WHERE risk_level != 'low';
CREATE INDEX idx_fraud_scores_review ON fraud_risk_scores(is_under_review) WHERE is_under_review = TRUE;


-- -----------------------------------------------------------------------------
-- テーブル: fraud_transaction_scores
-- 目的: 取引ごとの詐欺リスクスコア（取引申請時に算出）
-- RLS方針: 当事者・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_transaction_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
    risk_score      NUMERIC(5,2) NOT NULL DEFAULT 0
                    CHECK (risk_score BETWEEN 0 AND 100),
    risk_level      VARCHAR(20) NOT NULL DEFAULT 'low'
                    CHECK (risk_level IN ('low','medium','high','critical')),
    risk_factors    JSONB,                                               -- リスク要因の詳細（JSON）
    calculated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fraud_transaction_scores IS '取引単位の詐欺リスクスコア。取引申請時に算出。';

-- インデックス
CREATE INDEX idx_fraud_tx_score ON fraud_transaction_scores(risk_score DESC);
CREATE INDEX idx_fraud_tx_level ON fraud_transaction_scores(risk_level) WHERE risk_level != 'low';


-- -----------------------------------------------------------------------------
-- テーブル: fraud_behavior_logs
-- 目的: 行動ログ（ログイン・出品・取引の異常シグナル記録）
--       教師なし機械学習のトレーニングデータ兼リアルタイム検知ソース
-- RLS方針: 管理者のみ参照可
-- 注意: 大量データ。月次パーティショニング推奨（Phase2以降）
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_behavior_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    signal_type     fraud_signal_type NOT NULL,                          -- シグナル種別
    severity        SMALLINT NOT NULL DEFAULT 1                          -- 重大度（1=低〜5=最高）
                    CHECK (severity BETWEEN 1 AND 5),
    -- コンテキスト情報
    ip_address      INET,                                                -- IPアドレス
    device_id       VARCHAR(255),                                        -- デバイスID
    user_agent      TEXT,                                                -- ユーザーエージェント
    geo_country     VARCHAR(2),                                          -- 国コード（ISO 3166-1 alpha-2）
    geo_city        VARCHAR(100),                                        -- 都市
    -- 関連エンティティ
    related_listing_id     UUID REFERENCES listings(id) ON DELETE SET NULL,
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    related_user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL, -- ソーシャルグラフ関連ユーザー
    -- 詳細データ
    metadata        JSONB,                                               -- シグナル固有の詳細データ
    is_confirmed    BOOLEAN,                                             -- 確定（NULL=未確認）
    confirmed_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,     -- 確認した管理者
    confirmed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);                                       -- 月次パーティション

COMMENT ON TABLE fraud_behavior_logs IS '行動ログ（異常シグナル記録）。ML学習データ兼リアルタイム検知ソース。月次パーティション対応。';

-- 初期パーティション（2026年）
CREATE TABLE fraud_behavior_logs_2026_01 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE fraud_behavior_logs_2026_02 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE fraud_behavior_logs_2026_03 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE fraud_behavior_logs_2026_04 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE fraud_behavior_logs_2026_05 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE fraud_behavior_logs_2026_06 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE fraud_behavior_logs_2026_07 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE fraud_behavior_logs_2026_08 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE fraud_behavior_logs_2026_09 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE fraud_behavior_logs_2026_10 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE fraud_behavior_logs_2026_11 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE fraud_behavior_logs_2026_12 PARTITION OF fraud_behavior_logs
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- インデックス
CREATE INDEX idx_fraud_logs_user ON fraud_behavior_logs(user_id, created_at DESC);
CREATE INDEX idx_fraud_logs_signal ON fraud_behavior_logs(signal_type, severity);
CREATE INDEX idx_fraud_logs_ip ON fraud_behavior_logs(ip_address, created_at DESC);
CREATE INDEX idx_fraud_logs_device ON fraud_behavior_logs(device_id) WHERE device_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- テーブル: fraud_flag_histories
-- 目的: フラグ履歴（管理者レビュー・処置の追跡）
-- RLS方針: 管理者のみ参照・操作可
-- -----------------------------------------------------------------------------
CREATE TABLE fraud_flag_histories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    flagged_by      VARCHAR(20) NOT NULL DEFAULT 'system'               -- 'system'|'admin'|'auto_rule'
                    CHECK (flagged_by IN ('system','admin','auto_rule')),
    flag_type       fraud_signal_type NOT NULL,
    description     TEXT NOT NULL,
    action_taken    TEXT,                                                -- 取った処置
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fraud_flag_histories IS '詐欺フラグ履歴。管理者レビュー・処置の追跡記録。';

-- インデックス
CREATE INDEX idx_flag_histories_user ON fraud_flag_histories(user_id);
CREATE INDEX idx_flag_histories_unresolved ON fraud_flag_histories(resolved) WHERE NOT resolved;


-- =============================================================================
-- 9. モデレーションドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: reports
-- 目的: ユーザーによる通報（出品・ユーザー対象）
--       重み付けスコアで仮非表示判定（合計5以上で仮非表示）
-- RLS方針: 通報者本人・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type         report_target_type NOT NULL,                     -- listing/user
    target_listing_id   UUID REFERENCES listings(id) ON DELETE CASCADE,  -- 通報対象出品
    target_user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- 通報対象ユーザー
    reason              VARCHAR(50) NOT NULL,                            -- 通報理由コード
    description         TEXT CHECK (LENGTH(description) <= 1000),        -- 詳細説明
    -- 重み付けスコア
    reporter_rank       VARCHAR(1) NOT NULL DEFAULT 'C'                  -- 通報者ランク（A/B/C）
                        CHECK (reporter_rank IN ('A','B','C')),
    weight_score        NUMERIC(3,1) NOT NULL DEFAULT 1.0,               -- A=2.0, B=1.5, C=1.0
    -- 処理状態
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'           -- pending|reviewed|resolved|dismissed
                        CHECK (status IN ('pending','reviewed','resolved','dismissed')),
    reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL, -- レビューした管理者
    reviewed_at         TIMESTAMPTZ,
    resolution          TEXT,                                            -- 対応内容
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_report_has_target CHECK (
        (target_listing_id IS NOT NULL AND target_type = 'listing') OR
        (target_user_id IS NOT NULL AND target_type = 'user')
    )
);

COMMENT ON TABLE reports IS '通報テーブル。重み付けスコア（Aランク=2, Bランク=1.5, Cランク=1）。合計5以上で仮非表示。';
COMMENT ON COLUMN reports.reporter_rank IS 'A=信用スコア80%以上, B=60-79%, C=60%未満（信用スコアで動的に決定）';

-- インデックス
CREATE INDEX idx_reports_listing ON reports(target_listing_id) WHERE target_listing_id IS NOT NULL;
CREATE INDEX idx_reports_user ON reports(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';


-- -----------------------------------------------------------------------------
-- テーブル: moderation_actions
-- 目的: 違反処分履歴（警告・停止・永久停止）
--       4回目で永久停止（1回=警告, 2回=24h停止, 3回=7日停止, 4回=永久停止）
-- RLS方針: 処分対象ユーザー・管理者のみ参照可
-- -----------------------------------------------------------------------------
CREATE TABLE moderation_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type         moderation_action_type NOT NULL,                 -- 処分種別
    action_count        SMALLINT NOT NULL DEFAULT 1,                    -- 累計違反回数
    reason              TEXT NOT NULL,                                   -- 処分理由
    report_id           UUID REFERENCES reports(id) ON DELETE SET NULL,  -- 起因となった通報
    related_listing_id  UUID REFERENCES listings(id) ON DELETE SET NULL, -- 関連出品
    -- 処分期間
    suspended_from      TIMESTAMPTZ,                                    -- 停止開始日時
    suspended_until     TIMESTAMPTZ,                                    -- 停止解除日時
    -- 実施者
    actioned_by         UUID REFERENCES profiles(id) ON DELETE SET NULL, -- 処分実施管理者（NULLは自動）
    is_automated        BOOLEAN NOT NULL DEFAULT FALSE,                  -- 自動処分フラグ
    -- 信用スコア影響
    credit_deduction    NUMERIC(5,2),                                   -- 信用スコア減点額
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE moderation_actions IS '違反処分履歴。1回=警告, 2回=24h停止, 3回=7日停止, 4回=永久停止。';
COMMENT ON COLUMN moderation_actions.action_count IS '累計違反回数。この値を基に次回処分レベルを決定。';

-- インデックス
CREATE INDEX idx_moderation_user ON moderation_actions(target_user_id, created_at DESC);
CREATE INDEX idx_moderation_type ON moderation_actions(action_type);
CREATE INDEX idx_moderation_active ON moderation_actions(target_user_id, suspended_until)
    WHERE suspended_until > NOW();


-- =============================================================================
-- 10. 通知ドメイン
-- =============================================================================

-- -----------------------------------------------------------------------------
-- テーブル: notifications
-- 目的: 全通知の統合管理（価格アラート・取引状態変更・マッチング等）
-- RLS方針: 宛先ユーザー本人のみ参照・既読更新可
-- 注意: 大量データ。6ヶ月超の通知はアーカイブ推奨（パーティション対応）
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type   notification_type NOT NULL,                      -- 通知種別
    title               VARCHAR(200) NOT NULL,                           -- 通知タイトル
    body                TEXT NOT NULL,                                   -- 通知本文
    -- 関連エンティティ（ディープリンク用）
    related_transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
    related_listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,
    related_dispute_id      UUID REFERENCES disputes(id) ON DELETE SET NULL,
    related_event_id        UUID REFERENCES events(id) ON DELETE SET NULL,
    related_user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- 配信
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,                   -- 既読フラグ
    read_at             TIMESTAMPTZ,                                     -- 既読日時
    is_push_sent        BOOLEAN NOT NULL DEFAULT FALSE,                   -- プッシュ通知送信済み
    push_sent_at        TIMESTAMPTZ,                                     -- プッシュ通知送信日時
    -- メタデータ
    metadata            JSONB,                                           -- 追加データ（価格等）
    expires_at          TIMESTAMPTZ,                                     -- 通知有効期限
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

COMMENT ON TABLE notifications IS '通知統合テーブル。月次パーティション対応。6ヶ月超はアーカイブ推奨。';

-- 初期パーティション
CREATE TABLE notifications_2026_01 PARTITION OF notifications
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE notifications_2026_02 PARTITION OF notifications
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE notifications_2026_03 PARTITION OF notifications
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE notifications_2026_04 PARTITION OF notifications
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE notifications_2026_05 PARTITION OF notifications
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE notifications_2026_06 PARTITION OF notifications
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE notifications_2026_07 PARTITION OF notifications
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE notifications_2026_08 PARTITION OF notifications
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE notifications_2026_09 PARTITION OF notifications
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE notifications_2026_10 PARTITION OF notifications
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE notifications_2026_11 PARTITION OF notifications
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE notifications_2026_12 PARTITION OF notifications
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- インデックス
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE NOT is_read;
CREATE INDEX idx_notifications_type ON notifications(notification_type, created_at DESC);
CREATE INDEX idx_notifications_transaction ON notifications(related_transaction_id) WHERE related_transaction_id IS NOT NULL;


-- =============================================================================
-- 遅延FK制約の追加（循環参照解消）
-- =============================================================================

-- violation_records.transaction_id → transactions.id
ALTER TABLE violation_records
    ADD CONSTRAINT fk_violations_transaction FOREIGN KEY (transaction_id)
    REFERENCES transactions(id) ON DELETE SET NULL;

-- match_histories.transaction_id → transactions.id
ALTER TABLE match_histories
    ADD CONSTRAINT fk_match_history_transaction FOREIGN KEY (transaction_id)
    REFERENCES transactions(id) ON DELETE SET NULL;

-- instant_match_requests.match_transaction_id → transactions.id
ALTER TABLE instant_match_requests
    ADD CONSTRAINT fk_match_req_transaction FOREIGN KEY (match_transaction_id)
    REFERENCES transactions(id) ON DELETE SET NULL;


-- =============================================================================
-- updated_at 自動更新トリガー（全テーブル共通）
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'profiles', 'kyc_records', 'credit_scores', 'violation_records',
        'categories', 'listings', 'wishlists', 'ai_price_analyses',
        'market_price_data', 'price_alerts', 'transactions',
        'escrow_records', 'deposit_records', 'events', 'event_checkins',
        'instant_match_requests', 'disputes', 'fraud_risk_scores',
        'fraud_flag_histories', 'reports', 'moderation_actions'
    ]
    LOOP
        EXECUTE format('
            CREATE TRIGGER trig_updated_at_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        ', t, t);
    END LOOP;
END;
$$;


-- =============================================================================
-- 信用スコア自動計算トリガー
-- =============================================================================
CREATE OR REPLACE FUNCTION recalculate_credit_score()
RETURNS TRIGGER AS $$
DECLARE
    v_score NUMERIC(5,2);
    v_deposit INTEGER;
    v_can_trade BOOLEAN;
    v_match_limit SMALLINT;
BEGIN
    -- 完了率計算
    SELECT
        CASE
            WHEN total_transactions = 0 THEN 100.00
            ELSE LEAST(
                (completed_transactions::NUMERIC / total_transactions::NUMERIC * 100) + violation_adjustment,
                100.00
            )
        END
    INTO v_score
    FROM credit_scores
    WHERE user_id = NEW.user_id;

    v_score := GREATEST(v_score, 0);

    -- デポジット・取引可否
    v_can_trade := v_score >= 20;
    v_deposit := CASE
        WHEN v_score >= 80 THEN 500
        WHEN v_score >= 60 THEN 500
        WHEN v_score >= 40 THEN 800
        WHEN v_score >= 20 THEN 1000
        ELSE 0
    END;

    -- 当日モード上限
    v_match_limit := CASE
        WHEN v_score >= 90 THEN 20
        WHEN v_score >= 80 THEN 15
        WHEN v_score >= 60 THEN 10
        ELSE 0
    END;

    UPDATE credit_scores SET
        score = v_score,
        deposit_amount = v_deposit,
        can_trade = v_can_trade,
        daily_match_limit = v_match_limit,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_recalculate_credit_score
AFTER UPDATE OF completed_transactions, total_transactions, violation_adjustment
ON credit_scores
FOR EACH ROW EXECUTE FUNCTION recalculate_credit_score();


-- =============================================================================
-- Row Level Security (RLS) ポリシー定義
-- =============================================================================

-- ---- profiles ----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_all ON profiles
    FOR SELECT USING (TRUE);                                             -- 全ユーザーが参照可

CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id);                                  -- 本人のみ更新可

CREATE POLICY profiles_insert_own ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);                             -- 本人のみ作成可

-- ---- kyc_records ----
ALTER TABLE kyc_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY kyc_select_own ON kyc_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY kyc_insert_own ON kyc_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- credit_scores ----
ALTER TABLE credit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_select_own ON credit_scores
    FOR SELECT USING (auth.uid() = user_id);                             -- 本人のみ（スコアは公開しない）

-- ---- violation_records ----
ALTER TABLE violation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY violations_select_own ON violation_records
    FOR SELECT USING (auth.uid() = user_id);

-- ---- categories ----
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_select_all ON categories
    FOR SELECT USING (is_active = TRUE);

-- ---- listings ----
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY listings_select_active ON listings
    FOR SELECT USING (
        status = 'active'                                                -- 公開出品は全員参照可
        OR auth.uid() = seller_id                                        -- 本人は全ステータス参照可
    );

CREATE POLICY listings_insert_own ON listings
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY listings_update_own ON listings
    FOR UPDATE USING (auth.uid() = seller_id AND status IN ('draft','active'));

-- ---- listing_images ----
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_images_select ON listing_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id
            AND (l.status = 'active' OR l.seller_id = auth.uid())
        )
    );

CREATE POLICY listing_images_insert_own ON listing_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = auth.uid()
        )
    );

-- ---- wishlists ----
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY wishlists_select_own ON wishlists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY wishlists_insert_own ON wishlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY wishlists_delete_own ON wishlists
    FOR DELETE USING (auth.uid() = user_id);

-- ---- ai_price_analyses ----
ALTER TABLE ai_price_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_analyses_select ON ai_price_analyses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.status = 'active'
        )
    );

-- ---- market_price_data ----
ALTER TABLE market_price_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY market_data_select_premium ON market_price_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
                p.membership_type = 'premium'
                AND (p.premium_expires_at IS NULL OR p.premium_expires_at > NOW())
            )
        )
        OR listing_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM listings l
            WHERE l.id = listing_id AND l.seller_id = auth.uid()
        )
    );

-- ---- price_alerts ----
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_alerts_own ON price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- ---- transactions ----
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_select_parties ON transactions
    FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY transactions_insert_buyer ON transactions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY transactions_update_parties ON transactions
    FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- ---- escrow_records ----
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_select_parties ON escrow_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.id = transaction_id
            AND (t.seller_id = auth.uid() OR t.buyer_id = auth.uid())
        )
    );

-- ---- deposit_records ----
ALTER TABLE deposit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY deposit_select_own ON deposit_records
    FOR SELECT USING (auth.uid() = user_id);

-- ---- events ----
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select_all ON events
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY events_insert_auth ON events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---- event_checkins ----
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY checkins_select_own ON event_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY checkins_insert_own ON event_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---- instant_match_requests ----
ALTER TABLE instant_match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_req_select_parties ON instant_match_requests
    FOR SELECT USING (
        auth.uid() = requester_id
        OR auth.uid() = matched_with
        OR (status = 'open' AND EXISTS (  -- チェックイン済みユーザーはopenなリクエストを参照可
            SELECT 1 FROM event_checkins ec
            WHERE ec.user_id = auth.uid() AND ec.event_id = event_id
        ))
    );

CREATE POLICY match_req_insert_own ON instant_match_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- ---- match_histories ----
ALTER TABLE match_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_history_select_own ON match_histories
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- ---- disputes ----
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY disputes_select_parties ON disputes
    FOR SELECT USING (auth.uid() = claimant_id OR auth.uid() = respondent_id);

CREATE POLICY disputes_insert_claimant ON disputes
    FOR INSERT WITH CHECK (auth.uid() = claimant_id);

-- ---- dispute_evidences ----
ALTER TABLE dispute_evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_select_parties ON dispute_evidences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM disputes d
            WHERE d.id = dispute_id
            AND (d.claimant_id = auth.uid() OR d.respondent_id = auth.uid())
        )
    );

CREATE POLICY evidence_insert_parties ON dispute_evidences
    FOR INSERT WITH CHECK (
        auth.uid() = submitted_by AND EXISTS (
            SELECT 1 FROM disputes d
            WHERE d.id = dispute_id
            AND (d.claimant_id = auth.uid() OR d.respondent_id = auth.uid())
        )
    );

-- ---- fraud_risk_scores ----
ALTER TABLE fraud_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY fraud_scores_select_own ON fraud_risk_scores
    FOR SELECT USING (auth.uid() = user_id);   -- スコア値のみ本人参照可（詳細はService Role）

-- ---- notifications ----
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_read ON notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---- reports ----
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_insert_auth ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY reports_select_own ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- ---- moderation_actions ----
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY moderation_select_target ON moderation_actions
    FOR SELECT USING (auth.uid() = target_user_id);


-- =============================================================================
-- 初期データ: カテゴリマスター
-- =============================================================================

-- ルートカテゴリ
INSERT INTO categories (id, parent_id, name, name_en, slug, depth, path, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001', NULL, 'コンサートグッズ', 'Concert Goods',     'concert-goods',  0, '/concert-goods',  1),
    ('00000000-0000-0000-0000-000000000002', NULL, 'アイドルグッズ',   'Idol Goods',         'idol-goods',     0, '/idol-goods',     2),
    ('00000000-0000-0000-0000-000000000003', NULL, 'アニメグッズ',     'Anime Goods',        'anime-goods',    0, '/anime-goods',    3),
    ('00000000-0000-0000-0000-000000000004', NULL, 'ゲームグッズ',     'Game Goods',         'game-goods',     0, '/game-goods',     4),
    ('00000000-0000-0000-0000-000000000005', NULL, 'コレクターズアイテム', 'Collectors Items','collectors',     0, '/collectors',     5),
    ('00000000-0000-0000-0000-000000000099', NULL, 'その他',           'Others',             'others',         0, '/others',        99);

-- コンサートグッズのサブカテゴリ
INSERT INTO categories (parent_id, name, name_en, slug, depth, path, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001', 'フォト・写真集',     'Photos',         'concert-goods/photos',      1, '/concert-goods/photos',      1),
    ('00000000-0000-0000-0000-000000000001', 'タオル・ハンカチ',   'Towels',         'concert-goods/towels',      1, '/concert-goods/towels',      2),
    ('00000000-0000-0000-0000-000000000001', 'うちわ・ペンライト', 'Fans & Lights',  'concert-goods/fans-lights', 1, '/concert-goods/fans-lights', 3),
    ('00000000-0000-0000-0000-000000000001', 'Tシャツ・アパレル',  'Apparel',        'concert-goods/apparel',     1, '/concert-goods/apparel',     4),
    ('00000000-0000-0000-0000-000000000001', 'アクリルスタンド',   'Acrylic Stands', 'concert-goods/acrylic',     1, '/concert-goods/acrylic',     5),
    ('00000000-0000-0000-0000-000000000001', 'ぬいぐるみ',         'Plushies',       'concert-goods/plushies',    1, '/concert-goods/plushies',    6),
    ('00000000-0000-0000-0000-000000000001', 'チケット・半券',     'Tickets',        'concert-goods/tickets',     1, '/concert-goods/tickets',     7),
    ('00000000-0000-0000-0000-000000000001', 'その他グッズ',       'Other Goods',    'concert-goods/others',      1, '/concert-goods/others',     99);

-- アイドルグッズのサブカテゴリ
INSERT INTO categories (parent_id, name, name_en, slug, depth, path, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000002', '生写真',             'Trading Cards',  'idol-goods/photos',         1, '/idol-goods/photos',         1),
    ('00000000-0000-0000-0000-000000000002', 'CD・DVD・Blu-ray',   'Media',          'idol-goods/media',          1, '/idol-goods/media',          2),
    ('00000000-0000-0000-0000-000000000002', 'グッズ全般',         'General Goods',  'idol-goods/general',        1, '/idol-goods/general',        3);


-- =============================================================================
-- ビュー: 公開用（RLS補完）
-- =============================================================================

-- アクティブ出品一覧（価格分析情報付き）
CREATE OR REPLACE VIEW v_active_listings AS
SELECT
    l.id,
    l.seller_id,
    p.display_name AS seller_name,
    p.avatar_url AS seller_avatar,
    cs.score AS seller_credit_score,
    l.category_id,
    l.title,
    l.description,
    l.condition,
    l.transaction_type,
    l.asking_price,
    l.exchange_wants,
    l.wishlist_count,
    l.view_count,
    l.artist_name,
    l.published_at,
    -- AI価格分析（集約）
    apa.early_sell_price,
    apa.recommended_price,
    apa.premium_price,
    apa.rarity_score,
    apa.rarity_label,
    apa.demand_forecast_30d,
    apa.price_trend,
    -- 主画像
    (SELECT url FROM listing_images li WHERE li.listing_id = l.id AND li.is_primary LIMIT 1) AS primary_image_url
FROM listings l
JOIN profiles p ON l.seller_id = p.id
JOIN credit_scores cs ON l.seller_id = cs.user_id
LEFT JOIN ai_price_analyses apa ON l.id = apa.listing_id
WHERE l.status = 'active';

COMMENT ON VIEW v_active_listings IS '公開出品一覧ビュー。出品者信用スコア・AI価格分析・主画像を結合。';


-- ユーザーダッシュボード用（本人のみ参照可能な統計）
CREATE OR REPLACE VIEW v_user_dashboard AS
SELECT
    p.id AS user_id,
    p.display_name,
    p.membership_type,
    p.premium_expires_at,
    p.status AS account_status,
    -- 信用スコア
    cs.score AS credit_score,
    cs.total_transactions,
    cs.completed_transactions,
    cs.can_trade,
    cs.deposit_amount,
    cs.daily_match_limit,
    -- KYC
    k.status AS kyc_status,
    k.approved_at AS kyc_approved_at,
    -- 出品統計
    (SELECT COUNT(*) FROM listings l WHERE l.seller_id = p.id AND l.status = 'active') AS active_listings,
    (SELECT COUNT(*) FROM wishlists w WHERE w.user_id = p.id) AS wishlist_count,
    -- 進行中取引
    (SELECT COUNT(*) FROM transactions t
     WHERE (t.seller_id = p.id OR t.buyer_id = p.id)
     AND t.status NOT IN ('completed','cancelled','auto_cancelled','dispute_resolved')) AS active_transactions
FROM profiles p
JOIN credit_scores cs ON p.id = cs.user_id
LEFT JOIN kyc_records k ON p.id = k.user_id AND k.status = 'approved'
WHERE p.id = auth.uid();

COMMENT ON VIEW v_user_dashboard IS 'ユーザーダッシュボード統計ビュー。auth.uid()でRLS適用済み。';


-- =============================================================================
-- 関数: 信用スコア初期化（プロフィール作成時に呼び出し）
-- =============================================================================
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- 信用スコアレコードを初期化
    INSERT INTO credit_scores (user_id, score, deposit_amount, can_trade, daily_match_limit)
    VALUES (NEW.id, 100.00, 500, TRUE, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 詐欺リスクスコアレコードを初期化
    INSERT INTO fraud_risk_scores (user_id, risk_score, risk_level)
    VALUES (NEW.id, 0.00, 'low')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trig_initialize_user_data
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION initialize_user_data();

COMMENT ON FUNCTION initialize_user_data IS 'プロフィール作成時に信用スコア・詐欺リスクスコアを自動初期化。';


-- =============================================================================
-- 関数: 取引完了時の信用スコア更新
-- =============================================================================
CREATE OR REPLACE FUNCTION update_credit_on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 売り手の完了カウントを増加
        UPDATE credit_scores
        SET
            completed_transactions = completed_transactions + 1,
            total_transactions = total_transactions + 1,
            recovery_transactions = LEAST(recovery_transactions + 1, 3)
        WHERE user_id = NEW.seller_id;

        -- 買い手の完了カウントを増加
        UPDATE credit_scores
        SET
            completed_transactions = completed_transactions + 1,
            total_transactions = total_transactions + 1,
            recovery_transactions = LEAST(recovery_transactions + 1, 3)
        WHERE user_id = NEW.buyer_id;

        -- 回復ロジック: recovery_transactions が 3 に達したら違反補正をリセット
        UPDATE credit_scores
        SET
            violation_adjustment = CASE
                WHEN recovery_transactions >= 3 THEN 0
                ELSE violation_adjustment
            END,
            recovery_transactions = CASE
                WHEN recovery_transactions >= 3 THEN 0
                ELSE recovery_transactions
            END
        WHERE user_id IN (NEW.seller_id, NEW.buyer_id)
          AND recovery_transactions >= 3;

    ELSIF NEW.status IN ('cancelled', 'auto_cancelled') AND OLD.status NOT IN ('cancelled','auto_cancelled') THEN
        -- キャンセル時は全取引数のみ増加（完了には含めない）
        UPDATE credit_scores
        SET total_transactions = total_transactions + 1
        WHERE user_id IN (NEW.seller_id, NEW.buyer_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trig_update_credit_on_transaction
AFTER UPDATE OF status ON transactions
FOR EACH ROW EXECUTE FUNCTION update_credit_on_transaction_complete();

COMMENT ON FUNCTION update_credit_on_transaction_complete IS '取引完了時に信用スコアを自動更新。正常取引3回で違反補正を完全回復。';


-- =============================================================================
-- スキーマ設計完了サマリー
-- =============================================================================
-- テーブル数: 27テーブル（パーティション含む）
-- ENUM型数: 20種
-- インデックス数: 60+
-- RLSポリシー数: 40+
-- トリガー: 6関数
-- ビュー: 2
-- 初期データ: カテゴリマスター（ルート6 + サブカテゴリ11）
-- パーティション対応: fraud_behavior_logs, notifications（月次・2026年分）
-- =============================================================================
