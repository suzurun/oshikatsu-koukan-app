/**
 * 完全自動復旧システム - レート制限エラーが完全に復旧するまで自動リトライ
 */

import {
  isRateLimitError,
  getRateLimitInfo,
  getRetryAfterDelay,
  calculateBackoffDelay,
  sleep,
} from './rateLimitHandler.js';
import { analyzeError, analyzeErrorPattern, generateDiagnosticReport } from './diagnostics.js';
import Logger from './logger.js';

/**
 * 完全自動復旧オプション
 */
export class AutoRecoveryOptions {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? Infinity; // 無限リトライ（完全復旧まで）
    this.baseDelay = options.baseDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 300000; // 最大5分
    this.retryForever = options.retryForever ?? true; // デフォルトで無限リトライ
    this.healthCheckInterval = options.healthCheckInterval ?? 60000; // 1分ごとにヘルスチェック
    this.onProgress = options.onProgress ?? null;
    this.onRecovery = options.onRecovery ?? null;
    this.onDiagnosis = options.onDiagnosis ?? null;
    this.logger = options.logger ?? new Logger();
    this.maxTotalWaitTime = options.maxTotalWaitTime ?? Infinity; // 最大総待機時間（無限）
  }
}

/**
 * 完全自動復旧システム
 * レート制限エラーが完全に復旧するまで自動的にリトライを続けます
 */
export async function autoRecover(apiCall, options = {}) {
  const opts = new AutoRecoveryOptions(options);
  const logger = opts.logger;
  const startTime = Date.now();
  let attempt = 0;
  let consecutiveSuccesses = 0;
  const requiredSuccesses = 2; // 2回連続成功で復旧とみなす
  const errors = [];
  let lastSuccessfulResponse = null;

  logger.info('🚀 自動復旧システムを開始しました');
  logger.info(`設定: 無限リトライ=${opts.retryForever}, 最大リトライ=${opts.maxRetries === Infinity ? '無制限' : opts.maxRetries}`);

  // プログレス表示用の関数
  const showProgress = (message, data = null) => {
    if (opts.onProgress) {
      opts.onProgress({
        attempt,
        message,
        data,
        elapsed: Date.now() - startTime,
        consecutiveSuccesses,
      });
    }
  };

  while (true) {
    // 最大総待機時間のチェック
    if (opts.maxTotalWaitTime !== Infinity) {
      const totalWaitTime = Date.now() - startTime;
      if (totalWaitTime > opts.maxTotalWaitTime) {
        const error = new Error(
          `最大待機時間（${opts.maxTotalWaitTime / 1000}秒）を超過しました。復旧を確認できませんでした。`
        );
        logger.error('❌ 最大待機時間を超過しました', { totalWaitTime });
        throw error;
      }
    }

    // 最大リトライ回数のチェック（無限リトライでない場合）
    if (!opts.retryForever && attempt >= opts.maxRetries) {
      const error = new Error(
        `最大リトライ回数（${opts.maxRetries}回）に達しました。復旧を確認できませんでした。`
      );
      logger.error('❌ 最大リトライ回数に達しました', { attempt, maxRetries: opts.maxRetries });
      throw error;
    }

    attempt++;
    const attemptStartTime = Date.now();

    try {
      logger.info(`📡 API呼び出しを試行中... (試行回数: ${attempt})`);
      showProgress(`試行 ${attempt}`, { status: 'calling' });

      const response = await apiCall();

      // レスポンスが成功した場合
      if (response && (response.ok === undefined || response.ok === true)) {
        consecutiveSuccesses++;
        lastSuccessfulResponse = response;

        logger.success(`✅ API呼び出し成功 (連続成功: ${consecutiveSuccesses}/${requiredSuccesses})`);

        // 復旧確認: 連続で成功した場合
        if (consecutiveSuccesses >= requiredSuccesses) {
          const recoveryTime = Date.now() - startTime;
          logger.success(`🎉 完全復旧を確認しました！ (総時間: ${(recoveryTime / 1000).toFixed(2)}秒)`);

          if (opts.onRecovery) {
            opts.onRecovery({
              attempt,
              recoveryTime,
              totalErrors: errors.length,
              response: lastSuccessfulResponse,
            });
          }

          // 診断レポートを生成
          if (errors.length > 0 && opts.onDiagnosis) {
            const patterns = analyzeErrorPattern(errors);
            const report = generateDiagnosticReport(
              errors.map((e) => analyzeError(e.error, e.response)),
              patterns
            );
            opts.onDiagnosis(report);
          }

          return response;
        }

        // まだ復旧確認ができていない場合、少し待ってから次の呼び出し
        await sleep(2000); // 2秒待機
        continue;
      }

      // レスポンスがエラーの場合
      if (response && response.status === 429) {
        consecutiveSuccesses = 0; // リセット
        const rateLimitInfo = getRateLimitInfo(response);
        const retryAfter = getRetryAfterDelay(
          response,
          calculateBackoffDelay(attempt - 1, opts.baseDelay, opts.maxDelay)
        );

        const errorAnalysis = analyzeError(null, response);
        errors.push({ error: null, response, analysis: errorAnalysis, attempt, timestamp: new Date() });

        logger.warn(
          `⚠️ レート制限エラー検出 (HTTP 429) - ${retryAfter / 1000}秒後に自動リトライします...`
        );
        logger.info('レート制限情報:', rateLimitInfo);

        showProgress(`レート制限エラー - ${Math.ceil(retryAfter / 1000)}秒待機`, {
          status: 'waiting',
          retryAfter,
          rateLimitInfo,
        });

        // 診断情報を表示
        if (errorAnalysis.recommendations.length > 0) {
          logger.info('💡 推奨事項:', errorAnalysis.recommendations);
        }

        await sleep(retryAfter);
        continue;
      }

      // その他のエラーレスポンス
      if (response && !response.ok) {
        consecutiveSuccesses = 0;
        const error = new Error(`APIエラー: ${response.status} ${response.statusText}`);
        const errorAnalysis = analyzeError(error, response);
        errors.push({ error, response, analysis: errorAnalysis, attempt, timestamp: new Date() });

        logger.error(`❌ APIエラー (HTTP ${response.status}): ${response.statusText}`);

        // レート制限エラーでない場合は即座にスロー
        if (!isRateLimitError(response)) {
          throw error;
        }
      }

      return response;
    } catch (error) {
      consecutiveSuccesses = 0;
      const errorAnalysis = analyzeError(error, null);
      errors.push({ error, response: null, analysis: errorAnalysis, attempt, timestamp: new Date() });

      // レート制限エラーの場合
      if (isRateLimitError(error)) {
        const retryAfter = getRetryAfterDelay(
          error,
          calculateBackoffDelay(attempt - 1, opts.baseDelay, opts.maxDelay)
        );

        logger.warn(`⚠️ レート制限エラー検出 - ${retryAfter / 1000}秒後に自動リトライします...`);
        logger.error('エラー詳細:', errorAnalysis);

        showProgress(`レート制限エラー - ${Math.ceil(retryAfter / 1000)}秒待機`, {
          status: 'waiting',
          retryAfter,
          error: errorAnalysis,
        });

        // 診断情報を表示
        if (errorAnalysis.recommendations.length > 0) {
          logger.info('💡 推奨事項:', errorAnalysis.recommendations);
        }

        await sleep(retryAfter);
        continue;
      }

      // レート制限エラーでない場合は即座にスロー
      logger.error('❌ レート制限以外のエラーが発生しました', errorAnalysis);
      throw error;
    }
  }
}

/**
 * ヘルスチェック機能付き自動復旧
 * 定期的にAPIの状態を確認し、復旧を検知します
 */
export async function autoRecoverWithHealthCheck(apiCall, healthCheckCall, options = {}) {
  const opts = new AutoRecoveryOptions(options);
  const logger = opts.logger;

  logger.info('🏥 ヘルスチェック機能付き自動復旧システムを開始しました');

  // ヘルスチェックを並行して実行
  const healthCheckPromise = (async () => {
    while (true) {
      await sleep(opts.healthCheckInterval);
      try {
        logger.info('🏥 ヘルスチェックを実行中...');
        await healthCheckCall();
        logger.success('✅ ヘルスチェック成功 - APIは正常に動作しています');
      } catch (error) {
        if (isRateLimitError(error)) {
          logger.warn('⚠️ ヘルスチェック: レート制限が継続中です');
        } else {
          logger.warn('⚠️ ヘルスチェック: エラーが検出されました', error);
        }
      }
    }
  })();

  // メインの自動復旧を実行
  try {
    const result = await autoRecover(apiCall, options);
    return result;
  } finally {
    // ヘルスチェックを停止（実際には無限ループなので、ここには到達しない）
  }
}






