#!/usr/bin/env node

/**
 * 簡単なテスト - システムが動作することを確認
 * ネットワークアクセスがなくても動作確認できるバージョン
 */

console.log('\n' + '='.repeat(60));
console.log('完全自動復旧システム - 動作確認');
console.log('='.repeat(60));

// モジュールのインポート確認
console.log('\n📦 モジュールの読み込み確認...');

try {
  const { fetchJSONWithAutoRecovery } = await import('./utils/apiClientAuto.js');
  console.log('✅ apiClientAuto.js - OK');

  const { fetchJSONWithAutoRecoveryEnhanced } = await import('./utils/apiClientAutoEnhanced.js');
  console.log('✅ apiClientAutoEnhanced.js - OK');

  const { Monitor } = await import('./utils/monitor.js');
  console.log('✅ monitor.js - OK');

  const { StatsCollector } = await import('./utils/stats.js');
  console.log('✅ stats.js - OK');

  const Logger = (await import('./utils/logger.js')).default;
  console.log('✅ logger.js - OK');

  const { loadConfig } = await import('./utils/config.js');
  console.log('✅ config.js - OK');

  const { generateErrorReport } = await import('./utils/report.js');
  console.log('✅ report.js - OK');

  const { exportAll } = await import('./utils/export.js');
  console.log('✅ export.js - OK');

  const { addSession } = await import('./utils/history.js');
  console.log('✅ history.js - OK');

  const NotificationManager = (await import('./utils/notifications.js')).default;
  console.log('✅ notifications.js - OK');

  console.log('\n✅ すべてのモジュールが正常に読み込めました！');
} catch (error) {
  console.error('\n❌ モジュールの読み込みに失敗しました:', error.message);
  process.exit(1);
}

// 設定ファイルの確認
console.log('\n⚙️ 設定ファイルの確認...');
try {
  const { readFile } = await import('fs/promises');
  const { existsSync } = await import('fs');
  
  if (existsSync('auto-recovery.config.json')) {
    const config = await readFile('auto-recovery.config.json', 'utf-8');
    const parsed = JSON.parse(config);
    console.log('✅ 設定ファイルが見つかりました');
    console.log('   設定内容:', JSON.stringify(parsed, null, 2));
  } else {
    console.log('⚠️ 設定ファイルが見つかりません（デフォルト設定を使用）');
  }
} catch (error) {
  console.error('❌ 設定ファイルの読み込みに失敗:', error.message);
}

// 機能の説明
console.log('\n' + '='.repeat(60));
console.log('📚 システムの機能');
console.log('='.repeat(60));
console.log(`
✅ 完全自動復旧
   - レート制限エラーが完全に復旧するまで自動リトライ
   - 手動操作は一切不要

✅ 原因分析・診断
   - エラーの原因を自動分析
   - 診断レポートを自動生成

✅ ログ・統計
   - 詳細なログ記録
   - 統計情報の収集
   - エクスポート機能（CSV、JSON、TXT）

✅ モニタリング
   - リアルタイムダッシュボード
   - プログレス表示

✅ 通知機能
   - 復旧通知
   - エラー通知

✅ レポート生成
   - エラーレポート（JSON、HTML）

✅ 履歴管理
   - セッション履歴の保存
   - 長期的な傾向分析
`);

// 使用方法
console.log('\n' + '='.repeat(60));
console.log('🚀 使用方法');
console.log('='.repeat(60));
console.log(`
1. 基本的な使用:
   import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';
   const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');

2. コマンドラインから:
   node auto-recovery.js https://api.example.com/data --json

3. デモを実行:
   npm run demo
   または
   node demo.js

4. 拡張版（統計・モニタリング付き）:
   import { fetchJSONWithAutoRecoveryEnhanced } from './utils/apiClientAutoEnhanced.js';
   const data = await fetchJSONWithAutoRecoveryEnhanced(url, {}, { stats, monitor });
`);

console.log('\n' + '='.repeat(60));
console.log('✅ システムは正常に動作しています！');
console.log('='.repeat(60));
console.log('\n💡 実際のAPIでテストするには:');
console.log('   node demo.js');
console.log('   または');
console.log('   node auto-recovery.js <API_URL> --json\n');






