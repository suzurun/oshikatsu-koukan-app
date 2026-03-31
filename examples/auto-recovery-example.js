/**
 * 完全自動復旧システムの使用例
 * レート制限エラーが完全に復旧するまで自動的にリトライします
 */

import {
  fetchWithAutoRecovery,
  fetchJSONWithAutoRecovery,
  autoRecoverApiCall,
} from '../utils/apiClientAuto.js';
import Logger from '../utils/logger.js';

// 例1: 基本的な使用方法（完全自動復旧）
async function example1() {
  console.log('\n=== 例1: 基本的な自動復旧 ===\n');

  try {
    const data = await fetchJSONWithAutoRecovery('https://api.example.com/data');
    console.log('✅ データ取得成功:', data);
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 例2: カスタムロガーとプログレス表示
async function example2() {
  console.log('\n=== 例2: カスタムロガー付き自動復旧 ===\n');

  const logger = new Logger();

  try {
    const response = await fetchWithAutoRecovery(
      'https://api.example.com/data',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
        },
      },
      {
        logger,
        onProgress: (progress) => {
          const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
          console.log(
            `[${new Date().toLocaleTimeString()}] 試行 ${progress.attempt} | ` +
            `経過: ${elapsedMinutes}分 | ${progress.message}`
          );
        },
        onRecovery: (recovery) => {
          const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
          console.log(
            `\n🎉 完全復旧しました！\n` +
            `   試行回数: ${recovery.attempt}回\n` +
            `   復旧時間: ${recoveryMinutes}分\n` +
            `   エラー数: ${recovery.totalErrors}回\n`
          );
        },
        onDiagnosis: (report) => {
          console.log('\n📊 診断レポート:');
          console.log(`   主な問題: ${report.primaryIssue}`);
          console.log(`   信頼度: ${report.confidence}`);
          console.log(`   平均待機時間: ${report.averageRetryAfter}`);
          console.log('   推奨事項:');
          report.recommendations.forEach((rec) => console.log(`     • ${rec}`));
        },
      }
    );

    const data = await response.json();
    console.log('✅ データ取得成功:', data);

    // ログを保存
    const stats = logger.getStats();
    console.log('\n📊 統計情報:', stats);
    await logger.saveToFile('example-recovery-log.json');
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 例3: カスタムAPI呼び出しの自動復旧
async function example3() {
  console.log('\n=== 例3: カスタムAPI呼び出しの自動復旧 ===\n');

  try {
    const result = await autoRecoverApiCall(
      async () => {
        // あなたのカスタムAPI呼び出し
        const response = await fetch('https://api.example.com/custom-endpoint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN',
          },
          body: JSON.stringify({ data: 'example' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      {
        onProgress: (progress) => {
          console.log(`[進行中] 試行 ${progress.attempt}: ${progress.message}`);
        },
      }
    );

    console.log('✅ カスタムAPI呼び出し成功:', result);
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 例4: 複数のAPI呼び出しを順次実行（各呼び出しが完全復旧まで自動リトライ）
async function example4() {
  console.log('\n=== 例4: 複数API呼び出しの自動復旧 ===\n');

  const endpoints = [
    'https://api.example.com/data1',
    'https://api.example.com/data2',
    'https://api.example.com/data3',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 ${endpoint} を呼び出し中...`);
      const data = await fetchJSONWithAutoRecovery(endpoint);
      results.push({ endpoint, data, success: true });
      console.log(`✅ ${endpoint} 成功`);
    } catch (error) {
      console.error(`❌ ${endpoint} 失敗:`, error.message);
      results.push({ endpoint, error: error.message, success: false });
    }
  }

  console.log('\n📊 結果サマリー:');
  results.forEach((result) => {
    if (result.success) {
      console.log(`  ✅ ${result.endpoint}: 成功`);
    } else {
      console.log(`  ❌ ${result.endpoint}: ${result.error}`);
    }
  });

  return results;
}

// 使用例を実行（コメントアウトを外して実行）
// example1();
// example2();
// example3();
// example4();

export { example1, example2, example3, example4 };






