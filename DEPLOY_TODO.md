# デプロイ作業メモ

## ✅ 完了済み

- [x] Gitリポジトリ初期化（`git init`）
- [x] 全コードをコミット済み
- [x] GitHubリポジトリ作成: https://github.com/suzurun/oshikatsu-koukan-app
- [x] GitHubへプッシュ完了

---

## 🔜 次にやること（Vercelデプロイ）

### STEP 1: .env.local の値を確認する
ターミナルで実行：
```bash
cat /Users/naokosuzuki/Desktop/dev/OshikatsuKoukanAPP/apps/web/.env.local
```
→ `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` の値をメモしておく

---

### STEP 2: Vercelにアクセス
https://vercel.com にGitHubアカウントでログイン

---

### STEP 3: 新規プロジェクト作成
1. 「Add New Project」をクリック
2. 「Import Git Repository」で `oshikatsu-koukan-app` を選択
3. 「Import」をクリック

---

### STEP 4: デプロイ設定（重要！）

| 項目 | 設定値 |
|------|--------|
| Root Directory | `apps/web` ← 必ず変更！ |
| Framework Preset | Next.js（自動検出） |

---

### STEP 5: 環境変数を追加

「Environment Variables」セクションに以下を追加：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local から取得した値 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local から取得した値 |

---

### STEP 6: デプロイ
「Deploy」ボタンをクリック → 2〜3分待つ → URLが発行される

---

## 📌 メモ
- GitHubリポジトリURL: https://github.com/suzurun/oshikatsu-koukan-app
- デプロイ後のURLは Vercel のダッシュボードで確認できる
- コードを変更して `git push` するたびに自動で再デプロイされる
