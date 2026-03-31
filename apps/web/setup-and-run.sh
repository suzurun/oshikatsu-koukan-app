#!/bin/bash
# 推し活マーケット - セットアップ＆起動スクリプト
set -e

# モノレポルートに移動
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "📦 依存関係をインストール中（ルートから）..."
npm install

echo ""
echo "✅ インストール完了！"
echo ""

# .env.local チェック
ENV_FILE="$ROOT/apps/web/.env.local"
if [ ! -f "$ENV_FILE" ] || grep -q "xxxxxxxxxxxxxxxxxxx" "$ENV_FILE" 2>/dev/null; then
  echo "⚠️  Supabase接続情報が未設定です"
  echo ""
  echo "以下を参考に $ENV_FILE を作成してください："
  echo "  https://supabase.com/dashboard → プロジェクト → Settings → API"
  echo ""
  echo "▼ コマンド例（URLとKEYを実際の値に変えて実行）"
  echo "cat > apps/web/.env.local << 'EOF'"
  echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci..."
  echo "EOF"
  echo ""
  echo "設定後、もう一度実行してください:"
  echo "  bash apps/web/setup-and-run.sh"
  exit 1
fi

echo "🚀 開発サーバーを起動します..."
echo "ブラウザで → http://localhost:3000"
echo ""
cd "$ROOT/apps/web" && npm run dev
