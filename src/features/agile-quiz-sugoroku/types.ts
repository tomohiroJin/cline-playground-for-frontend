/**
 * Agile Quiz Sugoroku - 型定義
 */

/** ゲームのフェーズ */
export type GamePhase = 'title' | 'sprint-start' | 'game' | 'retro' | 'result';

/** イベント情報 */
export interface GameEvent {
  id: string;
  nm: string;
  ic: string;
  ds: string;
  color: string;
}

/** クイズ問題 */
export interface Question {
  q: string;
  o: string[];
  a: number;
  tags?: string[];
}

/** カテゴリ別の問題データ */
export type QuestionsByCategory = {
  [key: string]: Question[];
};

/** 回答結果 */
export interface AnswerResult {
  c: boolean; // correct
  s: number;  // speed (秒)
  e: string;  // event id
}

/** スプリント集計 */
export interface SprintSummary {
  sp: number;
  pct: number;
  cor: number;
  tot: number;
  spd: number;
  debt: number;
  em: boolean;
  emOk: number;
  cats: CategoryStats;
}

/** カテゴリ別統計 */
export interface CategoryStats {
  [key: string]: {
    c: number;
    t: number;
  };
}

/** ゲーム状態 */
export interface GameStats {
  tc: number;      // total correct
  tq: number;      // total questions
  sp: number[];    // speeds
  debt: number;    // 技術的負債
  emC: number;     // emergency count
  emS: number;     // emergency success
  combo: number;   // current combo
  maxCombo: number;
}

/** 派生データ */
export interface DerivedStats {
  tp: number;     // 正答率
  spd: number;    // 平均速度
  stab: number;   // 安定度
  sc: number[];   // スプリントごとの正答率
}

/** エンジニアタイプ */
export interface EngineerType {
  id: string;
  n: string;
  em: string;
  co: string;
  d: string;
  c: (stats: ClassifyStats) => boolean;
}

/** タイプ分類用統計 */
export interface ClassifyStats {
  stab: number;
  debt: number;
  emSuc: number;
  sc: number[];
  tp: number;
  spd: number;
}

/** グレード情報 */
export interface Grade {
  min: number;
  g: string;
  c: string;
  label: string;
}

/** レーダーチャートデータ */
export interface RadarDataPoint {
  label: string;
  value: number;
}

/** 解説データ */
export type ExplanationMap = {
  [eventId: string]: {
    [questionIndex: number]: string;
  };
};
