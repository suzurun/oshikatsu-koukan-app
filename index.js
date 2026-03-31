/**
 * メインエントリーポイント
 * 完全自動復旧システムの簡単な使用例
 */

import { fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';
import { fetchJSONWithAutoRecoveryEnhanced } from './utils/apiClientAutoEnhanced.js';
import { Monitor } from './utils/monitor.js';
import { StatsCollector } from './utils/stats.js';
import Logger from './utils/logger.js';
import { exportAll } from './utils/export.js';
import { generateErrorReport, displayReport } from './utils/report.js';

/**
 * 基本的な使用例
 */
export async function basicExample(url) {
  console.log('📡 基本的な自動復旧を使用...');
  const data = await fetchJSONWithAutoRecovery(url);
  return data;
}

/**
 * 拡張版の使用例（統計・モニタリング付き）
 */
export async function enhancedExample(url) {
  console.log('📡 拡張版自動復旧を使用（統計・モニタリング付き）...');

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ stats, logger, updateInterval: 2000 });

  try {
    monitor.start();

    const data = await fetchJSONWithAutoRecoveryEnhanced(
      url,
      {},
      {
        logger,
        stats,
        monitor,
        showStats: true,
      }
    );

    // エクスポート
    await exportAll(stats, logger, 'enhanced-example');

    return data;
  } finally {
    monitor.stop();
  }
}

/**
 * 完全なワークフロー例
 */
export async function completeWorkflowExample(url) {
  console.log('📡 完全なワークフローを実行...');

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ stats, logger, updateInterval: 2000 });
  const errors = [];
  const recoveries = [];

  try {
    monitor.start();

    const data = await fetchJSONWithAutoRecoveryEnhanced(
      url,
      {},
      {
        logger,
        stats,
        monitor,
        onRecovery: (recovery) => {
          recoveries.push(recovery);
        },
      }
    );

    // エクスポート
    await exportAll(stats, logger, 'complete-workflow');

    // エラーレポート生成
    if (errors.length > 0) {
      const report = await generateErrorReport(errors, stats, logger);
      displayReport(report);
    }

    return data;
  } catch (error) {
    errors.push({ error });
    throw error;
  } finally {
    monitor.stop();
  }
}

// CLI実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || 'https://httpbin.org/json';
  const mode = process.argv[3] || 'basic';

  console.log(`\n🚀 自動復旧システムを実行します`);
  console.log(`URL: ${url}`);
  console.log(`モード: ${mode}\n`);

  (async () => {
    try {
      let result;
      switch (mode) {
        case 'enhanced':
          result = await enhancedExample(url);
          break;
        case 'complete':
          result = await completeWorkflowExample(url);
          break;
        default:
          result = await basicExample(url);
      }
      console.log('\n✅ 成功:', result);
    } catch (error) {
      console.error('\n❌ エラー:', error.message);
      process.exit(1);
    }
  })();
}

export { basicExample, enhancedExample, completeWorkflowExample };






