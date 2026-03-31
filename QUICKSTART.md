# クイックスタートガイド

## 🚀 完全自動復旧システム - すぐに使う

### 最も簡単な使い方

```javascript
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';

// これだけ！レート制限エラーが完全に復旧するまで自動リトライ
const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');
```

### コマンドラインから実行

```bash
# JSONレスポンスを取得（完全自動復旧）
node auto-recovery.js https://api.example.com/data --json

# または npm スクリプトから
npm run auto-recover https://api.example.com/data --json
```

## 📋 主な機能

### ✅ 完全自動復旧
- レート制限エラーが**完全に復旧するまで自動的にリトライ**
- 手動操作は一切不要
- 無限リトライ（デフォルト）

### ✅ 原因自動分析
- エラーの原因を自動的に分析
- 診断レポートを自動生成
- 推奨事項を提示

### ✅ 詳細ログ記録
- すべての試行を記録
- エラーの詳細を記録
- ログファイルに自動保存

### ✅ プログレス表示
- リアルタイムで進行状況を表示
- 試行回数、経過時間、待機時間を表示

## 🔧 カスタマイズ例

### プログレス表示をカスタマイズ

```javascript
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';

const data = await fetchJSONWithAutoRecovery(url, options, {
  onProgress: (progress) => {
    console.log(`試行 ${progress.attempt} | 経過: ${(progress.elapsed / 60000).toFixed(1)}分`);
  },
  onRecovery: (recovery) => {
    console.log(`🎉 復旧完了！ (${recovery.attempt}回試行)`);
  },
});
```

### ログを保存

```javascript
import { fetchWithAutoRecovery } from './utils/apiClientAuto.js';
import Logger from './utils/logger.js';

const logger = new Logger();

const response = await fetchWithAutoRecovery(url, options, { logger });

// ログを保存
await logger.saveToFile('my-recovery-log.json');
```

## 📊 診断レポートの確認

```javascript
const response = await fetchWithAutoRecovery(url, options, {
  onDiagnosis: (report) => {
    console.log('主な問題:', report.primaryIssue);
    console.log('信頼度:', report.confidence);
    console.log('推奨事項:', report.recommendations);
  },
});
```

## 🎯 使用例

詳細な使用例は `examples/auto-recovery-example.js` を参照してください。

## ⚠️ 注意事項

- 完全自動復旧システムは、レート制限エラーが完全に復旧するまで**無限にリトライ**します
- 長時間待機する可能性があります
- 最大待機時間を設定したい場合は、`maxTotalWaitTime` オプションを使用してください

```javascript
const response = await fetchWithAutoRecovery(url, options, {
  maxTotalWaitTime: 3600000, // 最大1時間
});
```






