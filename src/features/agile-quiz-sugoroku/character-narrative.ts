/**
 * Agile Quiz Sugoroku - キャラクターナラティブ
 *
 * スプリント開始/振り返り画面でキャラクターが状況に応じた会話を表示するためのデータと関数
 */
import { CharacterComment } from './character-reactions';

// ── 型定義 ────────────────────────────────────────────────

/** ナラティブの状況 */
export type NarrativeSituation =
  | 'sprintStart1'
  | 'sprintStartGood'
  | 'sprintStartBad'
  | 'retroGood'
  | 'retroBad';

/** ナラティブコメント取得時のコンテキスト */
export interface NarrativeContext {
  /** スプリント番号（1始まり） */
  sprintNumber: number;
  /** フェーズ */
  phase: 'sprintStart' | 'retro';
  /** 現在の正答率 */
  correctRate?: number;
  /** 現在の負債 */
  debt?: number;
}

// ── ナラティブコメントデータ ─────────────────────────────

/** 正答率の良好基準 */
const GOOD_RATE_THRESHOLD = 70;
/** 負債の警告基準 */
const HIGH_DEBT_THRESHOLD = 15;

/** 状況別 × キャラ別のナラティブコメント */
export const NARRATIVE_COMMENTS: Record<NarrativeSituation, CharacterComment[]> = {
  // Sprint 1 開始
  sprintStart1: [
    { characterId: 'neko', text: 'さあ、スプリント開始にゃ！' },
    { characterId: 'neko', text: '今日もがんばるにゃ！' },
    { characterId: 'neko', text: 'コード書くにゃ！' },
    { characterId: 'inu', text: 'チーム一丸でいくワン！' },
    { characterId: 'inu', text: 'スクラム開始ワン！' },
    { characterId: 'inu', text: 'みんなで頑張るワン！' },
    { characterId: 'usagi', text: 'テスト準備OKぴょん！' },
    { characterId: 'usagi', text: '品質を守るぴょん！' },
    { characterId: 'usagi', text: '一緒にがんばるぴょん！' },
  ],

  // Sprint 2以降、成績良好
  sprintStartGood: [
    { characterId: 'neko', text: 'この調子にゃ！' },
    { characterId: 'neko', text: '順調にゃ〜！' },
    { characterId: 'neko', text: 'いい感じにゃ！' },
    { characterId: 'inu', text: 'チーム好調ワン！' },
    { characterId: 'inu', text: 'ベロシティ安定ワン！' },
    { characterId: 'inu', text: '勢いがあるワン！' },
    { characterId: 'usagi', text: '品質バッチリぴょん！' },
    { characterId: 'usagi', text: 'いいペースぴょん！' },
    { characterId: 'usagi', text: 'このまま行くぴょん！' },
  ],

  // Sprint 2以降、成績不良（負債多い）
  sprintStartBad: [
    { characterId: 'neko', text: '負債が気になるにゃ...' },
    { characterId: 'neko', text: 'リファクタしたいにゃ' },
    { characterId: 'neko', text: '技術的負債...にゃ' },
    { characterId: 'inu', text: '立て直すワン！' },
    { characterId: 'inu', text: 'ここからワン！' },
    { characterId: 'inu', text: '改善していくワン！' },
    { characterId: 'usagi', text: 'テストで守るぴょん' },
    { characterId: 'usagi', text: '慎重に行くぴょん' },
    { characterId: 'usagi', text: '品質から見直すぴょん' },
  ],

  // 振り返り、高正答率
  retroGood: [
    { characterId: 'neko', text: '素晴らしいにゃ！' },
    { characterId: 'neko', text: 'さすがにゃ！' },
    { characterId: 'neko', text: 'ナイスコーディングにゃ！' },
    { characterId: 'inu', text: 'チーム最高ワン！' },
    { characterId: 'inu', text: 'いいスプリントワン！' },
    { characterId: 'inu', text: '成果が出てるワン！' },
    { characterId: 'usagi', text: '完璧ぴょん！' },
    { characterId: 'usagi', text: '高品質ぴょん！' },
    { characterId: 'usagi', text: '最高のスプリントぴょん！' },
  ],

  // 振り返り、低正答率
  retroBad: [
    { characterId: 'neko', text: '次で取り返すにゃ' },
    { characterId: 'neko', text: '振り返って改善にゃ' },
    { characterId: 'neko', text: '学びがあったにゃ' },
    { characterId: 'inu', text: '次で挽回ワン！' },
    { characterId: 'inu', text: 'ふりかえりが大事ワン' },
    { characterId: 'inu', text: '改善点を見つけるワン' },
    { characterId: 'usagi', text: '次こそぴょん！' },
    { characterId: 'usagi', text: 'ドンマイぴょん' },
    { characterId: 'usagi', text: '成長のチャンスぴょん' },
  ],
};

// ── ユーティリティ関数 ────────────────────────────────────

/**
 * コンテキストに応じたナラティブの状況を判定する
 */
const determineSituation = (context: NarrativeContext): NarrativeSituation => {
  const { sprintNumber, phase, correctRate = 0, debt = 0 } = context;

  if (phase === 'sprintStart') {
    if (sprintNumber <= 1) {
      return 'sprintStart1';
    }
    // 負債が多い or 正答率が低い → bad
    if (debt > HIGH_DEBT_THRESHOLD || correctRate < GOOD_RATE_THRESHOLD) {
      return 'sprintStartBad';
    }
    return 'sprintStartGood';
  }

  // 振り返り
  if (correctRate >= GOOD_RATE_THRESHOLD) {
    return 'retroGood';
  }
  return 'retroBad';
};

/**
 * コンテキストに応じたナラティブコメントをランダムに返す
 */
export const getNarrativeComment = (context: NarrativeContext): CharacterComment => {
  const situation = determineSituation(context);
  const pool = NARRATIVE_COMMENTS[situation];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};
