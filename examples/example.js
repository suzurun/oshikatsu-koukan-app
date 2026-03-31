/**
 * レート制限対応APIの使用例
 */

import { fetchWithRateLimit, fetchJSON, safeApiCall } from '../utils/apiClient.js';
import { isRateLimitError, getRateLimitErrorMessage } from '../utils/rateLimitHandler.js';

// 例1: 基本的な使用方法
async function example1() {
  try {
    const response = await fetchWithRateLimit('https://api.example.com/data');
    const data = await response.json();
    console.log('データ取得成功:', data);
  } catch (error) {
    if (isRateLimitError(error)) {
      console.error('レート制限エラー:', getRateLimitErrorMessage(error));
    } else {
      console.error('その他のエラー:', error);
    }
  }
}

// 例2: JSONを直接取得
async function example2() {
  try {
    const data = await fetchJSON('https://api.example.com/data');
    console.log('データ取得成功:', data);
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 例3: カスタムリトライオプション
async function example3() {
  try {
    const response = await fetchWithRateLimit(
      'https://api.example.com/data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN',
        },
        body: JSON.stringify({ data: 'example' }),
      },
      {
        maxRetries: 5,        // 最大リトライ回数
        baseDelay: 2000,      // ベース待機時間（2秒）
        maxDelay: 120000,     // 最大待機時間（2分）
        onRetry: (attempt, maxRetries, delay, rateLimitInfo) => {
          console.log(`リトライ ${attempt}/${maxRetries} - ${delay / 1000}秒待機`);
          if (rateLimitInfo) {
            console.log('レート制限情報:', rateLimitInfo);
          }
        },
      }
    );
    const data = await response.json();
    console.log('データ取得成功:', data);
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 例4: safeApiCallを使用
async function example4() {
  try {
    const data = await safeApiCall(async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    });
    console.log('データ取得成功:', data);
  } catch (error) {
    // レート制限エラーは自動的に処理され、わかりやすいメッセージが返される
    console.error('エラー:', error.message);
  }
}

// 例5: 複数のAPI呼び出しを順次実行（レート制限を考慮）
async function example5() {
  const endpoints = [
    'https://api.example.com/data1',
    'https://api.example.com/data2',
    'https://api.example.com/data3',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const data = await fetchJSON(endpoint);
      results.push(data);
      console.log(`取得成功: ${endpoint}`);
    } catch (error) {
      if (isRateLimitError(error)) {
        console.error(`レート制限エラー: ${endpoint}`, getRateLimitErrorMessage(error));
        // レート制限に達した場合、残りのリクエストをスキップ
        break;
      } else {
        console.error(`エラー: ${endpoint}`, error);
      }
    }
  }

  return results;
}

// 使用例を実行（コメントアウトを外して実行）
// example1();
// example2();
// example3();
// example4();
// example5();

export { example1, example2, example3, example4, example5 };






