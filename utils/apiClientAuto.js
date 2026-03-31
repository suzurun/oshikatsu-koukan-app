/**
 * 完全自動復旧対応のAPIクライアント
 * レート制限エラーが完全に復旧するまで自動的にリトライします
 */

import { autoRecover, autoRecoverWithHealthCheck } from './autoRecovery.js';
import Logger from './logger.js';

/**
 * 完全自動復旧対応のfetchラッパー
 * レート制限エラーが完全に復旧するまで自動的にリトライします
 */
export async function fetchWithAutoRecovery(url, options = {}, recoveryOptions = {}) {
  const logger = recoveryOptions.logger || new Logger();

  return autoRecover(
    async () => {
      const response = await fetch(url, options);

      // レスポンスをチェック
      if (!response.ok && response.status === 429) {
        // レート制限エラーの場合、レスポンスをそのまま返す（リトライロジックで処理される）
        return response;
      }

      // その他のエラーの場合もレスポンスを返す
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      retryForever: true, // 完全復旧まで無限リトライ
      baseDelay: 1000,
      maxDelay: 300000, // 最大5分
      onProgress: (progress) => {
        const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
        console.log(
          `[進行状況] 試行 ${progress.attempt} | 経過時間: ${elapsedMinutes}分 | ${progress.message}`
        );
      },
      onRecovery: (recovery) => {
        const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
        console.log(
          `\n🎉 完全復旧しました！\n` +
          `   - 試行回数: ${recovery.attempt}回\n` +
          `   - 復旧時間: ${recoveryMinutes}分\n` +
          `   - エラー数: ${recovery.totalErrors}回\n`
        );
      },
      onDiagnosis: (report) => {
        console.log('\n📊 診断レポート:');
        console.log(`   - 主な問題: ${report.primaryIssue}`);
        console.log(`   - 信頼度: ${report.confidence}`);
        console.log(`   - 平均待機時間: ${report.averageRetryAfter}`);
        console.log('   - 推奨事項:');
        report.recommendations.forEach((rec) => console.log(`     • ${rec}`));
      },
      logger,
      ...recoveryOptions,
    }
  );
}

/**
 * JSONを取得する（完全自動復旧対応）
 */
export async function fetchJSONWithAutoRecovery(url, options = {}, recoveryOptions = {}) {
  const response = await fetchWithAutoRecovery(url, options, recoveryOptions);
  return response.json();
}

/**
 * テキストを取得する（完全自動復旧対応）
 */
export async function fetchTextWithAutoRecovery(url, options = {}, recoveryOptions = {}) {
  const response = await fetchWithAutoRecovery(url, options, recoveryOptions);
  return response.text();
}

/**
 * カスタムAPI呼び出しを完全自動復旧対応で実行
 */
export async function autoRecoverApiCall(apiCall, recoveryOptions = {}) {
  return autoRecover(apiCall, {
    retryForever: true,
    baseDelay: 1000,
    maxDelay: 300000,
    onProgress: (progress) => {
      const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
      console.log(
        `[自動復旧中] 試行 ${progress.attempt} | 経過: ${elapsedMinutes}分 | ${progress.message}`
      );
    },
    onRecovery: (recovery) => {
      const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
      console.log(`\n✅ 復旧完了！ (${recoveryMinutes}分、${recovery.attempt}回試行)\n`);
    },
    ...recoveryOptions,
  });
}






