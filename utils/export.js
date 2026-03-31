/**
 * データエクスポート機能（CSV、JSON）
 */

import { writeFile } from 'fs/promises';

/**
 * 統計情報をCSV形式でエクスポート
 */
export async function exportStatsToCSV(stats, filename = 'stats.csv') {
  const statsData = stats.toJSON ? stats.toJSON() : stats;
  const attempts = statsData.attempts || [];
  const errors = statsData.errors || [];
  const recoveries = statsData.recoveries || [];

  let csv = '';

  // ヘッダー
  csv += 'Type,Timestamp,Attempt,Status,Error,Response\n';

  // 試行データ
  attempts.forEach((attempt) => {
    const timestamp = new Date(attempt.timestamp).toISOString();
    const status = attempt.success ? 'Success' : 'Failed';
    const error = attempt.error ? attempt.error.message : '';
    const response = attempt.response ? `${attempt.response.status} ${attempt.response.statusText}` : '';
    csv += `Attempt,${timestamp},${attempt.attempt},${status},"${error}","${response}"\n`;
  });

  // エラーデータ
  errors.forEach((error) => {
    const timestamp = new Date(error.timestamp).toISOString();
    csv += `Error,${timestamp},${error.attempt},Failed,"${error.error}",""\n`;
  });

  // 復旧データ
  recoveries.forEach((recovery) => {
    const timestamp = new Date(recovery.timestamp).toISOString();
    csv += `Recovery,${timestamp},${recovery.attempt},Success,"",""\n`;
  });

  await writeFile(filename, csv, 'utf-8');
  console.log(`✅ CSVファイルをエクスポートしました: ${filename}`);
  return filename;
}

/**
 * 統計情報をJSON形式でエクスポート
 */
export async function exportStatsToJSON(stats, filename = 'stats.json') {
  const statsData = stats.toJSON ? stats.toJSON() : stats;
  const json = JSON.stringify(statsData, null, 2);
  await writeFile(filename, json, 'utf-8');
  console.log(`✅ JSONファイルをエクスポートしました: ${filename}`);
  return filename;
}

/**
 * ログをテキスト形式でエクスポート
 */
export async function exportLogsToText(logger, filename = 'logs.txt') {
  const logs = logger.getLogs();
  let text = '';

  text += '='.repeat(80) + '\n';
  text += 'API自動復旧システム - ログ\n';
  text += '='.repeat(80) + '\n\n';

  logs.forEach((log) => {
    text += `[${log.timestamp}] [${log.level}] ${log.message}\n`;
    if (log.data) {
      text += `  データ: ${JSON.stringify(log.data, null, 2)}\n`;
    }
    text += '\n';
  });

  // 統計情報
  const stats = logger.getStats();
  text += '\n' + '='.repeat(80) + '\n';
  text += '統計情報\n';
  text += '='.repeat(80) + '\n';
  text += `総ログ数: ${stats.total}\n`;
  text += `エラー数: ${stats.errors}\n`;
  text += `警告数: ${stats.warnings}\n`;
  text += `成功数: ${stats.successes}\n`;
  text += `経過時間: ${stats.duration}\n`;

  await writeFile(filename, text, 'utf-8');
  console.log(`✅ ログファイルをエクスポートしました: ${filename}`);
  return filename;
}

/**
 * すべてのデータを一括エクスポート
 */
export async function exportAll(stats, logger, baseFilename = 'export') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${baseFilename}-${timestamp}`;

  const files = {
    statsCSV: await exportStatsToCSV(stats, `${base}-stats.csv`),
    statsJSON: await exportStatsToJSON(stats, `${base}-stats.json`),
    logs: await exportLogsToText(logger, `${base}-logs.txt`),
  };

  console.log(`\n✅ すべてのデータをエクスポートしました:`);
  console.log(`   - ${files.statsCSV}`);
  console.log(`   - ${files.statsJSON}`);
  console.log(`   - ${files.logs}`);

  return files;
}






