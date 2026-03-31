/**
 * APIレート制限エラーのハンドリングとリトライロジック（TypeScript版）
 */

export interface RateLimitInfo {
  limit?: string | null;
  remaining?: string | null;
  reset?: string | null;
  retryAfter?: string | null;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (
    attempt: number,
    maxRetries: number,
    delay: number,
    rateLimitInfo: RateLimitInfo | null
  ) => void;
}

/**
 * レート制限エラーかどうかを判定
 */
export function isRateLimitError(error: any): boolean {
  if (!error) return false;

  // Responseオブジェクトの場合
  if (error.status === 429) {
    return true;
  }

  // Errorオブジェクトの場合
  if (error.message) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('rate_limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded')
    );
  }

  // ステータスコードが429の場合
  if (error.statusCode === 429 || error.code === 429) {
    return true;
  }

  return false;
}

/**
 * レスポンスヘッダーからレート制限情報を取得
 */
export function getRateLimitInfo(response: Response | any): RateLimitInfo {
  const headers = response.headers || {};
  const getHeader = (name: string): string | null => {
    // Headersオブジェクトの場合
    if (headers.get) {
      return headers.get(name) || headers.get(name.toLowerCase());
    }
    // 通常のオブジェクトの場合
    return headers[name] || headers[name.toLowerCase()] || null;
  };

  return {
    limit: getHeader('x-ratelimit-limit') || getHeader('ratelimit-limit'),
    remaining: getHeader('x-ratelimit-remaining') || getHeader('ratelimit-remaining'),
    reset: getHeader('x-ratelimit-reset') || getHeader('ratelimit-reset'),
    retryAfter: getHeader('retry-after') || getHeader('Retry-After'),
  };
}

/**
 * 指数バックオフで待機時間を計算
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 60000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // ジッターを追加（ランダム性を持たせる）
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * 指定時間待機するPromise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * レート制限エラー時の待機時間を計算
 */
export function getRetryAfterDelay(error: Response | Error | any, defaultDelay: number = 60000): number {
  if (!error) return defaultDelay;

  // Retry-Afterヘッダーから取得
  let retryAfter: string | null = null;
  if (error.headers) {
    const headers = error.headers;
    if (headers.get) {
      retryAfter = headers.get('retry-after') || headers.get('Retry-After');
    } else {
      retryAfter = headers['retry-after'] || headers['Retry-After'] || null;
    }
  }

  if (retryAfter) {
    // Retry-Afterは秒単位の場合が多い
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000; // ミリ秒に変換
    }
  }

  return defaultDelay;
}

/**
 * レート制限エラーを処理し、必要に応じてリトライ
 */
export async function withRateLimitRetry<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 60000,
    onRetry = null,
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();

      // レスポンスが成功した場合
      if (response && (response as any).ok !== false) {
        return response;
      }

      // レスポンスがエラーの場合
      if (response && (response as any).status === 429) {
        const rateLimitInfo = getRateLimitInfo(response as any);
        const retryAfter = getRetryAfterDelay(
          response as any,
          calculateBackoffDelay(attempt, baseDelay, maxDelay)
        );

        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(attempt + 1, maxRetries, retryAfter, rateLimitInfo);
          }

          console.warn(
            `レート制限に達しました。${retryAfter / 1000}秒後にリトライします... (${attempt + 1}/${maxRetries})`
          );

          await sleep(retryAfter);
          continue;
        } else {
          throw new Error(
            `レート制限エラー: 最大リトライ回数（${maxRetries}回）に達しました。しばらく時間をおいてから再度お試しください。`
          );
        }
      }

      // その他のエラーレスポンス
      if (response && (response as any).ok === false) {
        throw new Error(`APIエラー: ${(response as any).status} ${(response as any).statusText}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // レート制限エラーの場合
      if (isRateLimitError(error)) {
        if (attempt < maxRetries) {
          const retryAfter = getRetryAfterDelay(error, calculateBackoffDelay(attempt, baseDelay, maxDelay));

          if (onRetry) {
            onRetry(attempt + 1, maxRetries, retryAfter, null);
          }

          console.warn(
            `レート制限に達しました。${retryAfter / 1000}秒後にリトライします... (${attempt + 1}/${maxRetries})`
          );

          await sleep(retryAfter);
          continue;
        } else {
          throw new Error(
            `レート制限エラー: 最大リトライ回数（${maxRetries}回）に達しました。しばらく時間をおいてから再度お試しください。`
          );
        }
      }

      // レート制限エラーでない場合は即座にスロー
      throw error;
    }
  }

  // ここに到達することはないはずだが、念のため
  throw lastError || new Error('予期しないエラーが発生しました');
}

/**
 * レート制限エラーメッセージをユーザーフレンドリーに変換
 */
export function getRateLimitErrorMessage(error: Error | Response | any): string {
  if (!isRateLimitError(error)) {
    return error?.message || '不明なエラーが発生しました';
  }

  const retryAfter = getRetryAfterDelay(error);
  const minutes = Math.ceil(retryAfter / 60000);

  return `APIのレート制限に達しました。${minutes}分ほど待ってから再度お試しください。`;
}






