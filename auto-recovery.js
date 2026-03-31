#!/usr/bin/env node

/**
 * 完全自動復旧スクリプト
 * レート制限エラーが完全に復旧するまで自動的にリトライします
 * 
 * 使用方法:
 *   node auto-recovery.js <API_URL>
 * 
 * 例:
 *   node auto-recovery.js https://api.example.com/data
 */

import { fetchWithAutoRecovery, fetchJSONWithAutoRecovery } from './utils/apiClientAuto.js';
import Logger from './utils/logger.js';

const logger = new Logger();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node auto-recovery.js <API_URL> [OPTIONS]

オプション:
  --json          JSONレスポンスを期待
  --method=METHOD HTTPメソッド (GET, POST, etc.)
  --headers=JSON  HTTPヘッダー (JSON形式)
  --body=JSON     HTTPボディ (JSON形式)

例:
  node auto-recovery.js https://api.example.com/data --json
  node auto-recovery.js https://api.example.com/data --method=POST --body='{"key":"value"}'
    `);
    process.exit(1);
  }

  const url = args[0];
  const options = {
    method: 'GET',
    headers: {},
  };

  // オプションを解析
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') {
      // JSONフラグは後で処理
    } else if (arg.startsWith('--method=')) {
      options.method = arg.split('=')[1];
    } else if (arg.startsWith('--headers=')) {
      try {
        options.headers = JSON.parse(arg.split('=')[1]);
      } catch (e) {
        logger.error('ヘッダーの解析に失敗しました', e);
        process.exit(1);
      }
    } else if (arg.startsWith('--body=')) {
      try {
        options.body = arg.split('=')[1];
        if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
          options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        }
      } catch (e) {
        logger.error('ボディの解析に失敗しました', e);
        process.exit(1);
      }
    }
  }

  logger.info('🚀 完全自動復旧システムを開始します');
  logger.info(`URL: ${url}`);
  logger.info(`メソッド: ${options.method}`);
  logger.info('設定: 完全復旧まで自動リトライ（無限リトライ）');

  try {
    let result;

    if (args.includes('--json')) {
      logger.info('JSONレスポンスを期待します');
      result = await fetchJSONWithAutoRecovery(url, options, {
        logger,
        onProgress: (progress) => {
          const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
          process.stdout.write(
            `\r[進行中] 試行 ${progress.attempt} | 経過: ${elapsedMinutes}分 | ${progress.message}`
          );
        },
        onRecovery: (recovery) => {
          process.stdout.write('\n');
          const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
          logger.success(
            `\n🎉 完全復旧しました！\n` +
            `   試行回数: ${recovery.attempt}回\n` +
            `   復旧時間: ${recoveryMinutes}分\n` +
            `   エラー数: ${recovery.totalErrors}回\n`
          );
        },
      });
    } else {
      result = await fetchWithAutoRecovery(url, options, {
        logger,
        onProgress: (progress) => {
          const elapsedMinutes = (progress.elapsed / 60000).toFixed(1);
          process.stdout.write(
            `\r[進行中] 試行 ${progress.attempt} | 経過: ${elapsedMinutes}分 | ${progress.message}`
          );
        },
        onRecovery: (recovery) => {
          process.stdout.write('\n');
          const recoveryMinutes = (recovery.recoveryTime / 60000).toFixed(1);
          logger.success(
            `\n🎉 完全復旧しました！\n` +
            `   試行回数: ${recovery.attempt}回\n` +
            `   復旧時間: ${recoveryMinutes}分\n` +
            `   エラー数: ${recovery.totalErrors}回\n`
          );
        },
      });
      result = await result.text();
    }

    logger.success('✅ API呼び出しが成功しました');
    console.log('\n結果:');
    if (typeof result === 'object') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }

    // ログを保存
    const stats = logger.getStats();
    logger.info('\n📊 統計情報:', stats);

    // ログファイルを保存
    try {
      const logFile = await logger.saveToFile('recovery-log.json');
      logger.info(`ログを保存しました: ${logFile}`);
    } catch (e) {
      logger.warn('ログの保存に失敗しました（続行します）', e);
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ エラーが発生しました', error);
    const stats = logger.getStats();
    logger.info('📊 統計情報:', stats);

    // ログを保存
    try {
      const logFile = await logger.saveToFile('recovery-log-error.json');
      logger.info(`エラーログを保存しました: ${logFile}`);
    } catch (e) {
      // 無視
    }

    process.exit(1);
  }
}

main();






