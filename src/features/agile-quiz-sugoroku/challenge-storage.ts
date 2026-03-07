/**
 * Agile Quiz Sugoroku - チャレンジモード ストレージ
 *
 * サバイバルモードのハイスコア管理
 */

const STORAGE_KEY = 'aqs_challenge_highscore';

/** ハイスコアを読み込む */
export function loadHighScore(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    const score = Number(data);
    return isNaN(score) ? 0 : score;
  } catch {
    return 0;
  }
}

/** ハイスコアを保存する（既存より高い場合のみ） */
export function saveHighScore(score: number): void {
  try {
    const current = loadHighScore();
    if (score > current) {
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** ハイスコアを削除する */
export function clearHighScore(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}
