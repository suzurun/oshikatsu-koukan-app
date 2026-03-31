/**
 * 設定ファイル管理
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_CONFIG = {
  autoRecovery: {
    retryForever: true,
    baseDelay: 1000,
    maxDelay: 300000, // 5分
    maxTotalWaitTime: Infinity,
    healthCheckInterval: 60000, // 1分
    requiredSuccesses: 2, // 2回連続成功で復旧とみなす
  },
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    saveToFile: true,
    logFileName: 'recovery-log.json',
  },
  notifications: {
    enabled: false,
    onRecovery: false,
    onError: false,
  },
  api: {
    timeout: 30000, // 30秒
    retryOnNetworkError: true,
  },
};

/**
 * 設定を読み込む
 */
export async function loadConfig(configPath = 'auto-recovery.config.json') {
  let config = { ...DEFAULT_CONFIG };

  // 相対パスの場合はプロジェクトルートから解決
  const fullPath = configPath.startsWith('/') 
    ? configPath 
    : join(process.cwd(), configPath);

  if (existsSync(fullPath)) {
    try {
      const configFile = await readFile(fullPath, 'utf-8');
      const userConfig = JSON.parse(configFile);
      config = deepMerge(config, userConfig);
      console.log(`✅ 設定ファイルを読み込みました: ${fullPath}`);
    } catch (error) {
      console.warn(`⚠️ 設定ファイルの読み込みに失敗しました: ${error.message}`);
      console.log('デフォルト設定を使用します');
    }
  } else {
    console.log('設定ファイルが見つかりません。デフォルト設定を使用します');
  }

  return config;
}

/**
 * 深いマージ
 */
function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * デフォルト設定を取得
 */
export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}

/**
 * 設定テンプレートを生成
 */
export function generateConfigTemplate() {
  return JSON.stringify(DEFAULT_CONFIG, null, 2);
}

