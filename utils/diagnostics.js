/**
 * レート制限エラーの原因分析・診断機能
 */

import { isRateLimitError, getRateLimitInfo, getRetryAfterDelay } from './rateLimitHandler.js';

/**
 * エラーの詳細情報を分析
 */
export function analyzeError(error, response = null) {
  const analysis = {
    timestamp: new Date().toISOString(),
    isRateLimit: false,
    errorType: 'unknown',
    errorMessage: error?.message || String(error),
    statusCode: null,
    rateLimitInfo: null,
    retryAfter: null,
    recommendations: [],
    severity: 'low',
  };

  // レスポンスから情報を取得
  if (response) {
    analysis.statusCode = response.status;
    analysis.rateLimitInfo = getRateLimitInfo(response);
    analysis.retryAfter = getRetryAfterDelay(response);

    if (response.status === 429) {
      analysis.isRateLimit = true;
      analysis.errorType = 'rate_limit_429';
      analysis.severity = 'high';
      analysis.recommendations.push('レート制限に達しました。Retry-Afterヘッダーを確認してください。');
    }
  }

  // エラーオブジェクトから情報を取得
  if (error) {
    if (isRateLimitError(error)) {
      analysis.isRateLimit = true;
      analysis.errorType = 'rate_limit_error';
      analysis.severity = 'high';

      if (error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('rate limit')) {
          analysis.recommendations.push('APIのレート制限に達しています。');
        }
        if (message.includes('quota')) {
          analysis.errorType = 'quota_exceeded';
          analysis.recommendations.push('APIクォータを超過しています。プランの確認が必要です。');
        }
      }

      if (error.statusCode === 429 || error.code === 429) {
        analysis.statusCode = 429;
        analysis.recommendations.push('HTTP 429エラー: レート制限に達しています。');
      }
    }

    // ネットワークエラーの可能性
    if (error.message && error.message.includes('fetch')) {
      analysis.errorType = 'network_error';
      analysis.severity = 'medium';
      analysis.recommendations.push('ネットワークエラーの可能性があります。接続を確認してください。');
    }

    // タイムアウトエラー
    if (error.message && (error.message.includes('timeout') || error.message.includes('timed out'))) {
      analysis.errorType = 'timeout';
      analysis.severity = 'medium';
      analysis.recommendations.push('リクエストがタイムアウトしました。再試行してください。');
    }
  }

  // 推奨事項を追加
  if (analysis.isRateLimit) {
    if (analysis.retryAfter) {
      const minutes = Math.ceil(analysis.retryAfter / 60000);
      analysis.recommendations.push(`${minutes}分後に自動的にリトライします。`);
    } else {
      analysis.recommendations.push('指数バックオフで自動リトライします。');
    }
    analysis.recommendations.push('APIキーの使用状況を確認してください。');
    analysis.recommendations.push('プランのレート制限を確認してください。');
  }

  return analysis;
}

/**
 * 複数のエラーからパターンを分析
 */
export function analyzeErrorPattern(errors) {
  const patterns = {
    rateLimitCount: 0,
    networkErrorCount: 0,
    timeoutCount: 0,
    otherErrorCount: 0,
    averageRetryAfter: 0,
    totalRetries: errors.length,
  };

  let totalRetryAfter = 0;
  let retryAfterCount = 0;

  errors.forEach((error) => {
    const analysis = analyzeError(error.error, error.response);
    if (analysis.isRateLimit) {
      patterns.rateLimitCount++;
      if (analysis.retryAfter) {
        totalRetryAfter += analysis.retryAfter;
        retryAfterCount++;
      }
    } else if (analysis.errorType === 'network_error') {
      patterns.networkErrorCount++;
    } else if (analysis.errorType === 'timeout') {
      patterns.timeoutCount++;
    } else {
      patterns.otherErrorCount++;
    }
  });

  if (retryAfterCount > 0) {
    patterns.averageRetryAfter = Math.round(totalRetryAfter / retryAfterCount);
  }

  // 診断結果
  const diagnosis = {
    primaryIssue: patterns.rateLimitCount > 0 ? 'rate_limit' : 'unknown',
    confidence: patterns.rateLimitCount / patterns.totalRetries,
    patterns,
    recommendations: [],
  };

  if (patterns.rateLimitCount > 0) {
    diagnosis.recommendations.push('レート制限エラーが主な原因です。');
    if (patterns.averageRetryAfter > 0) {
      const avgMinutes = Math.ceil(patterns.averageRetryAfter / 60000);
      diagnosis.recommendations.push(`平均待機時間: ${avgMinutes}分`);
    }
  }

  if (patterns.networkErrorCount > 0) {
    diagnosis.recommendations.push('ネットワークエラーも発生しています。接続を確認してください。');
  }

  return diagnosis;
}

/**
 * 診断レポートを生成
 */
export function generateDiagnosticReport(analyses, patterns) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalErrors: analyses.length,
      rateLimitErrors: patterns.rateLimitCount,
      networkErrors: patterns.networkErrorCount,
      timeoutErrors: patterns.timeoutCount,
      otherErrors: patterns.otherErrorCount,
    },
    primaryIssue: patterns.rateLimitCount > 0 ? 'レート制限エラー' : '不明',
    confidence: `${(patterns.rateLimitCount / patterns.totalRetries * 100).toFixed(1)}%`,
    averageRetryAfter: patterns.averageRetryAfter > 0
      ? `${Math.ceil(patterns.averageRetryAfter / 60000)}分`
      : '不明',
    recommendations: patterns.rateLimitCount > 0
      ? [
          'レート制限エラーが主な原因です。',
          '自動リトライシステムが復旧まで待機します。',
          'APIキーの使用状況とプランのレート制限を確認してください。',
        ]
      : ['エラーの原因を特定できませんでした。詳細なログを確認してください。'],
    detailedAnalyses: analyses,
  };

  return report;
}






