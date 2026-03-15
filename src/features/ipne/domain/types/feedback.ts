/**
 * フィードバック・チュートリアル・タイマー関連の型定義
 */

/** フィードバックの種類 */
export const FeedbackType = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  LEVEL_UP: 'level_up',
  TRAP: 'trap',
  ITEM_PICKUP: 'item_pickup',
  BOSS_KILL: 'boss_kill',
  SPEED_BOOST: 'speed_boost',
} as const;

export type FeedbackTypeValue = (typeof FeedbackType)[keyof typeof FeedbackType];

/** フィードバックエフェクト */
export interface FeedbackEffect {
  id: string;
  type: FeedbackTypeValue;
  x: number;
  y: number;
  text?: string;
  color: string;
  startTime: number;
  duration: number;
}

/** チュートリアルステップの種類 */
export const TutorialStepType = {
  MOVEMENT: 'movement',
  ATTACK: 'attack',
  MAP: 'map',
  ITEM: 'item',
  TRAP: 'trap',
  GOAL: 'goal',
} as const;

export type TutorialStepTypeValue = (typeof TutorialStepType)[keyof typeof TutorialStepType];

/** チュートリアルステップ */
export interface TutorialStep {
  id: TutorialStepTypeValue;
  title: string;
  text: string;
  condition?: string;
}

/** チュートリアル状態 */
export interface TutorialState {
  isCompleted: boolean;
  currentStep: number;
  isVisible: boolean;
}

/** タイマー状態 */
export const TimerState = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
} as const;

export type TimerStateValue = (typeof TimerState)[keyof typeof TimerState];

/** ゲームタイマー */
export interface GameTimer {
  state: TimerStateValue;
  startTime: number;
  pausedTime: number;
  totalPausedDuration: number;
}
