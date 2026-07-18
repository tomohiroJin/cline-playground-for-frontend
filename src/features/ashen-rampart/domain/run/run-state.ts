/**
 * 灰燼の城壁 - ラン状態
 */
import type { DeckState } from '../cards/deck';
import type { BoardState } from '../board/board-state';
import type { CombatResult, WaveModifiers } from '../combat/simulate-wave';

export type RunPhase = 'preparation' | 'combat' | 'reward' | 'result';
export type RunStatus = 'playing' | 'won' | 'lost';

export interface RunState {
  phase: RunPhase;
  status: RunStatus;
  /** 砦のライフ（敵1体漏れで-1、0で敗北） */
  life: number;
  mana: number;
  manaMax: number;
  deck: DeckState;
  board: BoardState;
  /** 次に戦うウェーブの添字（0始まり） */
  waveIndex: number;
  /** スペルによる次ウェーブへの修飾（ウェーブ終了でリセット） */
  pendingModifiers: WaveModifiers;
  /** 報酬フェーズの選択肢（カードID×3） */
  rewardChoices: string[];
  score: number;
  /** 直近ウェーブの戦闘結果（combat フェーズでの再生用） */
  lastResult: CombatResult | null;
}

export const INITIAL_LIFE = 10;
export const INITIAL_MANA_MAX = 4;
/** ウェーブクリアボーナス */
export const WAVE_CLEAR_BONUS = 50;
/** 勝利時の残ライフ1あたりのボーナス */
export const LIFE_BONUS = 10;
