#!/usr/bin/env node

/**
 * 自動復旧システムのテストスクリプト
 * 実際のAPIを呼び出して動作を確認します
 */

import {
  fetchJSONWithAutoRecovery,
  fetchWithAutoRecovery,
} from './utils/apiClientAuto.js';
import {
  fetchJSONWithAutoRecoveryEnhanced,
} from './utils/apiClientAutoEnhanced.js';
import { Monitor } from './utils/monitor.js';
import { StatsCollector } from './utils/stats.js';
import Logger from './utils/logger.js';

// テスト用のAPIエンドポイント（実際のAPIに置き換えてください）
const TEST_API_URL = process.env.TEST_API_URL || 'https://httpbin.org/json';

async function testBasicAutoRecovery() {
  console.log('\n=== テスト1: 基本的な自動復旧 ===\n');

  try {
    const data = await fetchJSONWithAutoRecovery(TEST_API_URL);
    console.log('✅ テスト成功:', data);
    return true;
  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    return false;
  }
}

async function testEnhancedAutoRecovery() {
  console.log('\n=== テスト2: 拡張版自動復旧（統計・モニタリング付き） ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ logger, stats, updateInterval: 2000 });

  try {
    const response = await fetchJSONWithAutoRecoveryEnhanced(
      TEST_API_URL,
      {},
      {
        logger,
        stats,
        monitor,
        showStats: true,
      }
    );
    console.log('\n✅ テスト成功:', response);
    return true;
  } catch (error) {
    console.error('\n❌ テスト失敗:', error.message);
    return false;
  }
}

async function testRateLimitSimulation() {
  console.log('\n=== テスト3: レート制限シミュレーション ===\n');
  console.log('⚠️ このテストは、レート制限エラーをシミュレートします');
  console.log('実際のレート制限エラーが発生するAPIを使用してください\n');

  // レート制限エラーをシミュレートするAPI（存在しないエンドポイントを使用）
  const rateLimitTestUrl = 'https://httpbin.org/status/429';

  try {
    const response = await fetchWithAutoRecovery(rateLimitTestUrl);
    console.log('レスポンス:', response.status);
    return true;
  } catch (error) {
    console.error('エラー:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 自動復旧システムのテストを開始します\n');
  console.log(`テストAPI: ${TEST_API_URL}\n`);

  const results = {
    basic: false,
    enhanced: false,
    rateLimit: false,
  };

  // テスト1: 基本的な自動復旧
  results.basic = await testBasicAutoRecovery();

  // 少し待機
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // テスト2: 拡張版自動復旧
  results.enhanced = await testEnhancedAutoRecovery();

  // 少し待機
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // テスト3: レート制限シミュレーション
  results.rateLimit = await testRateLimitSimulation();

  // 結果サマリー
  console.log('\n' + '='.repeat(50));
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log(`基本的な自動復旧: ${results.basic ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`拡張版自動復旧: ${results.enhanced ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`レート制限シミュレーション: ${results.rateLimit ? '✅ 成功' : '❌ 失敗'}`);
  console.log('='.repeat(50));

  const allPassed = Object.values(results).every((r) => r);
  if (allPassed) {
    console.log('\n🎉 すべてのテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n⚠️ 一部のテストが失敗しました');
    process.exit(1);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
}

export { testBasicAutoRecovery, testEnhancedAutoRecovery, testRateLimitSimulation };






