/**
 * タイマー表示コンポーネント
 * 残り時間バーとカウントダウン数値を表示
 * WCAG 2.1 AA: role="timer" + aria-live で残り時間を AT に伝える
 */
import React from 'react';
import { CONFIG, COLORS } from '../../../../constants';
import {
  TimerContainer,
  TimerValue,
  TimerBar,
  TimerProgress,
} from '../../../styles';
import { SR_ONLY_STYLE } from '../../../styles/sr-only';

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
 * 閾値（10秒・5秒・0秒）のときのみ読み上げテキストを生成する。
 * 毎秒アナウンスすると AT ユーザーに過負荷をかけるため、重要な節目のみ通知。
 */
function getLiveText(timer: number): string {
  if (timer === 10 || timer === 5 || timer === 0) {
    return `残り ${timer} 秒`;
  }
  return '';
}

/**
 * タイマー表示（回答前のみ表示）
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timer, answered }) => {
  if (answered) return null;

  const timerColor = getTimerColor(timer);
  const liveText = getLiveText(timer);

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

      {/* スクリーンリーダー向け閾値通知（過度な読み上げを避けるため節目のみ） */}
      <div aria-live="polite" style={SR_ONLY_STYLE}>
        {liveText}
      </div>

      <TimerContainer>
        <TimerValue
          role="timer"
          aria-live="off"
          aria-atomic="true"
          aria-label={`残り ${timer} 秒`}
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
