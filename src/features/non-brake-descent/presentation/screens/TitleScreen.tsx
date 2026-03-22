/**
 * タイトル画面コンポーネント
 *
 * ScreenOverlay の TITLE 状態部分を独立コンポーネントとして抽出する。
 */
import React from 'react';
import { ScreenOverlay } from '../../renderers';
import { GameState } from '../../constants';
import type { ClearAnim } from '../../types';

interface TitleScreenProps {
  readonly hiScore: number;
  readonly isMobile: boolean;
}

/** タイトル画面 */
export const TitleScreen: React.FC<TitleScreenProps> = ({
  hiScore,
  isMobile,
}) => (
  <ScreenOverlay
    type={GameState.TITLE}
    score={0}
    hiScore={hiScore}
    reachedRamp={1}
    totalRamps={1}
    isNewHighScore={false}
    clearAnim={{ phase: 0, frame: 0 } as ClearAnim}
    isMobile={isMobile}
  />
);
