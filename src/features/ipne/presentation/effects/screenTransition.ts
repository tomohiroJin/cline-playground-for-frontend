/**
 * 画面遷移演出
 *
 * ステージ開始・ゲームオーバー・ステージクリアの遷移演出を提供する。
 */

/** ステージ開始演出の持続時間（ms） */
export const STAGE_INTRO_DURATION = 1500;

/** ステージ開始演出のフェードイン期間（ms） */
const STAGE_INTRO_FADEIN_DURATION = 500;

/** ゲームオーバー遷移の暗転持続時間（ms） */
export const GAME_OVER_TRANSITION_DURATION = 500;

/** ゲームオーバー暗転の最大不透明度 */
const GAME_OVER_MAX_ALPHA = 0.7;

/** ステージ開始演出のフェーズ */
export type StageIntroPhase = 'fadein' | 'text' | 'done';

/**
 * 経過時間からステージ開始演出のフェーズを返す
 */
export function getStageIntroPhase(elapsed: number): StageIntroPhase {
  if (elapsed >= STAGE_INTRO_DURATION) return 'done';
  if (elapsed < STAGE_INTRO_FADEIN_DURATION) return 'fadein';
  return 'text';
}

/**
 * ステージ開始演出の暗転 alpha を返す
 * フェードイン中は 1.0→0.0、それ以降は 0.0
 */
export function getStageIntroAlpha(elapsed: number): number {
  if (elapsed >= STAGE_INTRO_FADEIN_DURATION) return 0.0;
  return 1.0 - elapsed / STAGE_INTRO_FADEIN_DURATION;
}

/**
 * ゲームオーバー遷移の暗転 alpha を返す
 * 0.0→0.7 に線形変化
 */
export function getGameOverTransitionAlpha(elapsed: number): number {
  const clamped = Math.min(elapsed, GAME_OVER_TRANSITION_DURATION);
  return (clamped / GAME_OVER_TRANSITION_DURATION) * GAME_OVER_MAX_ALPHA;
}

/**
 * ステージ開始演出テキストの alpha を返す
 * テキスト表示期間のフェードイン→維持→フェードアウト
 */
export function getStageIntroTextAlpha(elapsed: number): number {
  const textStart = 200;
  const textEnd = STAGE_INTRO_DURATION;
  if (elapsed < textStart || elapsed >= textEnd) return 0.0;

  const textElapsed = elapsed - textStart;
  const textDuration = textEnd - textStart;
  const fadeIn = 200;
  const fadeOut = 300;

  if (textElapsed < fadeIn) return textElapsed / fadeIn;
  if (textElapsed > textDuration - fadeOut) {
    return (textDuration - textElapsed) / fadeOut;
  }
  return 1.0;
}
