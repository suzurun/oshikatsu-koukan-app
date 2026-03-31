# 明日の作業メモ 📝（2026年2月24日 時点）

## 🚀 アプリの起動方法

```bash
cd /Users/naokosuzuki/Desktop/dev/OshikatsuKoukanAPP/apps/web
npm run dev
# → http://localhost:3000 でアクセス
```

## ✅ 完成済みページ一覧（合計 51 ファイル）

### 認証系
| パス | 説明 |
|------|------|
| `/auth/login` | ログイン（パスワード忘れリンクあり） |
| `/auth/register` | 新規登録（年齢確認ステップあり） |
| `/auth/register/underage` | 18歳未満の登録フロー |
| `/auth/kyc` | 本人確認（KYC）フロー |
| `/auth/forgot-password` | パスワードリセット |

### メインページ
| パス | 説明 |
|------|------|
| `/` | TOP（K-POP交換プラットフォームとして設計） |
| `/search` | 検索結果（ダミーデータあり） |
| `/listings/[id]` | 商品詳細（AI鑑定バッジ・ゴールドマークあり） |
| `/listings/new` | 出品フォーム |
| `/listings/[id]/edit` | 出品編集 |
| `/listings/[id]/purchase` | 購入・交換申請確認 |

### 取引・メッセージ
| パス | 説明 |
|------|------|
| `/transactions` | 取引一覧 |
| `/transactions/[id]` | 取引詳細 |
| `/transactions/[id]/review` | レビュー投稿（5段階評価） |
| `/messages` | メッセージ一覧 |
| `/messages/[id]` | チャット画面（5ステップ進行バーあり） |

### コミュニティ
| パス | 説明 |
|------|------|
| `/community` | コミュニティTOP（投稿フィード） |
| `/community/[slug]` | ファンルーム詳細（例：BTS部屋） |
| `/community/exchange-board` | K-POP交換掲示板 |
| `/community/timeline` | タイムライン |
| `/community/events` | イベント・オフ会一覧 |

### ダッシュボード
| パス | 説明 |
|------|------|
| `/dashboard` | マイページ（KYC状態表示あり） |
| `/dashboard/edit` | プロフィール編集 |
| `/dashboard/notifications` | 通知一覧 |
| `/dashboard/wallet` | ウォレット・売上管理 |
| `/dashboard/wishlist` | ウィッシュリスト |
| `/dashboard/settings` | 設定メニュー |
| `/dashboard/settings/bank` | 銀行口座登録 |
| `/dashboard/settings/password` | パスワード変更 |
| `/dashboard/settings/premium` | プレミアム会員登録 |

### ユーザー・その他
| パス | 説明 |
|------|------|
| `/users/[username]` | 出品者プロフィール |
| `/help` | ヘルプ・FAQ |
| `/terms` | 利用規約 |
| `/privacy` | プライバシーポリシー |

---

## 🔥 次に優先してやること

### 優先度：高
1. **出品フォーム（/listings/new）のSupabase連携**
   - 画像アップロード（Supabase Storage）
   - DBへの保存処理
   
2. **ログイン・登録のSupabase動作確認**
   - テストアカウントでの登録→ログイン→ダッシュボード表示の流れ確認

3. **商品詳細ページのSupabase連携**
   - `/listings/[id]` で実際のDBデータを表示

### 優先度：中
4. **フッターの追加**
   - /help /terms /privacy リンクをフッターに追加

5. **コミュニティ ルーム一覧ページ**
   - `/community/rooms` （ファンルーム一覧）

6. **イベント作成ページ**
   - `/community/events/new`

7. **メッセージ機能のSupabase Realtime連携**
   - リアルタイムチャットの実装

### 優先度：低
8. **Stripe決済の本番実装**
   - `/dashboard/settings/premium` のStripe連携
   
9. **AI鑑定機能の実装**
   - Supabase Edge Functions または外部AI APIとの連携
   
10. **KYC（本人確認）の外部サービス連携**
    - eKYCサービスとの連携

---

## ⚙️ 技術スタック

- **フレームワーク**: Next.js 14（App Router）
- **スタイル**: Tailwind CSS
- **DB・認証**: Supabase
- **フォント**: Noto Sans JP
- **デプロイ先**: 未設定（Vercelが推奨）

## 🔑 Supabase設定

- メール確認は **無効化済み**（Supabase管理画面 > Authentication > Email > Confirm email: OFF）
- `profiles` テーブルは作成済み（`supabase/migrations/setup_profiles.sql` 参照）
- `.env.local` はアプリ内に設定済み

## 🎨 デザイン方針

- **コンセプト**: K-POP推しグッズ交換プラットフォーム
- **入口**: ¥0での交換を最も目立たせる
- **カラー**: 水色〜ピンクのグラデーション、ヒーローバナーはダーク系
- **フォント色**: #333333（80%ブラック）
- **AI鑑定バッジ**: ゴールドカラー

---

*このファイルは作業メモです。作業開始時に確認してください。*



