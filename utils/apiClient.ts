/**
 * レート制限対応のAPIクライアント（TypeScript版）
 */

import {
  withRateLimitRetry,
  isRateLimitError,
  getRateLimitErrorMessage,
  getRateLimitInfo,
  RetryOptions,
} from './rateLimitHandler.js';

/**
 * レート制限対応のfetchラッパー
 */
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
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
 */
export async function fetchJSON<T = any>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRateLimit(url, options, retryOptions);
  return response.json();
}

/**
 * テキストを取得する（レート制限対応）
 */
export async function fetchText(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<string> {
  const response = await fetchWithRateLimit(url, options, retryOptions);
  return response.text();
}

/**
 * エラーハンドリング付きAPI呼び出し
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await withRateLimitRetry(apiCall, options);
  } catch (error: any) {
    if (isRateLimitError(error)) {
      const message = getRateLimitErrorMessage(error);
      console.error('レート制限エラー:', message);
      throw new Error(message);
    }
    throw error;
  }
}






