# トラブルシューティングガイド

## API Error: Rate limit reached エラーの解決方法

### エラーの原因

「API Error: Rate limit reached」エラーは、APIのレート制限に達したことを示しています。これは以下の2つのケースで発生する可能性があります：

1. **Cursor/ClaudeなどのAIツール自体のAPIレート制限**
   - CursorやClaudeなどのAIアシスタントツールが使用するAPIのレート制限に達した場合

2. **あなたのアプリケーションが呼び出す外部APIのレート制限**
   - あなたのコードが呼び出す外部API（例：Twitter API、GitHub APIなど）のレート制限に達した場合

### 解決方法

#### ケース1: Cursor/ClaudeなどのAIツールのレート制限の場合

**対処法：**
1. **しばらく待つ**: 通常、数分から数十分待つとレート制限が解除されます
2. **APIキーの確認**: Cursorの設定でAPIキーが正しく設定されているか確認してください
3. **プランの確認**: 使用しているプラン（無料/有料）のレート制限を確認してください

**具体的な手順：**
- Cursorの設定（Settings）を開く
- API KeysまたはAccountセクションを確認
- 使用状況やレート制限の情報を確認

#### ケース2: あなたのアプリケーションのAPIレート制限の場合

このプロジェクトには、レート制限エラーを自動的に処理するユーティリティが含まれています。

**使用方法：**

```javascript
// 通常のfetchの代わりに、レート制限対応のfetchを使用
import { fetchJSON, fetchWithRateLimit } from './utils/apiClient.js';

// 例: JSONデータを取得（自動リトライ付き）
try {
  const data = await fetchJSON('https://api.example.com/data');
  console.log('データ取得成功:', data);
} catch (error) {
  console.error('エラー:', error.message);
}
```

**カスタムリトライ設定：**

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
    baseDelay: 2000,      // ベース待機時間（2秒）
    maxDelay: 120000,     // 最大待機時間（2分）
  }
);
```

### レート制限対応ユーティリティの機能

作成したユーティリティには以下の機能が含まれています：

- ✅ **自動リトライ**: レート制限エラー（429）を検出し、自動的にリトライ
- ✅ **指数バックオフ**: リトライ間隔を指数関数的に増加（1秒 → 2秒 → 4秒 → ...）
- ✅ **Retry-Afterヘッダー対応**: APIが提供するRetry-Afterヘッダーを尊重
- ✅ **レート制限情報の取得**: レスポンスヘッダーからレート制限情報を取得
- ✅ **ユーザーフレンドリーなエラーメッセージ**: わかりやすい日本語のエラーメッセージ

### 既存コードへの適用方法

既存のコードで`fetch`を使用している場合、以下のように置き換えてください：

**変更前：**
```javascript
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

**変更後：**
```javascript
import { fetchJSON } from './utils/apiClient.js';

const data = await fetchJSON('https://api.example.com/data');
```

### その他のエラーについて

画像に表示されている`auto-commit.sh`のエラーは、別のプロジェクト（`/Users/matsumototoshihiko/X記事投稿システム/xxxx2026/`）のパスを参照しているため、現在のプロジェクトとは関係ありません。

### 詳細情報

詳細な使用方法については、`README.md`を参照してください。






