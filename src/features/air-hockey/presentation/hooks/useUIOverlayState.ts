/**
 * UI オーバーレイ状態管理 Hook
 *
 * モーダル/オーバーレイの表示状態を一元管理する。
 * AirHockeyGame.tsx から抽出（S8-1-1）。
 */
import { useState, useCallback } from 'react';
import { isTutorialCompleted } from '../../components/Tutorial';
import type { GamePhase } from '../../core/types';

export type UseUIOverlayStateReturn = {
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  showTutorial: boolean;
  setShowTutorial: (v: boolean) => void;
  isHelpMode: boolean;
  setIsHelpMode: (v: boolean) => void;
  handleTutorialComplete: () => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  selectedCharacterId: string | undefined;
  setSelectedCharacterId: (id: string | undefined) => void;
};

export const useUIOverlayState = (
  screen: string,
  phaseRef: React.MutableRefObject<GamePhase>,
): UseUIOverlayStateReturn => {
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(undefined);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    if (isHelpMode && screen === 'game' && phaseRef.current === 'paused') {
      phaseRef.current = 'playing';
    }
    setIsHelpMode(false);
  }, [isHelpMode, screen, phaseRef]);

  return {
    showHelp, setShowHelp,
    showTutorial, setShowTutorial,
    isHelpMode, setIsHelpMode,
    handleTutorialComplete,
    showSettings, setShowSettings,
    showExitConfirm, setShowExitConfirm,
    selectedCharacterId, setSelectedCharacterId,
  };
};
