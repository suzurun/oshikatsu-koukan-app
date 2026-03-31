/**
 * エラーレポート生成機能
 */

import { writeFile } from 'fs/promises';
import { analyzeErrorPattern, generateDiagnosticReport } from './diagnostics.js';

/**
 * 詳細なエラーレポートを生成
 */
export async function generateErrorReport(errors, stats, logger, filename = 'error-report.json') {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      totalAttempts: stats?.totalCalls || 0,
      successfulCalls: stats?.successfulCalls || 0,
      rateLimitErrors: stats?.rateLimitErrors || 0,
      networkErrors: stats?.networkErrors || 0,
      otherErrors: stats?.otherErrors || 0,
    },
    errorAnalysis: null,
    recommendations: [],
    timeline: [],
    statistics: stats?.toJSON ? stats.toJSON() : null,
  };

  // エラーパターン分析
  if (errors.length > 0) {
    const patterns = analyzeErrorPattern(errors);
    report.errorAnalysis = generateDiagnosticReport(
      errors.map((e) => e.analysis || {}),
      patterns
    );
  }

  // 推奨事項
  if (report.summary.rateLimitErrors > 0) {
    report.recommendations.push({
      priority: 'high',
      category: 'rate_limit',
      message: 'レート制限エラーが多数発生しています。',
      actions: [
        'APIキーの使用状況を確認してください',
        'プランのレート制限を確認してください',
        'リクエスト頻度を調整してください',
        '自動復旧システムが復旧まで待機します',
      ],
    });
  }

  if (report.summary.networkErrors > 0) {
    report.recommendations.push({
      priority: 'medium',
      category: 'network',
      message: 'ネットワークエラーが発生しています。',
      actions: [
        'ネットワーク接続を確認してください',
        'ファイアウォール設定を確認してください',
        'プロキシ設定を確認してください',
      ],
    });
  }

  // タイムライン
  if (stats?.attempts) {
    report.timeline = stats.attempts.map((attempt) => ({
      timestamp: new Date(attempt.timestamp).toISOString(),
      attempt: attempt.attempt,
      success: attempt.success,
      error: attempt.error,
      response: attempt.response,
    }));
  }

  // ファイルに保存
  await writeFile(filename, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`✅ エラーレポートを生成しました: ${filename}`);

  return report;
}

/**
 * レポートを読みやすい形式で表示
 */
export function displayReport(report) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 エラーレポート');
  console.log('='.repeat(80));
  console.log(`生成日時: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log('\n📈 サマリー');
  console.log('-'.repeat(80));
  console.log(`総エラー数: ${report.summary.totalErrors}`);
  console.log(`総試行回数: ${report.summary.totalAttempts}`);
  console.log(`成功回数: ${report.summary.successfulCalls}`);
  console.log(`レート制限エラー: ${report.summary.rateLimitErrors}`);
  console.log(`ネットワークエラー: ${report.summary.networkErrors}`);
  console.log(`その他のエラー: ${report.summary.otherErrors}`);

  if (report.errorAnalysis) {
    console.log('\n🔍 エラー分析');
    console.log('-'.repeat(80));
    console.log(`主な問題: ${report.errorAnalysis.primaryIssue}`);
    console.log(`信頼度: ${report.errorAnalysis.confidence}`);
    if (report.errorAnalysis.averageRetryAfter !== '不明') {
      console.log(`平均待機時間: ${report.errorAnalysis.averageRetryAfter}`);
    }
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 推奨事項');
    console.log('-'.repeat(80));
    report.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log('   アクション:');
      rec.actions.forEach((action) => {
        console.log(`     • ${action}`);
      });
    });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * HTML形式のレポートを生成
 */
export async function generateHTMLReport(report, filename = 'error-report.html') {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>エラーレポート - ${new Date(report.generatedAt).toLocaleString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      color: #666;
      margin-top: 5px;
    }
    .recommendation {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .recommendation.high {
      background: #f8d7da;
      border-left-color: #dc3545;
    }
    .recommendation.medium {
      background: #fff3cd;
      border-left-color: #ffc107;
    }
    .timeline {
      list-style: none;
      padding: 0;
    }
    .timeline-item {
      padding: 10px;
      margin: 5px 0;
      border-left: 3px solid #667eea;
      background: #f8f9fa;
    }
    .timeline-item.success {
      border-left-color: #28a745;
    }
    .timeline-item.error {
      border-left-color: #dc3545;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 エラーレポート</h1>
    <p>生成日時: ${new Date(report.generatedAt).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>📈 サマリー</h2>
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalErrors}</div>
        <div class="stat-label">総エラー数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.totalAttempts}</div>
        <div class="stat-label">総試行回数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.successfulCalls}</div>
        <div class="stat-label">成功回数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.summary.rateLimitErrors}</div>
        <div class="stat-label">レート制限エラー</div>
      </div>
    </div>
  </div>

  ${report.errorAnalysis ? `
  <div class="section">
    <h2>🔍 エラー分析</h2>
    <p><strong>主な問題:</strong> ${report.errorAnalysis.primaryIssue}</p>
    <p><strong>信頼度:</strong> ${report.errorAnalysis.confidence}</p>
    ${report.errorAnalysis.averageRetryAfter !== '不明' ? `<p><strong>平均待機時間:</strong> ${report.errorAnalysis.averageRetryAfter}</p>` : ''}
  </div>
  ` : ''}

  ${report.recommendations.length > 0 ? `
  <div class="section">
    <h2>💡 推奨事項</h2>
    ${report.recommendations.map((rec, index) => `
      <div class="recommendation ${rec.priority}">
        <h3>${index + 1}. ${rec.message}</h3>
        <ul>
          ${rec.actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${report.timeline.length > 0 ? `
  <div class="section">
    <h2>📅 タイムライン</h2>
    <ul class="timeline">
      ${report.timeline.slice(-20).map(item => `
        <li class="timeline-item ${item.success ? 'success' : 'error'}">
          <strong>${new Date(item.timestamp).toLocaleString()}</strong>
          ${item.success ? '✅ 成功' : '❌ エラー'}
          ${item.error ? `<br>エラー: ${item.error.message || item.error}` : ''}
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h2>📄 詳細データ</h2>
    <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(report, null, 2)}</pre>
  </div>
</body>
</html>`;

  await writeFile(filename, html, 'utf-8');
  console.log(`✅ HTMLレポートを生成しました: ${filename}`);
  return filename;
}






