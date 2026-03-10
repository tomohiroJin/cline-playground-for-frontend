/**
 * デイリーチャレンジシステム
 * 日付ベースのシード値で毎日異なる特殊ルールの対戦を生成する
 */
import { Difficulty } from './types';
import { FIELDS } from './config';

const STORAGE_KEY = 'ah_daily_challenge';

/** チャレンジの特殊ルール修飾子 */
export type ChallengeModifier = {
  name: string;
  description: string;
};

/** デイリーチャレンジの定義 */
export type DailyChallenge = {
  date: string;
  fieldId: string;
  difficulty: Difficulty;
  winScore: number;
  modifiers: ChallengeModifier[];
  title: string;
};

/** チャレンジの結果 */
export type DailyChallengeResult = {
  date: string;
  isCleared: boolean;
  playerScore: number;
  cpuScore: number;
};

/** チャレンジのパターン定義 */
const CHALLENGE_PATTERNS: Array<{
  title: string;
  modifiers: ChallengeModifier[];
  winScore: number;
}> = [
  {
    title: 'スピードラッシュ',
    modifiers: [{ name: 'fastPuck', description: 'パックが高速' }],
    winScore: 3,
  },
  {
    title: 'タイニーゴール',
    modifiers: [{ name: 'smallGoal', description: 'ゴールが狭い' }],
    winScore: 3,
  },
  {
    title: 'アイテムフィーバー',
    modifiers: [{ name: 'manyItems', description: 'アイテム大量出現' }],
    winScore: 7,
  },
  {
    title: 'ビッグマレット',
    modifiers: [{ name: 'bigMallet', description: 'マレットが巨大' }],
    winScore: 3,
  },
  {
    title: 'サバイバル',
    modifiers: [{ name: 'noItems', description: 'アイテムなし' }],
    winScore: 7,
  },
  {
    title: 'カオスマッチ',
    modifiers: [
      { name: 'fastPuck', description: 'パックが高速' },
      { name: 'manyItems', description: 'アイテム大量出現' },
    ],
    winScore: 3,
  },
  {
    title: 'マスターチャレンジ',
    modifiers: [{ name: 'smallGoal', description: 'ゴールが狭い' }],
    winScore: 7,
  },
];

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * 日付からシード値を生成する
 * 同一日付では常に同じ値を返す
 */
export function generateDailySeed(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 簡易ハッシュ: 日付の各要素を組み合わせる
  return year * 10000 + month * 100 + day;
}

/**
 * 疑似乱数生成器（シードベース）
 * 同一シードでは常に同じ系列を生成する
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

/** 日付文字列をフォーマットする（YYYY-MM-DD） */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 指定日付のデイリーチャレンジを生成する
 * 同一日付では常に同じチャレンジを返す
 */
export function generateDailyChallenge(date: Date): DailyChallenge {
  const seed = generateDailySeed(date);
  const rand = seededRandom(seed);

  const patternIndex = Math.floor(rand() * CHALLENGE_PATTERNS.length);
  const pattern = CHALLENGE_PATTERNS[patternIndex];

  const fieldIndex = Math.floor(rand() * FIELDS.length);
  const field = FIELDS[fieldIndex];

  const diffIndex = Math.floor(rand() * DIFFICULTIES.length);
  const difficulty = DIFFICULTIES[diffIndex];

  return {
    date: formatDate(date),
    fieldId: field.id,
    difficulty,
    winScore: pattern.winScore,
    modifiers: pattern.modifiers,
    title: pattern.title,
  };
}

/** デイリーチャレンジの結果を読み込む */
export function getDailyChallengeResult(dateStr: string): DailyChallengeResult | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const results: Record<string, DailyChallengeResult> = JSON.parse(raw);
    return results[dateStr];
  } catch {
    return undefined;
  }
}

/** デイリーチャレンジの結果を保存する */
export function saveDailyChallengeResult(result: DailyChallengeResult): void {
  let results: Record<string, DailyChallengeResult> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) results = JSON.parse(raw);
  } catch {
    // パース失敗時は空オブジェクトで初期化
  }
  results[result.date] = result;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}
