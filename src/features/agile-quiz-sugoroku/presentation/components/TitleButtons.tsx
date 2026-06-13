/**
 * タイトル画面のボタンエリアコンポーネント
 */
import React from 'react';
import { COLORS } from '../../constants';
import { DESIGN_TOKENS } from '../styles/design-tokens';
import type { SaveState } from '../../domain/types';
import { Button, HotkeyHint } from '../styles';

/** ナビゲーション系コールバックをまとめたオブジェクト */
export interface TitleNavigation {
  onResume?: () => void;
  onStudy?: () => void;
  onGuide?: () => void;
  onAchievements?: () => void;
  onHistory?: () => void;
  onChallenge?: () => void;
  onDailyQuiz?: () => void;
  onReview?: () => void;
}

interface TitleButtonsProps {
  saveState: SaveState | undefined;
  onNewGame: () => void;
  formatSaveDate: (timestamp: number) => string;
  navigation: TitleNavigation;
}

export const TitleButtons: React.FC<TitleButtonsProps> = ({
  saveState, onNewGame, formatSaveDate, navigation,
}) => {
  const { onResume, onStudy, onGuide, onAchievements, onHistory, onChallenge, onDailyQuiz, onReview } = navigation;
  return (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: DESIGN_TOKENS.spacing.xs }}>
    {saveState && onResume && (
      <Button
        $color={COLORS.yellow}
        onClick={onResume}
        style={{ padding: '12px 44px', fontSize: 13 }}
      >
        ▶ 続きから（スプリント {saveState.currentSprint + 1}/{saveState.sprintCount} - {formatSaveDate(saveState.timestamp)}）
      </Button>
    )}

    <Button
      $color={COLORS.green}
      onClick={onNewGame}
      style={{ padding: '14px 52px', fontSize: 14 }}
    >
      ▶ Sprint Start
      <HotkeyHint>[Enter]</HotkeyHint>
    </Button>
    <div style={{ display: 'flex', gap: DESIGN_TOKENS.spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
      {onChallenge && (
        <Button $color={COLORS.red} onClick={onChallenge} style={{ padding: '10px 32px', fontSize: 12 }}>
          Challenge
        </Button>
      )}
      {onDailyQuiz && (
        <Button $color={COLORS.green} onClick={onDailyQuiz} style={{ padding: '10px 32px', fontSize: 12 }}>
          Daily Quiz
        </Button>
      )}
    </div>
    <div style={{ display: 'flex', gap: DESIGN_TOKENS.spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
      {onStudy && (
        <Button $color={COLORS.accent} onClick={onStudy} style={{ padding: '10px 20px', fontSize: 12 }}>
          勉強会モード
        </Button>
      )}
      {onReview && (
        <Button $color={COLORS.accent} onClick={onReview} style={{ padding: '10px 20px', fontSize: 12 }}>
          復習
        </Button>
      )}
      {onAchievements && (
        <Button $color={COLORS.yellow} onClick={onAchievements} style={{ padding: '10px 20px', fontSize: 12 }}>
          実績
        </Button>
      )}
      {onHistory && (
        <Button $color={COLORS.cyan} onClick={onHistory} style={{ padding: '10px 20px', fontSize: 12 }}>
          履歴
        </Button>
      )}
      {onGuide && (
        <Button $color={COLORS.muted} onClick={onGuide} style={{ padding: '10px 20px', fontSize: 12 }}>
          遊び方
        </Button>
      )}
    </div>
  </div>
  );
};
