/**
 * 実用的な使用例 - 実際のシナリオ
 */

import {
  fetchJSONWithAutoRecoveryEnhanced,
} from '../utils/apiClientAutoEnhanced.js';
import { Monitor } from '../utils/monitor.js';
import { StatsCollector } from '../utils/stats.js';
import Logger from '../utils/logger.js';
import { exportAll } from '../utils/export.js';
import { generateErrorReport, generateHTMLReport, displayReport } from '../utils/report.js';
import { addSession, getHistoryStats, displayHistory } from '../utils/history.js';
import NotificationManager from '../utils/notifications.js';

/**
 * シナリオ1: 複数のAPIエンドポイントを順次呼び出し
 */
async function scenario1_MultipleEndpoints() {
  console.log('\n=== シナリオ1: 複数のAPIエンドポイントを順次呼び出し ===\n');

  const endpoints = [
    'https://api.example.com/users',
    'https://api.example.com/posts',
    'https://api.example.com/comments',
  ];

  const logger = new Logger();
  const stats = new StatsCollector();
  const errors = [];

  for (const endpoint of endpoints) {
    try {
      logger.info(`📡 ${endpoint} を呼び出し中...`);
      const data = await fetchJSONWithAutoRecoveryEnhanced(
        endpoint,
        {},
        {
          logger,
          stats,
          showStats: false,
        }
      );
      logger.success(`✅ ${endpoint} 成功`);
      console.log(`データ取得: ${Object.keys(data).length} 件`);
    } catch (error) {
      logger.error(`❌ ${endpoint} 失敗: ${error.message}`);
      errors.push({ endpoint, error });
    }
  }

  // 統計情報を表示
  stats.displayStats();

  // エクスポート
  await exportAll(stats, logger, 'scenario1');

  return { stats, errors };
}

/**
 * シナリオ2: モニタリング付きの長時間実行
 */
async function scenario2_WithMonitoring() {
  console.log('\n=== シナリオ2: モニタリング付きの長時間実行 ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ stats, logger, updateInterval: 3000 });

  try {
    monitor.start();

    const data = await fetchJSONWithAutoRecoveryEnhanced(
      'https://api.example.com/data',
      {},
      {
        logger,
        stats,
        monitor,
        showStats: true,
      }
    );

    console.log('\n✅ データ取得成功');
    return data;
  } finally {
    monitor.stop();
  }
}

/**
 * シナリオ3: エラーレポート生成
 */
async function scenario3_ErrorReporting() {
  console.log('\n=== シナリオ3: エラーレポート生成 ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const errors = [];

  try {
    // 複数のAPIを呼び出し
    const endpoints = [
      'https://api.example.com/data1',
      'https://api.example.com/data2',
      'https://api.example.com/data3',
    ];

    for (const endpoint of endpoints) {
      try {
        await fetchJSONWithAutoRecoveryEnhanced(endpoint, {}, { logger, stats });
      } catch (error) {
        errors.push({
          endpoint,
          error,
          analysis: { message: error.message },
        });
      }
    }

    // エラーレポートを生成
    const report = await generateErrorReport(errors, stats, logger);
    displayReport(report);

    // HTMLレポートも生成
    await generateHTMLReport(report);

    return report;
  } catch (error) {
    console.error('エラー:', error);
    throw error;
  }
}

/**
 * シナリオ4: 通知機能付き
 */
async function scenario4_WithNotifications() {
  console.log('\n=== シナリオ4: 通知機能付き ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const notifications = new NotificationManager({
    enabled: true,
    onRecovery: true,
    onError: true,
  });

  // コンソール通知を登録
  notifications.register(NotificationManager.createConsoleHandler());

  // ファイル通知を登録
  notifications.register(NotificationManager.createFileHandler('notifications.log'));

  try {
    const data = await fetchJSONWithAutoRecoveryEnhanced(
      'https://api.example.com/data',
      {},
      {
        logger,
        stats,
        onRecovery: async (recovery) => {
          await notifications.notifyRecovery(recovery);
        },
      }
    );

    return data;
  } catch (error) {
    await notifications.notifyError({
      attempt: stats.stats.totalCalls,
      error,
    });
    throw error;
  }
}

/**
 * シナリオ5: 履歴管理付き
 */
async function scenario5_WithHistory() {
  console.log('\n=== シナリオ5: 履歴管理付き ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const errors = [];
  const recoveries = [];

  try {
    const data = await fetchJSONWithAutoRecoveryEnhanced(
      'https://api.example.com/data',
      {},
      {
        logger,
        stats,
        onRecovery: (recovery) => {
          recoveries.push(recovery);
        },
      }
    );

    // セッションを履歴に追加
    await addSession({
      attempts: stats.stats.totalCalls,
      recoveries,
      errors,
      duration: stats.stats.durationMs,
    });

    // 履歴統計を表示
    const historyStats = await getHistoryStats();
    displayHistory(historyStats);

    return data;
  } catch (error) {
    errors.push({ error });
    await addSession({
      attempts: stats.stats.totalCalls,
      recoveries,
      errors,
      duration: stats.stats.durationMs,
    });
    throw error;
  }
}

/**
 * シナリオ6: 完全なワークフロー
 */
async function scenario6_CompleteWorkflow() {
  console.log('\n=== シナリオ6: 完全なワークフロー ===\n');

  const logger = new Logger();
  const stats = new StatsCollector();
  const monitor = new Monitor({ stats, logger, updateInterval: 2000 });
  const notifications = new NotificationManager({
    enabled: true,
    onRecovery: true,
    onError: true,
  });

  notifications.register(NotificationManager.createConsoleHandler());

  const errors = [];
  const recoveries = [];

  try {
    monitor.start();

    const data = await fetchJSONWithAutoRecoveryEnhanced(
      'https://api.example.com/data',
      {},
      {
        logger,
        stats,
        monitor,
        onRecovery: async (recovery) => {
          recoveries.push(recovery);
          await notifications.notifyRecovery(recovery);
        },
      }
    );

    // エクスポート
    await exportAll(stats, logger, 'complete-workflow');

    // エラーレポート生成
    if (errors.length > 0) {
      const report = await generateErrorReport(errors, stats, logger);
      await generateHTMLReport(report);
    }

    // 履歴に追加
    await addSession({
      attempts: stats.stats.totalCalls,
      recoveries,
      errors,
      duration: stats.stats.durationMs,
    });

    return data;
  } catch (error) {
    errors.push({ error });
    await notifications.notifyError({
      attempt: stats.stats.totalCalls,
      error,
    });
    throw error;
  } finally {
    monitor.stop();
  }
}

// 使用例（コメントアウトを外して実行）
// scenario1_MultipleEndpoints();
// scenario2_WithMonitoring();
// scenario3_ErrorReporting();
// scenario4_WithNotifications();
// scenario5_WithHistory();
// scenario6_CompleteWorkflow();

export {
  scenario1_MultipleEndpoints,
  scenario2_WithMonitoring,
  scenario3_ErrorReporting,
  scenario4_WithNotifications,
  scenario5_WithHistory,
  scenario6_CompleteWorkflow,
};






