/**
 * APIレート制限エラーのハンドリングとリトライロジック
 */

/**
 * レート制限エラーかどうかを判定
 * @param {Error|Response} error - エラーオブジェクトまたはレスポンス
 * @returns {boolean} レート制限エラーの場合true
 */
export function isRateLimitError(error) {
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
 * @param {Response} response - レスポンスオブジェクト
 * @returns {Object} レート制限情報
 */
export function getRateLimitInfo(response) {
  const headers = response.headers || {};
  const getHeader = (name) => {
    // Headersオブジェクトの場合
    if (headers.get) {
      return headers.get(name) || headers.get(name.toLowerCase());
    }
    // 通常のオブジェクトの場合
    return headers[name] || headers[name.toLowerCase()];
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
 * @param {number} attempt - リトライ回数（0から開始）
 * @param {number} baseDelay - ベース待機時間（ミリ秒）
 * @param {number} maxDelay - 最大待機時間（ミリ秒）
 * @returns {number} 待機時間（ミリ秒）
 */
export function calculateBackoffDelay(attempt, baseDelay = 1000, maxDelay = 60000) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // ジッターを追加（ランダム性を持たせる）
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * 指定時間待機するPromise
 * @param {number} ms - 待機時間（ミリ秒）
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * レート制限エラー時の待機時間を計算
 * @param {Response|Error} error - エラーまたはレスポンス
 * @param {number} defaultDelay - デフォルト待機時間（ミリ秒）
 * @returns {number} 待機時間（ミリ秒）
 */
export function getRetryAfterDelay(error, defaultDelay = 60000) {
  if (!error) return defaultDelay;

  // Retry-Afterヘッダーから取得
  let retryAfter = null;
  if (error.headers) {
    const headers = error.headers;
    if (headers.get) {
      retryAfter = headers.get('retry-after') || headers.get('Retry-After');
    } else {
      retryAfter = headers['retry-after'] || headers['Retry-After'];
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
 * @param {Function} apiCall - API呼び出し関数（Promiseを返す）
 * @param {Object} options - オプション
 * @param {number} options.maxRetries - 最大リトライ回数（デフォルト: 3）
 * @param {number} options.baseDelay - ベース待機時間（ミリ秒、デフォルト: 1000）
 * @param {number} options.maxDelay - 最大待機時間（ミリ秒、デフォルト: 60000）
 * @param {Function} options.onRetry - リトライ時のコールバック
 * @returns {Promise} API呼び出しの結果
 */
export async function withRateLimitRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 60000,
    onRetry = null,
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();

      // レスポンスが成功した場合
      if (response && response.ok !== false) {
        return response;
      }

      // レスポンスがエラーの場合
      if (response && response.status === 429) {
        const rateLimitInfo = getRateLimitInfo(response);
        const retryAfter = getRetryAfterDelay(response, calculateBackoffDelay(attempt, baseDelay, maxDelay));

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
      if (response && !response.ok) {
        throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
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
 * @param {Error|Response} error - エラーオブジェクトまたはレスポンス
 * @returns {string} ユーザーフレンドリーなエラーメッセージ
 */
export function getRateLimitErrorMessage(error) {
  if (!isRateLimitError(error)) {
    return error?.message || '不明なエラーが発生しました';
  }

  const retryAfter = getRetryAfterDelay(error);
  const minutes = Math.ceil(retryAfter / 60000);

  return `APIのレート制限に達しました。${minutes}分ほど待ってから再度お試しください。`;
}






