# OshikatsuKoukanAPP

## レート制限エラー対応 - 完全自動復旧システム ✅ 実装完了

このプロジェクトには、APIレート制限エラーを**完全に自動復旧するまで自動リトライ**するシステムが含まれています。

### 🚀 すぐに始める

```bash
# デモを実行して動作確認
npm run demo

# または直接実行
node demo.js
```

### 📦 インストール

追加のパッケージは不要です。Node.js 18以上が必要です。

### 🚀 完全自動復旧システム（推奨）

**レート制限エラーが完全に復旧するまで、自動的にリトライを続けます。手動操作は一切不要です。**

#### 基本的な使用方法（完全自動復旧）

```javascript
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';

// レート制限エラーが完全に復旧するまで自動リトライ
const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');
console.log('✅ データ取得成功:', data);
```

#### コマンドラインから実行

```bash
# 基本的な使用方法
node auto-recovery.js https://api.example.com/data --json

# POSTリクエスト
node auto-recovery.js https://api.example.com/data --method=POST --body='{"key":"value"}'

# npmスクリプトから実行
npm run auto-recover https://api.example.com/data --json
```

#### カスタム設定付き自動復旧

```javascript
import { fetchWithAutoRecovery } from './utils/apiClientAuto.js';
import Logger from './utils/logger.js';

const logger = new Logger();

const response = await fetchWithAutoRecovery(
  'https://api.example.com/data',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
    body: JSON.stringify({ data: 'example' }),
  },
  {
    logger,
    onProgress: (progress) => {
      console.log(`試行 ${progress.attempt} | 経過: ${(progress.elapsed / 60000).toFixed(1)}分`);
    },
    onRecovery: (recovery) => {
      console.log(`🎉 復旧完了！ (${recovery.attempt}回試行、${(recovery.recoveryTime / 60000).toFixed(1)}分)`);
    },
    onDiagnosis: (report) => {
      console.log('📊 診断レポート:', report);
    },
  }
);
```

### 完全自動復旧システムの特徴

- ✅ **無限リトライ**: 完全復旧まで自動的にリトライを続けます
- ✅ **原因自動分析**: レート制限エラーの原因を自動的に分析・診断
- ✅ **詳細ログ記録**: すべての試行とエラーを詳細に記録
- ✅ **プログレス表示**: リアルタイムで進行状況を表示
- ✅ **復旧確認**: 2回連続成功で復旧を確認
- ✅ **診断レポート**: エラーの原因と推奨事項を自動生成
- ✅ **Retry-After対応**: APIが指定する待機時間を自動的に尊重

### 従来のリトライシステム（最大リトライ回数あり）

このプロジェクトには、APIレート制限エラーを処理するためのユーティリティが含まれています。

### 使用方法

#### 基本的な使用方法

```javascript
import { fetchWithRateLimit, fetchJSON } from './utils/apiClient.js';

// レート制限対応のfetch
const response = await fetchWithRateLimit('https://api.example.com/data');

// JSONを取得（レート制限対応）
const data = await fetchJSON('https://api.example.com/data');
```

#### カスタムリトライオプション

```javascript
import { fetchWithRateLimit } from './utils/apiClient.js';

const response = await fetchWithRateLimit(
  'https://api.example.com/data',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'example' }),
  },
  {
    maxRetries: 5,        // 最大リトライ回数
    baseDelay: 2000,      // ベース待機時間（ミリ秒）
    maxDelay: 120000,     // 最大待機時間（ミリ秒）
  }
);
```

#### 手動でのリトライロジック

```javascript
import { withRateLimitRetry } from './utils/rateLimitHandler.js';

const result = await withRateLimitRetry(
  async () => {
    // あなたのAPI呼び出し
    return await yourApiCall();
  },
  {
    maxRetries: 3,
    onRetry: (attempt, maxRetries, delay, rateLimitInfo) => {
      console.log(`リトライ ${attempt}/${maxRetries}`);
    },
  }
);
```

### 機能

- **自動リトライ**: レート制限エラー（429）を検出し、自動的にリトライ
- **指数バックオフ**: リトライ間隔を指数関数的に増加
- **Retry-Afterヘッダー対応**: APIが提供するRetry-Afterヘッダーを尊重
- **レート制限情報の取得**: レスポンスヘッダーからレート制限情報を取得
- **ユーザーフレンドリーなエラーメッセージ**: わかりやすいエラーメッセージを提供

### エラーハンドリング

```javascript
import { safeApiCall, isRateLimitError } from './utils/apiClient.js';
import { getRateLimitErrorMessage } from './utils/rateLimitHandler.js';

try {
  const data = await safeApiCall(() => fetchJSON('https://api.example.com/data'));
} catch (error) {
  if (isRateLimitError(error)) {
    console.error(getRateLimitErrorMessage(error));
    // ユーザーに適切なメッセージを表示
  } else {
    console.error('その他のエラー:', error);
  }
}
```

## 📊 診断・分析機能

### 自動診断レポート

完全自動復旧システムは、エラーの原因を自動的に分析し、診断レポートを生成します：

```javascript
import { fetchWithAutoRecovery } from './utils/apiClientAuto.js';

const response = await fetchWithAutoRecovery(url, options, {
  onDiagnosis: (report) => {
    console.log('主な問題:', report.primaryIssue);
    console.log('信頼度:', report.confidence);
    console.log('平均待機時間:', report.averageRetryAfter);
    console.log('推奨事項:', report.recommendations);
  },
});
```

### ログ記録

すべての試行とエラーが詳細に記録されます：

```javascript
import Logger from './utils/logger.js';

const logger = new Logger();

// ログを確認
const stats = logger.getStats();
console.log('統計情報:', stats);

// ログをファイルに保存
await logger.saveToFile('recovery-log.json');
```

## 🎯 使用例

詳細な使用例は `examples/auto-recovery-example.js` を参照してください。

## 🎯 拡張機能

### 設定ファイルサポート

`auto-recovery.config.json` ファイルで設定を管理できます：

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

### 統計情報とモニタリング

```javascript
import { fetchJSONWithAutoRecoveryEnhanced } from './utils/apiClientAutoEnhanced.js';
import { Monitor } from './utils/monitor.js';
import { StatsCollector } from './utils/stats.js';

const stats = new StatsCollector();
const monitor = new Monitor({ stats, updateInterval: 2000 });

const data = await fetchJSONWithAutoRecoveryEnhanced(url, {}, {
  stats,
  monitor,
});

// 統計情報を表示
stats.displayStats();
```

### 通知機能

```javascript
import NotificationManager from './utils/notifications.js';

const notifications = new NotificationManager({
  enabled: true,
  onRecovery: true,
  onError: true,
});

// コンソール通知を登録
notifications.register(NotificationManager.createConsoleHandler());

// ファイル通知を登録
notifications.register(NotificationManager.createFileHandler('notifications.log'));
```

## 🧪 テスト

```bash
# すべてのテストを実行
npm test

# または直接実行
node test-auto-recovery.js
```

## 📝 ファイル構成

### コアファイル
- `utils/autoRecovery.js` - 完全自動復旧システムのコア
- `utils/apiClientAuto.js` - 完全自動復旧対応のAPIクライアント（基本版）
- `utils/apiClientAutoEnhanced.js` - 完全自動復旧対応のAPIクライアント（拡張版）

### サポート機能
- `utils/diagnostics.js` - 原因分析・診断機能
- `utils/logger.js` - 詳細ログ記録システム
- `utils/config.js` - 設定ファイル管理
- `utils/notifications.js` - 通知機能
- `utils/stats.js` - 統計情報収集
- `utils/monitor.js` - モニタリングダッシュボード
- `utils/export.js` - データエクスポート機能（CSV、JSON）
- `utils/report.js` - エラーレポート生成
- `utils/history.js` - 履歴管理機能

### 実行ファイル
- `auto-recovery.js` - コマンドライン実行スクリプト
- `test-auto-recovery.js` - テストスクリプト
- `auto-recovery.config.json` - 設定ファイルテンプレート

### 従来版（最大リトライ回数あり）
- `utils/rateLimitHandler.js` - レート制限ハンドラー
- `utils/apiClient.js` - APIクライアント

### ドキュメント
- `README.md` - このファイル
- `QUICKSTART.md` - クイックスタートガイド
- `FEATURES.md` - 機能一覧
- `BEST_PRACTICES.md` - ベストプラクティスガイド
- `TROUBLESHOOTING.md` - トラブルシューティング

### 使用例
- `examples/auto-recovery-example.js` - 基本的な使用例
- `examples/real-world-example.js` - 実用的な使用例

