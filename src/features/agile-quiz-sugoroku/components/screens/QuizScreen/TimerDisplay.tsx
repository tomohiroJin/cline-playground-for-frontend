/**
 * タイマー表示コンポーネント
 * 残り時間バーとカウントダウン数値を表示
 */
import React from 'react';
import { CONFIG, COLORS } from '../../../constants';
import {
  TimerContainer,
  TimerValue,
  TimerBar,
  TimerProgress,
} from '../../styles';

interface TimerDisplayProps {
  /** 残り時間（秒） */
  timer: number;
  /** 回答済みかどうか */
  answered: boolean;
}

/** タイマーの色を段階的に計算 */
function getTimerColor(timer: number): string {
  if (timer <= 2) return COLORS.red;
  if (timer <= 4) return COLORS.red2;
  if (timer <= 7) return COLORS.yellow;
  return COLORS.accent;
}

/**
 * タイマー表示（回答前のみ表示）
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timer, answered }) => {
  if (answered) return null;

  const timerColor = getTimerColor(timer);

  return (
    <>
      {/* タイマー緊迫オーバーレイ */}
      {timer <= 2 && timer > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: COLORS.red,
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 50,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      <TimerContainer>
        <TimerValue
          $color={timerColor}
          $pulse={timer <= 5 && timer > 0}
          $shake={timer <= 3 && timer > 0}
        >
          {timer}
        </TimerValue>
        <TimerBar>
          <TimerProgress $ratio={timer / CONFIG.timeLimit} $color={timerColor} />
        </TimerBar>
      </TimerContainer>
    </>
  );
};
