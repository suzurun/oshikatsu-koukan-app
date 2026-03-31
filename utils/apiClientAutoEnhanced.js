/**
 * 完全自動復旧対応のAPIクライアント（拡張版）
 * 設定ファイル、通知、統計、モニタリング機能を含む
 */

import { autoRecover } from './autoRecovery.js';
import { loadConfig } from './config.js';
import NotificationManager from './notifications.js';
import { StatsCollector } from './stats.js';
import { Monitor } from './monitor.js';
import Logger from './logger.js';
import { addSession } from './history.js';

/**
 * 拡張版の完全自動復旧対応fetch
 */
export async function fetchWithAutoRecoveryEnhanced(
  url,
  options = {},
  recoveryOptions = {}
) {
  // 設定を読み込む
  const config = await loadConfig(recoveryOptions.configPath);

  // ロガー
  const logger = recoveryOptions.logger || new Logger();

  // 統計収集
  const stats = recoveryOptions.stats || new StatsCollector();

  // 通知マネージャー
  const notifications = new NotificationManager({
    enabled: config.notifications.enabled,
    onRecovery: config.notifications.onRecovery,
    onError: config.notifications.onError,
  });

  // コンソール通知を登録
  notifications.register(NotificationManager.createConsoleHandler());

  // モニター
  const monitor = recoveryOptions.monitor || null;
  if (monitor) {
    monitor.stats = stats;
    monitor.logger = logger;
    monitor.start();
  }

  try {
    const response = await autoRecover(
      async () => {
        const attemptStartTime = Date.now();
        let response = null;
        let error = null;

        try {
          response = await fetch(url, {
            ...options,
            timeout: config.api.timeout,
          });

          // レスポンスをチェック
          if (!response.ok && response.status === 429) {
            error = new Error(`HTTP 429: Rate limit reached`);
            error.status = 429;
            stats.recordAttempt(stats.stats.totalCalls + 1, false, error, response);
            return response; // リトライロジックで処理される
          }

          if (!response.ok) {
            error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            stats.recordAttempt(stats.stats.totalCalls + 1, false, error, response);
            throw error;
          }

          stats.recordAttempt(stats.stats.totalCalls + 1, true, null, response);
          return response;
        } catch (e) {
          error = e;
          stats.recordAttempt(stats.stats.totalCalls + 1, false, error, null);
          throw e;
        }
      },
      {
        retryForever: config.autoRecovery.retryForever,
        baseDelay: config.autoRecovery.baseDelay,
        maxDelay: config.autoRecovery.maxDelay,
        maxTotalWaitTime: config.autoRecovery.maxTotalWaitTime,
        logger,
        onProgress: (progress) => {
          if (recoveryOptions.onProgress) {
            recoveryOptions.onProgress(progress);
          } else {
            const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
            console.log(
              `[進行中] 試行 ${progress.attempt} | 経過: ${elapsedMinutes}分 | ${progress.message}`
            );
          }
        },
        onRecovery: async (recovery) => {
          stats.recordRecovery(recovery);
          await notifications.notifyRecovery(recovery);

          if (recoveryOptions.onRecovery) {
            recoveryOptions.onRecovery(recovery);
          } else {
            const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
            console.log(
              `\n🎉 完全復旧しました！\n` +
              `   試行回数: ${recovery.attempt}回\n` +
              `   復旧時間: ${recoveryMinutes}分\n` +
              `   エラー数: ${recovery.totalErrors}回\n`
            );
          }
        },
        onDiagnosis: (report) => {
          if (recoveryOptions.onDiagnosis) {
            recoveryOptions.onDiagnosis(report);
          }
        },
      }
    );

    return response;
  } finally {
    if (monitor) {
      monitor.stop();
    }

    // 統計情報を表示
    if (recoveryOptions.showStats !== false) {
      stats.displayStats();
    }

    // 統計情報を保存
    if (config.logging.saveToFile) {
      await stats.saveToFile('stats.json');
    }

    // 履歴に追加（エラー情報を収集）
    try {
      const errors = stats.stats.errors || [];
      const recoveries = stats.stats.recoveries || [];
      await addSession({
        attempts: stats.stats.totalCalls,
        recoveries,
        errors,
        duration: stats.stats.durationMs,
      });
    } catch (e) {
      // 履歴の保存に失敗しても続行
      logger.warn('履歴の保存に失敗しました', e);
    }
  }
}

/**
 * JSONを取得（拡張版）
 */
export async function fetchJSONWithAutoRecoveryEnhanced(
  url,
  options = {},
  recoveryOptions = {}
) {
  const response = await fetchWithAutoRecoveryEnhanced(url, options, recoveryOptions);
  return response.json();
}

/**
 * テキストを取得（拡張版）
 */
export async function fetchTextWithAutoRecoveryEnhanced(
  url,
  options = {},
  recoveryOptions = {}
) {
  const response = await fetchWithAutoRecoveryEnhanced(url, options, recoveryOptions);
  return response.text();
}

