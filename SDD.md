# 推し活×AI C2Cプラットフォーム
## ソフトウェア設計書（SDD: Software Design Document）

**バージョン**: 1.0.0
**最終更新**: 2026-02-23
**対応要件定義書**: システム要件定義書 v3.0

---

## 目次

1. [システムアーキテクチャ概要](#1-システムアーキテクチャ概要)
2. [モノレポ構成](#2-モノレポ構成)
3. [データベース設計](#3-データベース設計)
4. [APIインターフェース設計](#4-apiインターフェース設計)
5. [コンポーネント設計](#5-コンポーネント設計)
6. [状態機械設計](#6-状態機械設計)
7. [AIパイプライン設計](#7-aiパイプライン設計)
8. [セキュリティ設計](#8-セキュリティ設計)
9. [インフラ・デプロイ設計](#9-インフラデプロイ設計)
10. [データフロー設計](#10-データフロー設計)
11. [エラーハンドリング設計](#11-エラーハンドリング設計)
12. [監視・ログ設計](#12-監視ログ設計)
13. [スケーリング戦略](#13-スケーリング戦略)

---

# 1. システムアーキテクチャ概要

## 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                    クライアント層                                 │
│                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────────────┐   │
│  │   Web App (Next.js)   │  │  Mobile App (Expo RN)         │   │
│  │   apps/web/           │  │  apps/mobile/                 │   │
│  │   Vercel ホスティング  │  │  iOS / Android                │   │
│  └──────────┬────────────┘  └───────────────┬───────────────┘   │
└─────────────│──────────────────────────────│──────────────────┘
              │  HTTPS / WebSocket            │
┌─────────────▼──────────────────────────────▼──────────────────┐
│                   Supabase BaaS層                               │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Supabase    │  │  Supabase    │  │  Supabase Storage    │  │
│  │ Auth (JWT)  │  │  Realtime    │  │  (画像ファイル)        │  │
│  └─────────────┘  │  (WebSocket) │  └──────────────────────┘  │
│                   └──────────────┘                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL 17 (RLS有効)                        │  │
│  │  27テーブル / 20 ENUM / 60+インデックス / 40+ RLSポリシー │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Supabase Edge Functions (Deno)                  │  │
│  │  analyze-price / transaction-action / create-transaction │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   外部APIサービス層                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Stripe       │  │ TRUSTDOCK    │  │ Google Vision API    │  │
│  │ Connect      │  │ eKYC         │  │ (画像認識)            │  │
│  │ (エスクロー)  │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │ Ximilar API  │  │ Claude API (claude-sonnet-4-6)           │ │
│  │ (コレクター  │  │ (価格分析・需要予測・NLPモデレーション)     │ │
│  │  価格DB)     │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 設計原則

| 原則 | 実装方針 |
|---|---|
| **BaaS First** | インフラ管理不要。Supabaseで認証・DB・Storage・Realtimeを一元化 |
| **RLS Security** | 全テーブルにRow Level Securityを適用。コード側での認可チェックを不要に |
| **Monorepo** | Turborepo + npm workspaces。型定義・APIクライアントを全アプリで共有 |
| **SSR + CSR ハイブリッド** | Next.js App Router。初期データはSSR、インタラクションはCSR |
| **Edge Functions** | AI・決済などの機密処理はサーバーサイドEdge Functionに集約 |
| **Fail Safe** | エスクロー決済は最悪の場合も資金が消失しない設計 |

---

# 2. モノレポ構成

## 2.1 ディレクトリ構造（実装済み）

```
OshikatsuKoukanAPP/
├── apps/
│   ├── web/                          # Next.js 15 (App Router)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx        # ルートレイアウト
│   │   │   │   ├── page.tsx          # / (リダイレクト)
│   │   │   │   ├── (main)/           # メインレイアウト（Navbar付き）
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx      # ホームページ
│   │   │   │   │   ├── search/page.tsx
│   │   │   │   │   ├── listings/[id]/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── BuyRequestButton.tsx  # Client Component
│   │   │   │   │   └── transactions/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── [id]/
│   │   │   │   │           ├── page.tsx
│   │   │   │   │           └── TransactionActions.tsx  # Client Component
│   │   │   │   ├── auth/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── kyc/page.tsx
│   │   │   │   └── listings/
│   │   │   │       └── new/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── layout/Navbar.tsx
│   │   │   │   └── listings/
│   │   │   │       ├── ListingCard.tsx
│   │   │   │       ├── ListingForm.tsx
│   │   │   │       ├── ImageUploader.tsx
│   │   │   │       └── AiPricePanel.tsx
│   │   │   ├── lib/supabase/
│   │   │   │   ├── server.ts         # SSR用Supabaseクライアント（Cookie認証）
│   │   │   │   └── client.ts         # CSR用Supabaseクライアント
│   │   │   ├── middleware.ts          # 認証保護ルート設定
│   │   │   └── app/globals.css
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── mobile/                       # Expo (React Native) SDK 52
│       ├── app/
│       │   ├── _layout.tsx           # Stack Navigator ルート
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx       # Tab Navigator (5タブ)
│       │   │   ├── index.tsx         # ホームタブ
│       │   │   ├── search.tsx        # 検索タブ
│       │   │   ├── sell.tsx          # 出品タブ
│       │   │   ├── transactions.tsx  # 取引中タブ
│       │   │   └── mypage.tsx        # マイページタブ (未実装)
│       │   ├── listings/
│       │   │   ├── [id].tsx          # 商品詳細
│       │   │   └── new.tsx           # 出品フォーム
│       │   ├── transactions/
│       │   │   └── [id].tsx          # 取引詳細
│       │   └── auth/
│       │       ├── _layout.tsx
│       │       ├── login.tsx
│       │       ├── register.tsx
│       │       └── kyc.tsx
│       ├── components/
│       │   └── MobileListingCard.tsx
│       ├── app.json                  # Bundle: jp.oshikatsu.market
│       └── package.json
│
├── packages/
│   ├── types/                        # @oshikatsu/types
│   │   └── src/index.ts              # 全共通TypeScript型定義
│   └── api-client/                   # @oshikatsu/api-client
│       └── src/index.ts              # Supabaseクライアント + API関数
│
├── supabase/
│   ├── migrations/
│   │   └── 0001_initial_schema.sql   # 1842行 完全スキーマ定義
│   └── functions/
│       ├── analyze-price/index.ts    # AI価格分析 Edge Function
│       └── transaction-action/index.ts  # 取引アクション Edge Function
│
├── turbo.json                        # Turborepo設定
├── package.json                      # npm workspaces root
├── .env.example                      # 環境変数テンプレート
├── システム要件定義書.md
└── SDD.md                            # 本ドキュメント
```

## 2.2 共有パッケージ仕様

### @oshikatsu/types

全アプリで共有するTypeScript型定義。

```typescript
// 主要型定義（packages/types/src/index.ts）
export type TransactionStatus = 'requested' | 'agreed' | 'kyc_required' |
  'deposit_held' | 'shipping_unlocked' | 'shipped_by_seller' |
  'shipped_by_buyer' | 'both_shipped' | 'delivered' |
  'receipt_confirmed' | 'completed' | 'cancelled' | 'auto_cancelled' |
  'disputed' | 'dispute_resolved'

export interface Transaction {
  id: string
  sellerId: string
  buyerId: string
  listingId: string
  exchangeListingId: string | null
  transactionType: TransactionType
  status: TransactionStatus
  agreedPrice: number | null
  depositAmount: number
  shippingDeadline: string | null
  createdAt: string
  updatedAt: string
}
```

### @oshikatsu/api-client

Supabaseクライアントシングルトンと主要API関数。

```typescript
// 主要エクスポート（packages/api-client/src/index.ts）
export const supabase           // Supabaseクライアント
export fetchActiveListings()    // 出品一覧取得（ページネーション）
export fetchListingById()       // 出品詳細取得（関連JOIN含む）
export createListing()          // 出品作成
export toggleWishlist()         // ウィッシュリスト追加/削除
export requestTransaction()     // 取引申請
export confirmShippingReady()   // 発送準備OK
export confirmReceipt()         // 受取確認
export analyzePrice()           // AI価格分析
export signInWithEmail()        // ログイン
export signUpWithEmail()        // 新規登録
export signOut()                // ログアウト
export getCurrentUser()         // 現在ユーザー取得
```

---

# 3. データベース設計

## 3.1 テーブル一覧（27テーブル）

| ドメイン | テーブル名 | 概要 |
|---|---|---|
| **ユーザー** | `profiles` | ユーザープロフィール（auth.users と 1:1） |
| **ユーザー** | `kyc_records` | eKYC申請・審査記録 |
| **信用スコア** | `credit_scores` | 信用スコアスナップショット |
| **信用スコア** | `violation_records` | 違反履歴（スコア減点根拠） |
| **カテゴリ** | `categories` | 階層カテゴリマスター |
| **出品** | `listings` | 出品マスター（売買・交換・現地） |
| **出品** | `listing_images` | 商品画像（複数枚対応） |
| **出品** | `wishlists` | 「欲しい！」登録 |
| **AI価格** | `ai_price_analyses` | AI価格分析結果 |
| **AI価格** | `market_price_data` | クロスプラットフォーム相場データ |
| **取引** | `transactions` | 取引マスター |
| **取引** | `escrow_records` | エスクロー・デポジット管理 |
| **取引** | `shipping_records` | 発送追跡記録 |
| **取引** | `transaction_reviews` | 取引評価（双方向） |
| **紛争** | `disputes` | 紛争申立記録 |
| **紛争** | `dispute_evidences` | 紛争証拠ファイル |
| **通知** | `notifications` | ユーザー通知 |
| **通知** | `price_alerts` | 価格アラート設定 |
| **モデレーション** | `reports` | 通報記録 |
| **モデレーション** | `moderation_logs` | 処分ログ |
| **詐欺検知** | `fraud_risk_scores` | 詐欺リスクスコア（ユーザー別） |
| **詐欺検知** | `fraud_behavior_logs` | 詐欺シグナルログ（行動別） |
| **当日モード** | `events` | 公演・イベントマスター |
| **当日モード** | `event_checkins` | 公演チェックイン記録 |
| **当日モード** | `local_exchange_slots` | 現地交換枠（当日マッチ用） |
| **検索** | `search_logs` | 検索ログ（需要シグナル） |
| **ビュー** | `v_active_listings` | 公開出品 + AI情報 + 出品者情報 結合ビュー |

## 3.2 主要テーブル詳細

### profiles

```sql
CREATE TABLE profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name        VARCHAR(50)  NOT NULL,
    username            VARCHAR(30)  UNIQUE NOT NULL,
    avatar_url          TEXT,
    bio                 TEXT CHECK (LENGTH(bio) <= 500),
    favorite_artists    TEXT[],                     -- 最大10件
    account_type        account_type DEFAULT 'independent',
    parent_id           UUID REFERENCES profiles(id),
    membership_type     membership_type DEFAULT 'free',
    premium_expires_at  TIMESTAMPTZ,
    stripe_customer_id  VARCHAR(255) UNIQUE,
    status              user_status DEFAULT 'active',
    is_verified_seller  BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_child_has_parent CHECK (
        account_type != 'child' OR parent_id IS NOT NULL
    ),
    CONSTRAINT chk_username_format CHECK (
        username ~ '^[a-z0-9_]{3,30}$'
    )
);
```

### listings

```sql
CREATE TABLE listings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id           UUID NOT NULL REFERENCES profiles(id),
    category_id         UUID NOT NULL REFERENCES categories(id),
    title               VARCHAR(100) NOT NULL,
    description         TEXT NOT NULL,
    condition           VARCHAR(20) NOT NULL,       -- new/like_new/good/fair/poor
    transaction_type    transaction_type NOT NULL,
    asking_price        INTEGER,                    -- 交換のみはNULL可
    exchange_wants      TEXT,
    ai_authenticity_score NUMERIC(5,2),
    is_ai_flagged       BOOLEAN DEFAULT FALSE,
    wishlist_count      INTEGER DEFAULT 0,
    view_count          INTEGER DEFAULT 0,
    status              listing_status DEFAULT 'draft',
    artist_name         VARCHAR(100),
    search_vector       TSVECTOR,                   -- 全文検索（トリガーで自動更新）
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
-- パーティション計画: Phase3でcreated_atによる月次パーティション
```

### transactions

```sql
CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id               UUID NOT NULL REFERENCES profiles(id),
    buyer_id                UUID NOT NULL REFERENCES profiles(id),
    listing_id              UUID NOT NULL REFERENCES listings(id),
    exchange_listing_id     UUID REFERENCES listings(id),  -- 交換の場合
    transaction_type        transaction_type NOT NULL,
    status                  transaction_status NOT NULL DEFAULT 'requested',
    agreed_price            INTEGER,
    deposit_amount          INTEGER NOT NULL DEFAULT 500,
    seller_shipping_ready   BOOLEAN DEFAULT FALSE,
    buyer_shipping_ready    BOOLEAN DEFAULT FALSE,
    shipping_deadline       TIMESTAMPTZ,            -- 発送期限（解禁後72h）
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
```

### escrow_records

```sql
CREATE TABLE escrow_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id              UUID NOT NULL REFERENCES transactions(id),
    stripe_payment_intent_id    VARCHAR(255) UNIQUE,
    amount                      INTEGER NOT NULL,
    currency                    VARCHAR(3) DEFAULT 'JPY',
    status                      escrow_status DEFAULT 'holding',
    held_at                     TIMESTAMPTZ DEFAULT NOW(),
    released_at                 TIMESTAMPTZ,
    refund_reason               TEXT
);
```

## 3.3 主要ビュー定義

### v_active_listings（検索・一覧に使用）

```sql
CREATE VIEW v_active_listings AS
SELECT
    l.id,
    l.title,
    l.description,
    l.condition,
    l.transaction_type,
    l.asking_price         AS price,
    l.exchange_wants       AS exchange_description,
    l.wishlist_count,
    l.view_count,
    l.artist_name,
    l.is_ai_flagged,
    l.search_vector,
    l.seller_id,
    l.created_at,
    -- 出品者情報
    p.display_name         AS seller_name,
    p.avatar_url           AS seller_avatar,
    -- 信用スコア
    cs.score               AS seller_score,
    cs.can_trade           AS seller_can_trade,
    -- AI価格情報
    apa.recommended_price  AS suggested_price,
    apa.early_sell_price,
    apa.premium_price,
    apa.rarity_score,
    apa.rarity_label,
    apa.demand_forecast_30d,
    apa.price_trend,
    -- カテゴリ
    c.slug                 AS category_slug,
    c.name                 AS category_name,
    -- メイン画像
    (SELECT li.url FROM listing_images li
     WHERE li.listing_id = l.id AND li.is_primary = TRUE
     LIMIT 1)              AS primary_image_url,
    -- is_exchange_only
    (l.asking_price IS NULL AND l.transaction_type = 'exchange') AS is_exchange_only
FROM listings l
    JOIN profiles p ON p.id = l.seller_id
    LEFT JOIN credit_scores cs ON cs.user_id = l.seller_id
    LEFT JOIN ai_price_analyses apa ON apa.listing_id = l.id
    JOIN categories c ON c.id = l.category_id
WHERE l.status = 'active'
  AND p.status = 'active';
```

## 3.4 ENUM型一覧（20種類）

| ENUM名 | 値 | 用途 |
|---|---|---|
| `user_status` | active, suspended_24h, suspended_7d, suspended, banned, deactivated | ユーザーステータス |
| `membership_type` | free, premium | 会員種別 |
| `kyc_status` | not_started, pending, approved, rejected, expired | KYCステータス |
| `account_type` | independent, parent, child | 親子アカウント種別 |
| `listing_status` | draft, ai_checking, active, reserved, sold, withdrawn, removed | 出品ステータス |
| `transaction_type` | sale, exchange, local_exchange | 取引種別 |
| `transaction_status` | requested, agreed, kyc_required, deposit_held, shipping_unlocked, shipped_by_seller, shipped_by_buyer, both_shipped, delivered, receipt_confirmed, completed, cancelled, auto_cancelled, disputed, dispute_resolved | 取引ステータス |
| `escrow_status` | holding, released, refunded, forfeited | エスクローステータス |
| `dispute_reason` | item_not_received, item_not_as_described, counterfeit, damaged, wrong_item, seller_non_responsive, other | 紛争理由 |
| `dispute_outcome` | pending, buyer_wins, seller_wins, mutual_agreement, no_fault | 紛争判定 |
| `notification_type` | price_alert, transaction_status, match_request, match_accepted, shipping_reminder, auto_cancel_warning, receipt_reminder, dispute_update, kyc_result, credit_score_change, moderation_action, system | 通知種別 |
| `violation_type` | unshipped, dispute_lost, local_no_show, policy_violation, fraud_detected, both_unshipped_minor | 違反種別 |
| `fraud_signal_type` | burst_listing, unusual_login, duplicate_image, inconsistent_payment, suspicious_review, external_redirect, social_graph_cluster | 詐欺シグナル |
| `carrier_type` | yamato, sagawa, japanpost, seino, other | 配送業者 |
| `moderation_action_type` | warning, suspend_24h, suspend_7d, permanent_ban, listing_removed, credit_deduct | 処分種別 |
| `price_alert_condition` | below, above, any_change | 価格アラート条件 |
| `evidence_type` | image, video | 証拠ファイル種別 |
| `report_target_type` | listing, user | 通報対象種別 |

## 3.5 Row Level Security（RLS）設計方針

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | 全ユーザー | 本人のみ | 本人のみ | 不可 |
| `listings` | active=全員, draft=本人 | 本人のみ | 本人のみ | 本人のみ |
| `transactions` | 当事者（seller/buyer）のみ | 購入者のみ | 当事者のみ | 不可 |
| `escrow_records` | 当事者のみ | Edge Function（Service Role） | Edge Function のみ | 不可 |
| `kyc_records` | 本人のみ | 本人のみ | Edge Function のみ | 不可 |
| `credit_scores` | 全ユーザー（スコアのみ） | 自動（Service Role） | Service Role のみ | 不可 |
| `notifications` | 本人のみ | Service Role | 本人のみ（is_read） | 本人のみ |
| `fraud_risk_scores` | 管理者のみ | Service Role | Service Role | 不可 |

## 3.6 トリガー関数一覧

| トリガー名 | 対象テーブル | 実行タイミング | 処理内容 |
|---|---|---|---|
| `trig_update_listing_search` | listings | BEFORE INSERT/UPDATE | tsvectorを自動更新（日本語全文検索） |
| `trig_sync_wishlist_count` | wishlists | AFTER INSERT/DELETE | listings.wishlist_countを同期 |
| `trig_update_credit_score` | transactions | AFTER UPDATE | 取引完了/違反時に信用スコアを自動再計算 |
| `trig_update_deposit_amount` | credit_scores | AFTER UPDATE OF score | スコア変動時にdeposit_amountを自動更新 |
| `trig_release_escrow` | transactions | AFTER UPDATE OF status | completed時にescrow_recordsをreleased更新 |
| `trig_update_timestamps` | 全テーブル | BEFORE UPDATE | updated_atを自動更新 |

---

# 4. APIインターフェース設計

## 4.1 Supabase PostgREST API（自動生成）

全テーブルのCRUD操作はSupabase PostgREST APIで自動提供。RLSポリシーが認可層として機能。

```
Base URL: https://{project}.supabase.co/rest/v1
認証: Authorization: Bearer {jwt_token}
```

主要エンドポイント例:

```
GET  /v_active_listings?select=*&order=created_at.desc&limit=20
GET  /v_active_listings?select=*&id=eq.{id}
POST /listings
PATCH /listings?id=eq.{id}
POST /wishlists
DELETE /wishlists?user_id=eq.{user_id}&listing_id=eq.{listing_id}
GET  /transactions?or=(seller_id.eq.{uid},buyer_id.eq.{uid})
GET  /notifications?user_id=eq.{uid}&order=created_at.desc
```

## 4.2 Edge Functions（カスタムAPI）

### POST /functions/v1/analyze-price

AI価格分析を実行する。

**リクエスト:**
```json
{
  "imageUrl": "string",      // Supabase Storage公開URL
  "categoryId": "uuid",      // オプション
  "condition": "string",     // new/like_new/good/fair/poor
  "artistName": "string",    // オプション
  "eventId": "uuid"          // オプション
}
```

**レスポンス:**
```json
{
  "productName": "string",
  "categoryGuess": "string",
  "conditionScore": 0.85,
  "analysis": {
    "listingId": "uuid",
    "suggestedPrice": 2800,
    "earlyBirdPrice": 2400,
    "premiumPrice": 3500,
    "rarityScore": 68,
    "rarityLabel": "rare",
    "demandForecast30d": 42,
    "priceTrend": "stable",
    "confidenceScore": 0.87,
    "analyzedAt": "2026-02-23T..."
  },
  "marketData": [
    {
      "platform": "mercari",
      "price": 2600,
      "soldAt": "2026-02-20T..."
    }
  ]
}
```

**処理フロー:**
```
1. Supabase JWT検証
2. Google Vision API（商品認識）
3. Ximilar API（コレクター価格取得）
4. 自社DB検索（market_price_data）
5. Claude API（需給分析・価格提案生成）
6. ai_price_analyses テーブル upsert
7. レスポンス返却
```

---

### POST /functions/v1/transaction-action

取引ステータスを更新する。

**リクエスト:**
```json
{
  "transactionId": "uuid",
  "action": "shipping_ready | confirm_receipt | cancel | dispute"
}
```

**アクション → ステータス遷移:**
```
shipping_ready    → seller_shipping_ready / buyer_shipping_ready フラグ更新
                    双方揃ったら → shipping_unlocked + shipping_deadline設定
confirm_receipt   → receipt_confirmed → completed + escrow release
cancel            → cancelled
dispute           → disputed
```

**エラーレスポンス:**
```json
{ "error": "認証が必要です" }           // 401
{ "error": "権限がありません" }          // 403
{ "error": "取引が見つかりません" }      // 404
{ "error": "無効なアクション" }          // 400
```

---

### POST /functions/v1/create-transaction

取引申請を作成する。（Phase 1 実装予定）

**リクエスト:**
```json
{
  "listingId": "uuid",
  "type": "sale | exchange",
  "exchangeListingId": "uuid"    // 交換の場合のみ
}
```

**バリデーション:**
- 自分の出品への申請は不可
- 信用スコア can_trade=false の場合は不可
- 既に取引中（reserved）の出品への重複申請は不可
- eKYC未完了の場合は kyc_required ステータスで作成

---

## 4.3 Stripe Webhook エンドポイント

| イベント | 処理 |
|---|---|
| `payment_intent.succeeded` | escrow_records.status = 'holding' → transactions.status = 'deposit_held' |
| `payment_intent.payment_failed` | 取引をキャンセルし出品者・購入者に通知 |
| `transfer.created` | エスクロー解放完了。出品者に通知。 |
| `customer.subscription.deleted` | プレミアム会員解約。membership_type = 'free' に更新。 |

---

## 4.4 TRUSTDOCK Webhook

| イベント | 処理 |
|---|---|
| `kyc.approved` | kyc_records.status = 'approved'. transactions の kyc_required → agreed へ進める。 |
| `kyc.rejected` | kyc_records.status = 'rejected'. 300円返金処理。 |

---

# 5. コンポーネント設計

## 5.1 Web（Next.js）コンポーネント階層

```
RootLayout (app/layout.tsx)
├── AuthLayout (app/auth/layout.tsx)
│   ├── LoginPage          - メール/パスワードログイン
│   ├── RegisterPage       - 2ステップ登録（アカウント情報→プロフィール）
│   └── KycPage            - 4ステップKYC（説明→決済→書類→完了）
│
└── MainLayout (app/(main)/layout.tsx)   ← Navbar付き
    ├── HomePage            - ヒーロー・カテゴリ・人気・新着
    ├── SearchPage          - サーバーサイド検索（SSR）
    │   └── FilterTag       - フィルタ削除タグ
    ├── ListingDetailPage   - 商品詳細（SSR）
    │   └── BuyRequestButton [Client]  - 購入・交換申請
    ├── ListingNewPage      - 出品フォーム [Client]
    │   ├── ImageUploader [Client]   - ドラッグ&ドロップ + AI分析トリガー
    │   ├── AiPricePanel [Client]    - AI価格提案パネル
    │   └── ListingForm [Client]     - 出品情報フォーム
    ├── TransactionsPage    - 取引一覧（SSR）
    └── TransactionDetailPage - 取引詳細（SSR）
        └── TransactionActions [Client]  - アクションボタン

共有コンポーネント:
├── Navbar         - ナビゲーション（検索・ログイン状態・メニュー）
└── ListingCard    - 商品カード（グリッド表示）
```

## 5.2 Mobile（Expo RN）コンポーネント階層

```
RootLayout (app/_layout.tsx)  ← Stack Navigator
├── AuthStack
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── KycScreen
│
└── TabsLayout (app/(tabs)/_layout.tsx)  ← 5タブ
    ├── HomeTab (index.tsx)
    │   └── MobileListingCard  - コンパクトカード
    ├── SearchTab (search.tsx)
    │   └── MobileListingCard  - グリッドカード
    ├── SellTab (sell.tsx)     - 出品エントリポイント
    ├── TransactionsTab        - 購入中/出品中タブ切替
    └── MyPageTab              - (未実装)

モーダル/スタックスクリーン:
├── ListingDetailScreen (listings/[id].tsx)
├── ListingNewScreen (listings/new.tsx)
└── TransactionDetailScreen (transactions/[id].tsx)
```

## 5.3 コンポーネント設計原則

| 分類 | 判断基準 | 例 |
|---|---|---|
| Server Component | 初期データ取得。認証チェック。SEO重要。 | 商品詳細ページ・検索ページ・取引一覧 |
| Client Component | ユーザー操作。useState/useEffect使用。 | BuyRequestButton・TransactionActions・ImageUploader |
| 共有コンポーネント | 複数画面で使用。propsで制御。 | ListingCard・MobileListingCard・Navbar |

---

# 6. 状態機械設計

## 6.1 取引ステータス遷移図

```
                    ┌─────────┐
                    │REQUESTED│ ← 購入者が申請
                    └────┬────┘
                         │ 出品者承認
                    ┌────▼────┐
                    │ AGREED  │
                    └────┬────┘
                         │ KYC未完了の場合
                    ┌────▼────────┐
                    │KYC_REQUIRED │
                    └────┬────────┘
                         │ KYC完了
                    ┌────▼────────────┐
                    │ DEPOSIT_HELD    │ ← Stripe Escrow
                    └────┬────────────┘
                         │ 双方 shipping_ready
                    ┌────▼────────────────┐
                    │ SHIPPING_UNLOCKED   │ ← 発送解禁（72h期限）
                    └────┬────────────────┘
              ┌──────────┤
    出品者発送 │          │ 購入者発送（交換）
 ┌────────────▼──┐  ┌────▼───────────────┐
 │SHIPPED_BY_    │  │SHIPPED_BY_BUYER    │
 │SELLER         │  └────┬───────────────┘
 └────────────┬──┘       │ 出品者発送
              │           │
         ┌────▼───────────▼──┐
         │   BOTH_SHIPPED    │
         └────┬──────────────┘
              │ 配達完了
         ┌────▼──────┐
         │ DELIVERED │
         └────┬──────┘
              │ 受取確認
         ┌────▼──────────────┐
         │RECEIPT_CONFIRMED  │
         └────┬──────────────┘
              │ エスクロー解放
         ┌────▼──────┐
         │ COMPLETED │ ✅
         └───────────┘

任意タイミングからの分岐:
REQUESTED / AGREED        → CANCELLED（双方合意）
shipping_unlocked以降72h  → AUTO_CANCELLED（タイムアウト）
SHIPPED〜DELIVERED        → DISPUTED（紛争申立）
DISPUTED                  → DISPUTE_RESOLVED（運営裁定）
```

## 6.2 出品ステータス遷移図

```
DRAFT
  ↓ 出品確定
AI_CHECKING（〜30秒）
  ↓ AI審査通過
ACTIVE（公開中）
  ↓ 購入申請・承認
RESERVED（取引中）
  ↓ 取引完了
SOLD

ACTIVE / RESERVED → WITHDRAWN（出品者取り下げ）
ACTIVE / RESERVED → REMOVED（モデレーション強制削除）
```

## 6.3 信用スコア計算フロー

```
取引完了時:
  completed_transactions += 1
  total_transactions += 1
  recovery_transactions += 1 (violation_adjustmentがある場合)
  if recovery_transactions >= 3:
    violation_adjustment = 0 (完全回復)
  score = (completed_transactions / total_transactions) * 100 + violation_adjustment

違反発生時:
  total_transactions += 1
  violation_adjustment -= deduction_amount
  recovery_transactions = 0 (カウンタリセット)
  score = (completed_transactions / total_transactions) * 100 + violation_adjustment

解決成立時:
  violation_adjustment = violation_adjustment / 2 (半減)

スコア → デポジット額:
  ≥80%   → ¥500
  60-79% → ¥500
  40-59% → ¥800
  20-39% → ¥1,000
  <20%   → can_trade = false（取引不可）
```

---

# 7. AIパイプライン設計

## 7.1 analyze-price Edge Function 詳細

```typescript
// supabase/functions/analyze-price/index.ts
serve(async (req) => {
  const { imageUrl, categoryId, condition, artistName } = await req.json()

  // Step 1: Google Vision API - 商品認識
  const visionResult = await googleVision.annotateImage({
    image: { source: { imageUri: imageUrl } },
    features: [
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'OBJECT_LOCALIZATION' },
      { type: 'SAFE_SEARCH_DETECTION' }
    ]
  })

  // Step 2: Ximilar API - コレクター価格取得
  const ximilarResult = await ximilar.search({
    imageUrl,
    category: visionResult.topLabel
  })

  // Step 3: 自社DB - 過去成約データ
  const internalData = await supabase
    .from('market_price_data')
    .select('*')
    .textSearch('product_keyword', visionResult.topLabel)
    .eq('platform', 'internal')
    .gte('sold_at', thirtyDaysAgo)

  // Step 4: Claude API - 価格分析・提案生成
  const claudeResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    messages: [{
      role: 'user',
      content: `
        商品: ${visionResult.topLabel}
        状態: ${condition}
        アーティスト: ${artistName}
        市場データ:
          メルカリ中央値: ¥${ximilarResult.mercariMedian}
          eBay中央値: $${ximilarResult.ebayMedian}
          自社成約: ${internalData.length}件 中央値¥${median(internalData)}

        以下をJSON形式で返してください:
        - recommended_price (推奨価格)
        - early_sell_price (早期売却価格 = 推奨×0.85)
        - premium_price (プレミア価格 = 希少性スコア>50の場合)
        - rarity_score (0-100)
        - demand_forecast_30d (30日需要予測人数)
        - price_trend (surge/peak/declining/stable/bottom)
      `
    }]
  })

  // Step 5: DB保存
  await supabase.from('ai_price_analyses').upsert({
    listing_id: listingId,
    ...parseClaudeResponse(claudeResponse),
    analyzed_at: new Date().toISOString()
  }, { onConflict: 'listing_id' })
})
```

## 7.2 詐欺検知ロジック

```typescript
// fraud_behavior_logsへの記録と fraud_risk_scoresの更新

const FRAUD_SIGNAL_SCORES = {
  burst_listing:          20,  // バースト出品
  unusual_login:          15,  // 異常ログイン
  duplicate_image:        30,  // 重複画像
  inconsistent_payment:   25,  // 不整合決済
  suspicious_review:      20,  // 不審レビュー
  external_redirect:      35,  // 外部誘導
  social_graph_cluster:   40,  // ネットワーク検出
}

// リスクスコア更新時の対応
async function updateFraudRiskScore(userId, signal) {
  const { data: current } = await supabase
    .from('fraud_risk_scores')
    .select('score')
    .eq('user_id', userId)
    .single()

  const newScore = Math.min(100, (current?.score ?? 0) + FRAUD_SIGNAL_SCORES[signal])

  await supabase.from('fraud_risk_scores').upsert({
    user_id: userId,
    score: newScore,
    risk_level: getRiskLevel(newScore),
    updated_at: new Date().toISOString()
  })

  // critical(81-100): 取引停止 + 管理者通知
  if (newScore > 80) {
    await supabase.from('profiles')
      .update({ status: 'suspended' })
      .eq('id', userId)
    await notifyAdmins(userId, newScore)
  }
}
```

---

# 8. セキュリティ設計

## 8.1 認証フロー

```
Web (Next.js App Router):
  ブラウザ → POST /auth/login
  Supabase Auth → JWT (access_token + refresh_token)
  middleware.ts で supabase.auth.getUser() 検証
  保護ルート: /dashboard, /listings/new, /transactions

Mobile (Expo):
  AsyncStorage に JWT を保存
  supabase.auth.getSession() でセッション復元
  Router.replace('/auth/login') で未認証リダイレクト
```

## 8.2 認可（RLS）実装パターン

```sql
-- パターン1: 本人のみ（例: KYCレコード）
CREATE POLICY "kyc_own_only" ON kyc_records
  FOR ALL USING (auth.uid() = user_id);

-- パターン2: 全員参照・本人のみ更新（例: プロフィール）
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- パターン3: 取引当事者のみ（例: 取引テーブル）
CREATE POLICY "transactions_parties_only" ON transactions
  FOR ALL USING (
    auth.uid() = seller_id OR auth.uid() = buyer_id
  );

-- パターン4: ステータス条件付き（例: アクティブ出品）
CREATE POLICY "listings_active_public" ON listings
  FOR SELECT USING (
    status = 'active' OR auth.uid() = seller_id
  );
```

## 8.3 Edge Function セキュリティ

```typescript
// 全Edge Functionに共通で実装
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // JWT検証（Service Role ではなく User JWT を使用）
  const authHeader = req.headers.get('Authorization')
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user) return new Response(JSON.stringify({ error: '認証が必要です' }), { status: 401 })

  // Rate limiting（Supabase Edge Function レベル: 100req/min/IP）
  // 入力バリデーション
  // 権限確認
})
```

## 8.4 Stripe Webhook 署名検証

```typescript
const signature = req.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  await req.text(),
  signature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')
)
// 署名検証失敗時は400を返す
```

## 8.5 個人情報保護

| データ種別 | 保護方法 | アクセス制御 |
|---|---|---|
| KYC書類画像 | Supabase Storage（Private Bucket） | 本人のみ署名付きURL |
| 住所・電話番号 | KMS暗号化（AES-256） | 運営承認制 |
| Stripe顧客ID | DB内に保持（カード情報はStripe側） | Service Role のみ |
| JWT | httpOnly Cookie（Web）/ AsyncStorage（Mobile） | - |

---

# 9. インフラ・デプロイ設計

## 9.1 環境構成

| 環境 | Web | Mobile | Supabase | 用途 |
|---|---|---|---|---|
| **Development** | localhost:3000 | Expo Go | ローカルSupabase | 開発 |
| **Staging** | Vercel Preview | Expo Dev Client | Supabase Staging Project | テスト |
| **Production** | Vercel Production | App Store / Google Play | Supabase Pro Project | 本番 |

## 9.2 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Edge Functionのみ

# Expo (Mobile)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI APIs
GOOGLE_VISION_API_KEY=
XIMILAR_API_KEY=
ANTHROPIC_API_KEY=

# eKYC
TRUSTDOCK_API_KEY=
TRUSTDOCK_WEBHOOK_SECRET=

# Monitoring
SENTRY_DSN=
```

## 9.3 CI/CDパイプライン（計画）

```yaml
# GitHub Actions（計画）
on: push to main / PR

jobs:
  type-check:     # tsc --noEmit
  lint:           # eslint
  test:           # jest (unit tests)
  build-web:      # next build
  deploy-web:     # vercel deploy (on main)
  build-mobile:   # eas build (on tag)
```

## 9.4 月次インフラコスト（Phase 1）

| サービス | プラン | 月額 |
|---|---|---|
| Supabase | Pro ($25) | $25 |
| Vercel | Pro ($20) | $20 |
| Stripe | 従量（3.6%+固定費） | 取引量依存 |
| Google Vision API | 従量 | ~$10 |
| Ximilar API | Starter | $99 |
| Claude API | 従量 | ~$30 |
| TRUSTDOCK eKYC | 従量（ユーザー負担） | $0 |
| Sentry | Free | $0 |
| **合計** | | **~$184** |

---

# 10. データフロー設計

## 10.1 出品フロー

```
ユーザー → 画像選択
  ↓
ImageUploader → Supabase Storage PUT
  ↓ Storage URL取得
analyze-price Edge Function呼び出し（バックグラウンド）
  ↓ Google Vision → Ximilar → Claude
AiPricePanel に結果表示
  ↓
ListingForm 入力・送信
  ↓
listings テーブル INSERT（status='ai_checking'）
  ↓ 非同期トリガー
AI審査完了 → status='active'
  ↓
v_active_listings ビューに反映（即時）
```

## 10.2 購入フロー

```
購入者 → 商品詳細ページ（v_active_listings から取得）
  ↓
BuyRequestButton → create-transaction Edge Function
  ↓
transactions INSERT（status='requested'）
listings UPDATE（status='reserved'）
出品者へ通知（notifications INSERT）
  ↓
出品者 → 承認 → transaction-action（action='agreed'）
  ↓
transactions UPDATE（status='agreed'）
Stripe Payment Intent 作成
購入者へ決済リダイレクト
  ↓
Stripe Webhook → escrow_records INSERT（status='holding'）
transactions UPDATE（status='deposit_held'）
  ↓
双方 → 発送準備OK → transaction-action（action='shipping_ready'）
  ↓ 双方確認後
transactions UPDATE（status='shipping_unlocked', shipping_deadline=NOW()+72h）
  ↓ 発送
  ↓
購入者 → 受取確認 → transaction-action（action='confirm_receipt'）
  ↓
transactions UPDATE（status='completed'）
escrow_records UPDATE（status='released'）
Stripe Transfer 実行（出品者口座へ）
credit_scores 双方更新
listings UPDATE（status='sold'）
```

## 10.3 検索データフロー

```
ユーザー → キーワード入力
  ↓
search_logs INSERT（需要シグナル記録）
  ↓
Supabase PostgREST → v_active_listings
  .textSearch('search_vector', keyword, { type: 'websearch' })
  .eq('category_slug', category)
  .order('demand_forecast_30d', { ascending: false })
  ↓
PostgreSQL GINインデックスで全文検索（tsvector）
  ↓
需要予測: wishlist_count + search_logs でAI再計算（日次バッチ）
  ↓ 結果返却（JSONレスポンス）
ListingCard / MobileListingCard でレンダリング
```

---

# 11. エラーハンドリング設計

## 11.1 エラー分類

| 種別 | 対応方針 | ユーザー表示 |
|---|---|---|
| **認証エラー** (401) | ログインページへリダイレクト | 「ログインが必要です」 |
| **認可エラー** (403) | 前ページへリダイレクト | 「権限がありません」 |
| **バリデーションエラー** (400) | フォーム内エラー表示 | フィールドごとのエラーメッセージ |
| **Not Found** (404) | next/navigation notFound() | 404ページ |
| **決済エラー** | StripeエラーコードをマッピングしてUI表示 | 「カードが拒否されました。別のカードをお試しください」 |
| **AIエラー** | フォールバック（AI分析なしで出品続行可） | 「AI分析は後ほど完了します」 |
| **サーバーエラー** (500) | Sentryに送信 + ユーザーに汎用メッセージ | 「一時的なエラーが発生しました」 |

## 11.2 エスクロー安全設計

```
エスクロー資金は以下のいずれかの状態でしか存在しない:
  holding   → 購入者からの受取完了、出品者への送金待ち
  released  → 出品者への送金完了
  refunded  → 購入者への返金完了
  forfeited → 違反による没収（返金不可）

「資金消失」は設計上不可能:
  - StripeのPayment Intentは必ずキャプチャor返金
  - WebhookがDB更新に失敗した場合: Stripe側のデータを正とする
  - 定期的な照合バッチで不整合を検知
```

## 11.3 重複実行防止

```sql
-- 取引申請の重複防止（一意制約）
CREATE UNIQUE INDEX idx_transactions_active_listing
ON transactions(listing_id)
WHERE status NOT IN ('completed', 'cancelled', 'auto_cancelled',
                     'disputed', 'dispute_resolved');

-- ウィッシュリスト重複防止
CONSTRAINT uq_wishlist_user_listing UNIQUE (user_id, listing_id)
```

---

# 12. 監視・ログ設計

## 12.1 監視項目

| 項目 | ツール | アラート閾値 |
|---|---|---|
| エラー率 | Sentry | エラー率 > 1% |
| API レスポンスタイム | Supabase Dashboard | P95 > 500ms |
| Edge Function 実行時間 | Supabase Logs | > 5秒 |
| Vercel ビルド | Vercel Dashboard | ビルド失敗 |
| 取引完了率 | Supabase Analytics (カスタム) | 完了率 < 90% |
| 詐欺リスクユーザー数 | Supabase Query | critical > 10件/日 |
| エスクロー未解放件数 | Supabase Query | > 7日間 holding |

## 12.2 ログ設計

| ログ種別 | 保存場所 | 保存期間 | 目的 |
|---|---|---|---|
| アプリエラー | Sentry | 90日 | デバッグ |
| API アクセスログ | Supabase Logs | 30日 | パフォーマンス分析 |
| 取引・決済ログ | `transactions` / `escrow_records` | 永続 | 法的義務・監査 |
| 詐欺行動ログ | `fraud_behavior_logs` | 5年 | 法的義務 |
| KYCログ | `kyc_records` | 7年 | 犯収法 |
| モデレーションログ | `moderation_logs` | 5年 | 法的義務 |
| 検索ログ | `search_logs` | 1年 | AI学習データ |

## 12.3 ビジネスKPIダッシュボード（計画）

```sql
-- 日次取引件数
SELECT DATE(created_at), COUNT(*), SUM(agreed_price)
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at);

-- AI価格分析精度
SELECT
  AVG(ABS(apa.recommended_price - t.agreed_price) / t.agreed_price * 100) AS error_pct
FROM transactions t
JOIN listings l ON l.id = t.listing_id
JOIN ai_price_analyses apa ON apa.listing_id = l.id
WHERE t.status = 'completed';

-- 詐欺検知率
SELECT risk_level, COUNT(*) FROM fraud_risk_scores GROUP BY risk_level;
```

---

# 13. スケーリング戦略

## 13.1 データベーススケーリング

| フェーズ | 対策 |
|---|---|
| Phase 1 (〜100K) | Supabase Pro（デフォルト設定で対応） |
| Phase 2 (〜1M) | Read Replica 追加（読み取り分散）。listings パーティション開始。 |
| Phase 3 (〜10M) | Supabase Enterprise。シャーディング検討。listings を月次パーティション化。CDN キャッシュ強化。 |

```sql
-- Phase 3: 月次パーティション化（計画）
CREATE TABLE listings_2026_02 PARTITION OF listings
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

## 13.2 キャッシュ戦略

| 対象 | キャッシュ方法 | TTL |
|---|---|---|
| AI価格分析結果 | `ai_price_analyses`テーブル（next_analysis_at） | 24時間 |
| カテゴリマスター | Next.js `cache()` + Revalidate | 1時間 |
| ホームフィード | Next.js Revalidate | 5分 |
| 相場データ | `market_price_data`（日次バッチ更新） | 24時間 |
| 静的アセット | Vercel CDN | 長期キャッシュ |

## 13.3 読み取り最適化

```sql
-- 出品一覧クエリはビュー経由（インデックス最大活用）
SELECT * FROM v_active_listings
WHERE category_slug = 'concert-goods'
ORDER BY demand_forecast_30d DESC
LIMIT 20;

-- インデックス使用: idx_listings_active, idx_ai_analyses_rarity
-- EXPLAIN ANALYZEで定期確認
```

## 13.4 AI APIコスト最適化

| 施策 | 効果 |
|---|---|
| 分析結果を24時間キャッシュ | API呼び出し90%削減 |
| 画像変更時のみ再分析 | 不要な再分析防止 |
| バッチ処理で需要予測を日次更新 | リアルタイム課金防止 |
| Claude Haiku を軽量タスクに使用 | コスト50%削減 |

---

*本ドキュメントは実装進捗・設計変更に合わせて随時更新すること。*
*実装の詳細はソースコードのコメントを参照すること。*
