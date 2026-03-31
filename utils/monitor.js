/**
 * モニタリングダッシュボード（簡易版）
 */

import Logger from './logger.js';
import { StatsCollector } from './stats.js';

export class Monitor {
  constructor(options = {}) {
    this.logger = options.logger || new Logger();
    this.stats = options.stats || new StatsCollector();
    this.updateInterval = options.updateInterval || 5000; // 5秒ごとに更新
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * モニタリングを開始
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.logger.info('📊 モニタリングを開始しました');

    this.intervalId = setInterval(() => {
      this.updateDisplay();
    }, this.updateInterval);

    // 初回表示
    this.updateDisplay();
  }

  /**
   * モニタリングを停止
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logger.info('📊 モニタリングを停止しました');
    this.updateDisplay(); // 最終状態を表示
  }

  /**
   * 表示を更新
   */
  updateDisplay() {
    // コンソールをクリア（ANSIエスケープシーケンス）
    process.stdout.write('\x1B[2J\x1B[0f');

    const stats = this.stats.getStats();
    const logs = this.logger.getLogs();
    const recentLogs = logs.slice(-10); // 最新10件

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          API自動復旧システム - モニタリングダッシュボード      ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // 統計情報
    console.log('📊 統計情報');
    console.log('─'.repeat(50));
    console.log(`  総試行回数: ${stats.totalCalls}`);
    console.log(`  成功回数: ${stats.successfulCalls} (${stats.successRate})`);
    console.log(`  レート制限エラー: ${stats.rateLimitErrors}`);
    console.log(`  ネットワークエラー: ${stats.networkErrors}`);
    console.log(`  その他のエラー: ${stats.otherErrors}`);
    console.log(`  復旧回数: ${stats.recoveries.length}`);
    console.log(`  経過時間: ${stats.duration}`);
    console.log('─'.repeat(50));

    // 最新のログ
    console.log('\n📝 最新のログ (最新10件)');
    console.log('─'.repeat(50));
    if (recentLogs.length === 0) {
      console.log('  ログがありません');
    } else {
      recentLogs.forEach((log) => {
        const icon = this.getLogIcon(log.level);
        const time = new Date(log.timestamp).toLocaleTimeString();
        console.log(`  ${icon} [${time}] ${log.message}`);
        if (log.data && typeof log.data === 'object') {
          console.log(`     ${JSON.stringify(log.data)}`);
        }
      });
    }
    console.log('─'.repeat(50));

    // ステータス
    console.log('\n🔄 ステータス: ' + (this.isRunning ? '実行中' : '停止中'));
    console.log('─'.repeat(50));
    console.log('  Ctrl+C で停止\n');
  }

  /**
   * ログアイコンを取得
   */
  getLogIcon(level) {
    const icons = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      SUCCESS: '✅',
    };
    return icons[level] || '📌';
  }
}

/**
 * シンプルなプログレスバー
 */
export class ProgressBar {
  constructor(total, options = {}) {
    this.total = total;
    this.current = 0;
    this.width = options.width || 50;
    this.char = options.char || '█';
    this.emptyChar = options.emptyChar || '░';
  }

  /**
   * 進捗を更新
   */
  update(current, message = '') {
    this.current = current;
    const percentage = Math.min(100, (current / this.total * 100));
    const filled = Math.round(this.width * percentage / 100);
    const empty = this.width - filled;
    const bar = this.char.repeat(filled) + this.emptyChar.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percentage.toFixed(1)}% ${message}`);
  }

  /**
   * 完了
   */
  complete(message = '完了') {
    this.update(this.total, message);
    console.log(''); // 改行
  }
}






