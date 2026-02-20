/** ランク */
export type PuzzleRank = '★★★' | '★★☆' | '★☆☆' | 'クリア';

/** スコア計算結果 */
export interface PuzzleScore {
  totalScore: number;
  moveCount: number;
  elapsedTime: number;
  hintUsed: boolean;
  division: number;
  rank: PuzzleRank;
  shuffleMoves: number;
}

/** 難易度別乗数 */
export const DIVISION_MULTIPLIERS: Record<number, number> = {
  2: 0.3,
  3: 0.5,
  4: 1.0,
  5: 1.5,
  6: 2.0,
  8: 3.5,
  10: 5.0,
  16: 10.0,
  32: 20.0,
};

/** ランク閾値 */
export const RANK_THRESHOLDS = {
  THREE_STAR: 8000,
  TWO_STAR: 5000,
  ONE_STAR: 2000,
};

/** MIDI ノートシーケンス（number = MIDI ノート番号, null = 休符） */
export type NoteSequence = (number | null)[];

/** BGM トラック定義 */
export interface BgmTrack {
  id: string;
  name: string;
  bpm: number;
  bars: number;
  melody: NoteSequence;
  bass: NoteSequence;
  melodyWaveform: OscillatorType;
  bassWaveform: OscillatorType;
  melodyGain: number;
  bassGain: number;
}

/** ベストスコア記録（画像×難易度ごと） */
export interface PuzzleRecord {
  imageId: string;
  division: number;
  bestScore: number;
  bestRank: PuzzleRank;
  bestTime: number;
  bestMoves: number;
  clearCount: number;
  lastClearDate: string;
}
