/**
 * 通知機能
 */

class NotificationManager {
  constructor(options = {}) {
    this.enabled = options.enabled ?? false;
    this.onRecovery = options.onRecovery ?? false;
    this.onError = options.onError ?? false;
    this.handlers = [];
  }

  /**
   * 通知ハンドラーを登録
   */
  register(handler) {
    this.handlers.push(handler);
  }

  /**
   * 復旧通知
   */
  async notifyRecovery(recoveryInfo) {
    if (!this.enabled || !this.onRecovery) return;

    const message = `🎉 API復旧完了！\n試行回数: ${recoveryInfo.attempt}回\n復旧時間: ${(recoveryInfo.recoveryTime / 60000).toFixed(1)}分`;

    for (const handler of this.handlers) {
      try {
        await handler.onRecovery(recoveryInfo, message);
      } catch (error) {
        console.error('通知の送信に失敗しました:', error);
      }
    }
  }

  /**
   * エラー通知
   */
  async notifyError(errorInfo) {
    if (!this.enabled || !this.onError) return;

    const message = `⚠️ レート制限エラー発生\n試行回数: ${errorInfo.attempt}回\nエラー: ${errorInfo.error?.message || 'Unknown'}`;

    for (const handler of this.handlers) {
      try {
        await handler.onError(errorInfo, message);
      } catch (error) {
        console.error('通知の送信に失敗しました:', error);
      }
    }
  }

  /**
   * コンソール通知ハンドラー
   */
  static createConsoleHandler() {
    return {
      onRecovery: async (recoveryInfo, message) => {
        console.log('\n📢 [通知]', message);
      },
      onError: async (errorInfo, message) => {
        console.warn('\n📢 [通知]', message);
      },
    };
  }

  /**
   * ファイル通知ハンドラー
   */
  static createFileHandler(filename = 'notifications.log') {
    return {
      onRecovery: async (recoveryInfo, message) => {
        const fs = await import('fs/promises');
        const log = `[${new Date().toISOString()}] RECOVERY: ${message}\n`;
        await fs.appendFile(filename, log, 'utf-8');
      },
      onError: async (errorInfo, message) => {
        const fs = await import('fs/promises');
        const log = `[${new Date().toISOString()}] ERROR: ${message}\n`;
        await fs.appendFile(filename, log, 'utf-8');
      },
    };
  }
}

export default NotificationManager;

