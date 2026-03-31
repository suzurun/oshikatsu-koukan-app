#!/usr/bin/env node

/**
 * デモスクリプト - 完全自動復旧システムの動作確認
 */

import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';
import { fetchJSONWithAutoRecoveryEnhanced } from './utils/apiClientAutoEnhanced.js';
import { Monitor } from './utils/monitor.js';
import { StatsCollector } from './utils/stats.js';
import Logger from './utils/logger.js';

async function demo1_Basic() {
  console.log('\n' + '='.repeat(60));
  console.log('デモ1: 基本的な自動復旧');
  console.log('='.repeat(60));

  try {
    const data = await fetchJSONWithAutoRecovery('https://httpbin.org/json');
    console.log('\n✅ 成功！データ取得完了');
    console.log('取得データ:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    return false;
  }
}

async function demo2_Enhanced() {
  console.log('\n' + '='.repeat(60));
  console.log('デモ2: 拡張版自動復旧（統計・モニタリング付き）');
  console.log('='.repeat(60));

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ stats, logger, updateInterval: 1000 });

  try {
    monitor.start();

    const data = await fetchJSONWithAutoRecoveryEnhanced(
      'https://httpbin.org/json',
      {},
      {
        logger,
        stats,
        monitor,
        showStats: true,
      }
    );

    console.log('\n✅ 成功！データ取得完了');
    console.log('取得データ:', JSON.stringify(data, null, 2));

    // 統計情報を表示
    stats.displayStats();

    return true;
  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    return false;
  } finally {
    monitor.stop();
  }
}

async function demo3_MultipleEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('デモ3: 複数エンドポイントの順次呼び出し');
  console.log('='.repeat(60));

  const endpoints = [
    'https://httpbin.org/json',
    'https://httpbin.org/uuid',
    'https://httpbin.org/user-agent',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 ${endpoint} を呼び出し中...`);
      const data = await fetchJSONWithAutoRecovery(endpoint);
      results.push({ endpoint, success: true, data });
      console.log(`✅ ${endpoint} 成功`);
    } catch (error) {
      results.push({ endpoint, success: false, error: error.message });
      console.error(`❌ ${endpoint} 失敗: ${error.message}`);
    }
  }

  console.log('\n📊 結果サマリー:');
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.endpoint}: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
  });

  return results.every((r) => r.success);
}

async function runAllDemos() {
  console.log('\n🚀 完全自動復旧システム - デモを開始します\n');

  const results = {
    demo1: false,
    demo2: false,
    demo3: false,
  };

  // デモ1: 基本的な自動復旧
  results.demo1 = await demo1_Basic();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // デモ2: 拡張版自動復旧
  results.demo2 = await demo2_Enhanced();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // デモ3: 複数エンドポイント
  results.demo3 = await demo3_MultipleEndpoints();

  // 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 デモ結果サマリー');
  console.log('='.repeat(60));
  console.log(`デモ1 (基本): ${results.demo1 ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`デモ2 (拡張): ${results.demo2 ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`デモ3 (複数): ${results.demo3 ? '✅ 成功' : '❌ 失敗'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every((r) => r);
  if (allPassed) {
    console.log('\n🎉 すべてのデモが成功しました！');
    console.log('\n💡 次のステップ:');
    console.log('  1. 実際のAPIエンドポイントでテスト');
    console.log('  2. 設定ファイルをカスタマイズ');
    console.log('  3. 統計情報とログを確認');
    process.exit(0);
  } else {
    console.log('\n⚠️ 一部のデモが失敗しました');
    process.exit(1);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
}

export { demo1_Basic, demo2_Enhanced, demo3_MultipleEndpoints };






