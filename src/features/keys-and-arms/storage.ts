import { LEGACY_SCORE_STORAGE_KEY, SCORE_STORAGE_KEY } from './constants';

function toScore(value: string | null): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

/**
 * KEYS & ARMS ハイスコアをロードする。
 * 新キー優先、未保存時は旧キー互換を確認する。
 */
export function loadHighScore(storage: Storage | undefined = globalThis.localStorage): number {
  if (!storage) {
    return 0;
  }

  const current = toScore(storage.getItem(SCORE_STORAGE_KEY));
  if (current > 0) {
    return current;
  }

  return toScore(storage.getItem(LEGACY_SCORE_STORAGE_KEY));
}

/**
 * ハイスコアを保存する。
 */
export function saveHighScore(
  score: number,
  storage: Storage | undefined = globalThis.localStorage
): void {
  if (!storage) {
    return;
  }

  const safeScore = Math.max(0, Math.floor(score));
  storage.setItem(SCORE_STORAGE_KEY, String(safeScore));
}

/**
 * 指定スコアでハイスコア更新が必要かを返す。
 */
export function shouldUpdateHighScore(score: number, highScore: number): boolean {
  return Math.floor(score) > Math.floor(highScore);
}
