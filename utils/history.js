/**
 * 履歴管理機能
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const HISTORY_DIR = 'history';
const HISTORY_FILE = join(HISTORY_DIR, 'history.json');

/**
 * 履歴を読み込む
 */
export async function loadHistory() {
  if (!existsSync(HISTORY_FILE)) {
    return {
      sessions: [],
      totalSessions: 0,
      totalRecoveries: 0,
      totalErrors: 0,
    };
  }

  try {
    const data = await readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('履歴の読み込みに失敗しました:', error.message);
    return {
      sessions: [],
      totalSessions: 0,
      totalRecoveries: 0,
      totalErrors: 0,
    };
  }
}

/**
 * 履歴を保存
 */
export async function saveHistory(history) {
  try {
    // ディレクトリが存在しない場合は作成
    if (!existsSync(HISTORY_DIR)) {
      await mkdir(HISTORY_DIR, { recursive: true });
    }

    await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('履歴の保存に失敗しました:', error.message);
    throw error;
  }
}

/**
 * セッションを履歴に追加
 */
export async function addSession(sessionData) {
  const history = await loadHistory();

  const session = {
    id: `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...sessionData,
  };

  history.sessions.push(session);
  history.totalSessions++;
  history.totalRecoveries += sessionData.recoveries?.length || 0;
  history.totalErrors += sessionData.errors?.length || 0;

  // 最新100セッションのみ保持
  if (history.sessions.length > 100) {
    history.sessions = history.sessions.slice(-100);
  }

  await saveHistory(history);
  return session;
}

/**
 * 履歴を取得
 */
export async function getHistory(limit = 10) {
  const history = await loadHistory();
  return {
    ...history,
    sessions: history.sessions.slice(-limit).reverse(),
  };
}

/**
 * 履歴統計を取得
 */
export async function getHistoryStats() {
  const history = await loadHistory();

  const stats = {
    totalSessions: history.totalSessions,
    totalRecoveries: history.totalRecoveries,
    totalErrors: history.totalErrors,
    averageRecoveriesPerSession: history.totalSessions > 0
      ? (history.totalRecoveries / history.totalSessions).toFixed(2)
      : 0,
    averageErrorsPerSession: history.totalSessions > 0
      ? (history.totalErrors / history.totalSessions).toFixed(2)
      : 0,
    recentSessions: history.sessions.slice(-10).reverse(),
  };

  return stats;
}

/**
 * 履歴を表示
 */
export function displayHistory(history) {
  console.log('\n' + '='.repeat(80));
  console.log('📚 履歴');
  console.log('='.repeat(80));
  console.log(`総セッション数: ${history.totalSessions}`);
  console.log(`総復旧回数: ${history.totalRecoveries}`);
  console.log(`総エラー数: ${history.totalErrors}`);
  console.log(`平均復旧回数/セッション: ${history.averageRecoveriesPerSession || 0}`);
  console.log(`平均エラー数/セッション: ${history.averageErrorsPerSession || 0}`);

  if (history.recentSessions.length > 0) {
    console.log('\n最近のセッション:');
    console.log('-'.repeat(80));
    history.recentSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.id}`);
      console.log(`   日時: ${new Date(session.timestamp).toLocaleString()}`);
      console.log(`   試行回数: ${session.attempts || 0}`);
      console.log(`   復旧回数: ${session.recoveries?.length || 0}`);
      console.log(`   エラー数: ${session.errors?.length || 0}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}






