/**
 * リザルト画面コンポーネント
 *
 * ゲームオーバー + クリア共通のリザルト表示。
 * ScreenOverlay の OVER/CLEAR 状態部分を独立コンポーネントとして抽出する。
 */
import React from 'react';
import { ScreenOverlay } from '../../renderers';
import type { ClearAnim, GameStateValue } from '../../types';

interface ResultScreenProps {
  readonly type: GameStateValue;
  readonly score: number;
  readonly hiScore: number;
  readonly reachedRamp: number;
  readonly totalRamps: number;
  readonly isNewHighScore: boolean;
  readonly clearAnim: ClearAnim;
  readonly isMobile: boolean;
}

/** リザルト画面（ゲームオーバー・クリア共通） */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  type,
  score,
  hiScore,
  reachedRamp,
  totalRamps,
  isNewHighScore,
  clearAnim,
  isMobile,
}) => (
  <ScreenOverlay
    type={type}
    score={score}
    hiScore={hiScore}
    reachedRamp={reachedRamp}
    totalRamps={totalRamps}
    isNewHighScore={isNewHighScore}
    clearAnim={clearAnim}
    isMobile={isMobile}
  />
);
