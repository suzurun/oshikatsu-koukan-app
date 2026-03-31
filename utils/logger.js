/**
 * 詳細ログ記録システム
 */

class Logger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  /**
   * ログを記録
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const logEntry = {
      timestamp,
      elapsed: `${(elapsed / 1000).toFixed(2)}秒`,
      level,
      message,
      data,
    };

    this.logs.push(logEntry);

    // コンソールにも出力
    const prefix = `[${logEntry.elapsed}] [${level}]`;
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }

    return logEntry;
  }

  info(message, data = null) {
    return this.log('INFO', message, data);
  }

  warn(message, data = null) {
    return this.log('WARN', message, data);
  }

  error(message, data = null) {
    return this.log('ERROR', message, data);
  }

  success(message, data = null) {
    return this.log('SUCCESS', message, data);
  }

  /**
   * ログを取得
   */
  getLogs() {
    return this.logs;
  }

  /**
   * ログをクリア
   */
  clear() {
    this.logs = [];
    this.startTime = Date.now();
  }

  /**
   * ログをファイルに保存
   */
  async saveToFile(filename = 'recovery-log.json') {
    const fs = await import('fs/promises');
    const logData = {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}秒`,
      totalLogs: this.logs.length,
      logs: this.logs,
    };

    try {
      await fs.writeFile(filename, JSON.stringify(logData, null, 2), 'utf-8');
      this.info(`ログを保存しました: ${filename}`);
      return filename;
    } catch (error) {
      this.error(`ログの保存に失敗しました: ${error.message}`);
      throw error;
    }
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const errors = this.logs.filter((log) => log.level === 'ERROR').length;
    const warnings = this.logs.filter((log) => log.level === 'WARN').length;
    const successes = this.logs.filter((log) => log.level === 'SUCCESS').length;

    return {
      total: this.logs.length,
      errors,
      warnings,
      successes,
      duration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}秒`,
    };
  }
}

export default Logger;






