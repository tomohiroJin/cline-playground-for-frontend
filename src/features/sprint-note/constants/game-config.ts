import { GameState } from '../types';

// 初期値定数
export const INITIAL_TEAM_TRUST = 50;
export const INITIAL_PRODUCT_PROGRESS = 0;
export const INITIAL_QUALITY_SCORE = 50;

// ゲーム設定定数
export const MAX_SPRINT = 3;
export const PARAM_MIN = 0;
export const PARAM_MAX = 100;

// 初期ゲーム状態を生成する
export const createInitialGameState = (): GameState => ({
  currentPhase: 'TITLE',
  selectedGoal: undefined,
  currentSprint: 1,
  teamTrust: INITIAL_TEAM_TRUST,
  productProgress: INITIAL_PRODUCT_PROGRESS,
  qualityScore: INITIAL_QUALITY_SCORE,
  sprints: [],
  activeImprovements: [],
});
