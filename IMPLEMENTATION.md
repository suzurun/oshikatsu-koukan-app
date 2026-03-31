# 実装ガイド

## 🚀 実装完了

完全自動復旧システムが実装され、すぐに使用できます。

## 📦 インストール

```bash
# 依存関係のインストール（現在はNode.jsの標準機能のみ使用）
# 追加のパッケージは不要です
```

## 🎯 基本的な使用方法

### 1. 最も簡単な方法

```javascript
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';

const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');
console.log('データ:', data);
```

### 2. コマンドラインから実行

```bash
# 基本的な使用方法
node auto-recovery.js https://api.example.com/data --json

# または npm スクリプトから
npm run auto-recover https://api.example.com/data --json
```

### 3. メインエントリーポイントから実行

```bash
# 基本モード
node index.js https://api.example.com/data basic

# 拡張モード（統計・モニタリング付き）
node index.js https://api.example.com/data enhanced

# 完全なワークフロー
node index.js https://api.example.com/data complete
```

## 🔧 設定

### 設定ファイル

`auto-recovery.config.json` ファイルで設定を管理：

```json
{
  "autoRecovery": {
    "retryForever": true,
    "baseDelay": 1000,
    "maxDelay": 300000
  },
  "logging": {
    "enabled": true,
    "saveToFile": true
  },
  "notifications": {
    "enabled": true,
    "onRecovery": true
  }
}
```

## 📊 機能一覧

### ✅ 実装済み機能

1. **完全自動復旧**
   - 無限リトライ（完全復旧まで）
   - 復旧確認（2回連続成功）
   - 指数バックオフ
   - Retry-Afterヘッダー対応

2. **原因分析・診断**
   - エラーの自動分析
   - 診断レポート生成
   - 推奨事項の提示

3. **ログ・統計**
   - 詳細なログ記録
   - 統計情報の収集
   - エクスポート機能（CSV、JSON、TXT）

4. **モニタリング**
   - リアルタイムダッシュボード
   - プログレス表示
   - 自動更新

5. **通知機能**
   - 復旧通知
   - エラー通知
   - カスタム通知ハンドラー

6. **レポート生成**
   - エラーレポート（JSON）
   - HTMLレポート
   - 詳細な分析

7. **履歴管理**
   - セッション履歴の保存
   - 長期的な傾向分析
   - 統計情報の追跡

8. **設定管理**
   - JSON設定ファイル
   - デフォルト設定
   - 動的設定読み込み

## 🧪 テスト

```bash
# すべてのテストを実行
npm test

# または直接実行
node test-auto-recovery.js
```

## 📝 使用例

詳細な使用例は以下を参照：
- `examples/auto-recovery-example.js` - 基本的な使用例
- `examples/real-world-example.js` - 実用的な使用例

## 🔍 トラブルシューティング

問題が発生した場合は `TROUBLESHOOTING.md` を参照してください。

## 📚 ドキュメント

- [README.md](./README.md) - 完全なドキュメント
- [QUICKSTART.md](./QUICKSTART.md) - クイックスタート
- [FEATURES.md](./FEATURES.md) - 機能一覧
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - ベストプラクティス
- [SUMMARY.md](./SUMMARY.md) - 機能サマリー

## 🎯 次のステップ

1. 実際のAPIエンドポイントでテスト
2. 設定ファイルをカスタマイズ
3. 通知機能を設定
4. 統計情報を確認
5. エラーレポートを生成

## 💡 ヒント

- 最初は基本版（`apiClientAuto.js`）から始める
- 統計やモニタリングが必要な場合は拡張版（`apiClientAutoEnhanced.js`）を使用
- 設定ファイルで動作をカスタマイズ
- ログと統計を定期的に確認






