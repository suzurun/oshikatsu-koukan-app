/**
 * レート制限対応のAPIクライアント
 * 
 * 完全自動復旧が必要な場合は、apiClientAuto.js を使用してください
 */

import {
  withRateLimitRetry,
  isRateLimitError,
  getRateLimitErrorMessage,
  getRateLimitInfo,
} from './rateLimitHandler.js';

/**
 * レート制限対応のfetchラッパー
 * @param {string} url - リクエストURL
 * @param {Object} options - fetchオプション
 * @param {Object} retryOptions - リトライオプション
 * @returns {Promise<Response>} レスポンス
 */
export async function fetchWithRateLimit(url, options = {}, retryOptions = {}) {
  return withRateLimitRetry(
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
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 60000,
      onRetry: (attempt, maxRetries, delay, rateLimitInfo) => {
        console.log(`リトライ ${attempt}/${maxRetries} - ${delay / 1000}秒待機`);
        if (rateLimitInfo) {
          console.log('レート制限情報:', rateLimitInfo);
        }
      },
      ...retryOptions,
    }
  );
}

/**
 * JSONを取得する（レート制限対応）
 * @param {string} url - リクエストURL
 * @param {Object} options - fetchオプション
 * @param {Object} retryOptions - リトライオプション
 * @returns {Promise<Object>} JSONデータ
 */
export async function fetchJSON(url, options = {}, retryOptions = {}) {
  const response = await fetchWithRateLimit(url, options, retryOptions);
  return response.json();
}

/**
 * テキストを取得する（レート制限対応）
 * @param {string} url - リクエストURL
 * @param {Object} options - fetchオプション
 * @param {Object} retryOptions - リトライオプション
 * @returns {Promise<string>} テキストデータ
 */
export async function fetchText(url, options = {}, retryOptions = {}) {
  const response = await fetchWithRateLimit(url, options, retryOptions);
  return response.text();
}

/**
 * エラーハンドリング付きAPI呼び出し
 * @param {Function} apiCall - API呼び出し関数
 * @param {Object} options - オプション
 * @returns {Promise} API呼び出しの結果
 */
export async function safeApiCall(apiCall, options = {}) {
  try {
    return await apiCall();
  } catch (error) {
    if (isRateLimitError(error)) {
      const message = getRateLimitErrorMessage(error);
      console.error('レート制限エラー:', message);
      throw new Error(message);
    }
    throw error;
  }
}

