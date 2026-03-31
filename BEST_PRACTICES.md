# ベストプラクティスガイド

## 🎯 レート制限エラー対応のベストプラクティス

### 1. 完全自動復旧システムの使用

**推奨**: 完全自動復旧システムを使用して、手動操作を不要にします。

```javascript
// ✅ 推奨: 完全自動復旧
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';
const data = await fetchJSONWithAutoRecovery(url);

// ❌ 非推奨: 手動リトライ
// 手動でリトライを実装すると、コードが複雑になり、エラーが発生しやすくなります
```

### 2. 設定ファイルの活用

**推奨**: 設定をファイルで管理し、環境ごとに異なる設定を使用します。

```json
// auto-recovery.config.json
{
  "autoRecovery": {
    "retryForever": true,
    "baseDelay": 1000,
    "maxDelay": 300000
  }
}
```

### 3. ログと統計の記録

**推奨**: すべての試行とエラーを記録し、後で分析できるようにします。

```javascript
import Logger from './utils/logger.js';
import { StatsCollector } from './utils/stats.js';

const logger = new Logger();
const stats = new StatsCollector();

// 使用後、ログと統計を保存
await logger.saveToFile('recovery-log.json');
await stats.saveToFile('stats.json');
```

### 4. モニタリングの実装

**推奨**: リアルタイムで進行状況を監視します。

```javascript
import { Monitor } from './utils/monitor.js';

const monitor = new Monitor({ stats, updateInterval: 2000 });
monitor.start();

// 処理完了後
monitor.stop();
```

### 5. エラーレポートの生成

**推奨**: 定期的にエラーレポートを生成し、問題を分析します。

```javascript
import { generateErrorReport, displayReport } from './utils/report.js';

const report = await generateErrorReport(errors, stats, logger);
displayReport(report);
```

### 6. 通知の設定

**推奨**: 重要なイベント（復旧、重大なエラー）を通知します。

```javascript
import NotificationManager from './utils/notifications.js';

const notifications = new NotificationManager({
  enabled: true,
  onRecovery: true,
  onError: true,
});
```

### 7. 履歴の管理

**推奨**: セッション履歴を保存し、長期的な傾向を分析します。

```javascript
import { addSession, getHistoryStats } from './utils/history.js';

// セッション終了時に履歴に追加
await addSession({
  attempts: stats.totalCalls,
  recoveries: recoveries,
  errors: errors,
});

// 履歴統計を確認
const historyStats = await getHistoryStats();
```

## ⚠️ 避けるべきこと

### 1. 過度なリトライ

**非推奨**: 短い間隔で過度にリトライすると、APIサーバーに負荷をかける可能性があります。

```javascript
// ❌ 非推奨: 短い間隔でリトライ
{
  baseDelay: 100,  // 短すぎる
  maxRetries: 1000  // 多すぎる
}

// ✅ 推奨: 適切な間隔
{
  baseDelay: 1000,  // 1秒から開始
  maxDelay: 300000  // 最大5分
}
```

### 2. エラーハンドリングの省略

**非推奨**: エラーハンドリングを省略すると、予期しない動作が発生する可能性があります。

```javascript
// ❌ 非推奨: エラーハンドリングなし
const data = await fetchJSONWithAutoRecovery(url);

// ✅ 推奨: 適切なエラーハンドリング
try {
  const data = await fetchJSONWithAutoRecovery(url);
} catch (error) {
  console.error('エラー:', error);
  // 適切な処理
}
```

### 3. ログの無視

**非推奨**: ログを記録しないと、問題の原因を特定できません。

```javascript
// ❌ 非推奨: ログなし
const data = await fetchJSONWithAutoRecovery(url);

// ✅ 推奨: ログを記録
const logger = new Logger();
const data = await fetchJSONWithAutoRecovery(url, {}, { logger });
await logger.saveToFile('log.json');
```

## 🔧 パフォーマンス最適化

### 1. 並列処理の制限

複数のAPIを呼び出す場合、並列数を制限します。

```javascript
// 並列数を制限（例: 最大5つまで）
const semaphore = new Semaphore(5);
const results = await Promise.all(
  urls.map(url => semaphore.acquire(() => fetchJSONWithAutoRecovery(url)))
);
```

### 2. キャッシュの活用

可能な場合は、レスポンスをキャッシュします。

```javascript
const cache = new Map();
const cacheKey = url;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

const data = await fetchJSONWithAutoRecovery(url);
cache.set(cacheKey, data);
return data;
```

### 3. タイムアウトの設定

適切なタイムアウトを設定します。

```json
{
  "api": {
    "timeout": 30000  // 30秒
  }
}
```

## 📊 監視とアラート

### 1. メトリクスの監視

重要なメトリクスを監視します：
- レート制限エラーの発生率
- 平均復旧時間
- 成功率

### 2. アラートの設定

重要なイベントでアラートを設定します：
- レート制限エラーが連続で発生
- 復旧時間が異常に長い
- 成功率が低下

## 🎓 学習リソース

- [README.md](./README.md) - 基本的な使用方法
- [QUICKSTART.md](./QUICKSTART.md) - クイックスタートガイド
- [FEATURES.md](./FEATURES.md) - 機能一覧
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング

## 💡 実践例

実際の使用例は `examples/auto-recovery-example.js` を参照してください。






