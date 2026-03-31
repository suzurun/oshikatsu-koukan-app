# 機能一覧

## 🚀 完全自動復旧システム

### 基本機能

- ✅ **無限リトライ**: レート制限エラーが完全に復旧するまで自動的にリトライ
- ✅ **復旧確認**: 2回連続成功で復旧を確認
- ✅ **指数バックオフ**: リトライ間隔を指数関数的に増加
- ✅ **Retry-After対応**: APIが指定する待機時間を自動的に尊重
- ✅ **原因自動分析**: エラーの原因を自動的に分析・診断

### 拡張機能

#### 📊 統計情報収集

- 総試行回数、成功回数、エラー数の追跡
- 成功率の計算
- エラータイプ別の分類（レート制限、ネットワーク、その他）
- 統計情報のJSON形式でのエクスポート

#### 📝 詳細ログ記録

- すべての試行とエラーを詳細に記録
- タイムスタンプ付きログ
- ログレベルの設定（debug, info, warn, error）
- ログファイルへの自動保存

#### 📢 通知機能

- 復旧時の通知
- エラー発生時の通知
- カスタム通知ハンドラーの登録
- コンソール通知、ファイル通知のサポート

#### 📊 モニタリングダッシュボード

- リアルタイムでの統計情報表示
- 最新ログの表示
- 自動更新（設定可能な間隔）
- プログレスバー表示

#### ⚙️ 設定ファイルサポート

- JSON形式の設定ファイル
- デフォルト設定の提供
- 設定の動的読み込み
- 設定テンプレートの生成

## 🔧 使用方法

### 基本版（シンプル）

```javascript
import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';

const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');
```

### 拡張版（統計・モニタリング付き）

```javascript
import { fetchJSONWithAutoRecoveryEnhanced } from './utils/apiClientAutoEnhanced.js';
import { Monitor } from './utils/monitor.js';
import { StatsCollector } from './utils/stats.js';

const stats = new StatsCollector();
const monitor = new Monitor({ stats });

const data = await fetchJSONWithAutoRecoveryEnhanced(url, {}, {
  stats,
  monitor,
});
```

### コマンドライン

```bash
# 基本的な使用方法
node auto-recovery.js https://api.example.com/data --json

# 設定ファイルを使用
node auto-recovery.js https://api.example.com/data --json --config=my-config.json
```

## 📈 パフォーマンス

- **非同期処理**: すべての処理が非同期で実行
- **効率的なリトライ**: 指数バックオフによる効率的なリトライ
- **メモリ効率**: ログの自動管理とクリーンアップ
- **スケーラブル**: 複数のAPI呼び出しを同時に処理可能

## 🔒 セキュリティ

- **エラーハンドリング**: すべてのエラーを適切に処理
- **タイムアウト**: 設定可能なタイムアウト
- **安全なデフォルト**: 安全なデフォルト設定

## 🎯 将来の拡張予定

- [ ] Webhook通知サポート
- [ ] メール通知サポート
- [ ] Slack/Discord通知サポート
- [ ] グラフ表示機能
- [ ] 履歴データの永続化
- [ ] 分散システム対応






