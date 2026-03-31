/**
 * 統計情報の可視化と分析
 */

export class StatsCollector {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      attempts: [],
      errors: [],
      recoveries: [],
      totalCalls: 0,
      successfulCalls: 0,
      rateLimitErrors: 0,
      networkErrors: 0,
      otherErrors: 0,
    };
  }

  /**
   * 試行を記録
   */
  recordAttempt(attempt, success, error = null, response = null) {
    this.stats.totalCalls++;
    this.stats.attempts.push({
      attempt,
      timestamp: Date.now(),
      success,
      error: error ? {
        message: error.message,
        type: this.getErrorType(error),
      } : null,
      response: response ? {
        status: response.status,
        statusText: response.statusText,
      } : null,
    });

    if (success) {
      this.stats.successfulCalls++;
    } else if (error) {
      const errorType = this.getErrorType(error);
      if (errorType === 'rate_limit') {
        this.stats.rateLimitErrors++;
        this.stats.errors.push({
          type: 'rate_limit',
          timestamp: Date.now(),
          attempt,
          error: error.message,
        });
      } else if (errorType === 'network') {
        this.stats.networkErrors++;
        this.stats.errors.push({
          type: 'network',
          timestamp: Date.now(),
          attempt,
          error: error.message,
        });
      } else {
        this.stats.otherErrors++;
        this.stats.errors.push({
          type: 'other',
          timestamp: Date.now(),
          attempt,
          error: error.message,
        });
      }
    }
  }

  /**
   * 復旧を記録
   */
  recordRecovery(recoveryInfo) {
    this.stats.recoveries.push({
      ...recoveryInfo,
      timestamp: Date.now(),
    });
  }

  /**
   * エラータイプを取得
   */
  getErrorType(error) {
    if (!error) return 'unknown';
    if (error.status === 429 || error.message?.includes('rate limit')) return 'rate_limit';
    if (error.message?.includes('fetch') || error.message?.includes('network')) return 'network';
    return 'other';
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const duration = Date.now() - this.stats.startTime;
    const successRate = this.stats.totalCalls > 0
      ? (this.stats.successfulCalls / this.stats.totalCalls * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      duration: `${(duration / 1000).toFixed(2)}秒`,
      durationMs: duration,
      successRate: `${successRate}%`,
      averageAttemptsPerRecovery: this.stats.recoveries.length > 0
        ? (this.stats.attempts.length / this.stats.recoveries.length).toFixed(2)
        : 0,
    };
  }

  /**
   * 統計情報を表示
   */
  displayStats() {
    const stats = this.getStats();
    console.log('\n📊 統計情報');
    console.log('='.repeat(50));
    console.log(`総試行回数: ${stats.totalCalls}`);
    console.log(`成功回数: ${stats.successfulCalls}`);
    console.log(`成功率: ${stats.successRate}`);
    console.log(`レート制限エラー: ${stats.rateLimitErrors}`);
    console.log(`ネットワークエラー: ${stats.networkErrors}`);
    console.log(`その他のエラー: ${stats.otherErrors}`);
    console.log(`復旧回数: ${stats.recoveries.length}`);
    console.log(`総経過時間: ${stats.duration}`);
    if (stats.recoveries.length > 0) {
      console.log(`平均試行回数/復旧: ${stats.averageAttemptsPerRecovery}`);
    }
    console.log('='.repeat(50));
  }

  /**
   * 統計情報をJSON形式で取得
   */
  toJSON() {
    return this.getStats();
  }

  /**
   * 統計情報をファイルに保存
   */
  async saveToFile(filename = 'stats.json') {
    const fs = await import('fs/promises');
    const stats = this.toJSON();
    await fs.writeFile(filename, JSON.stringify(stats, null, 2), 'utf-8');
    console.log(`✅ 統計情報を保存しました: ${filename}`);
  }
}






