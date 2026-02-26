// ゲームオーバーレイ管理コンポーネント

import React from 'react';
import type { GameStatus, Difficulty } from '../types';
import {
  StartScreen,
  ClearScreen,
  GameOverScreen,
  EndingScreen,
} from './Overlays';
import { PauseOverlay } from './PauseOverlay';

interface GameOverlaysProps {
  status: GameStatus;
  stage: number;
  score: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onStart: () => void;
  onResume: () => void;
  onTitle: () => void;
  onNext: () => void;
  onRanking: () => void;
}

/** ステータスに応じたオーバーレイを描画する */
export const GameOverlays: React.FC<GameOverlaysProps> = ({
  status,
  stage,
  score,
  difficulty,
  onDifficultyChange,
  onStart,
  onResume,
  onTitle,
  onNext,
  onRanking,
}) => (
  <>
    {status === 'idle' && (
      <StartScreen
        onStart={onStart}
        difficulty={difficulty}
        onDifficultyChange={onDifficultyChange}
        onRanking={onRanking}
      />
    )}
    {status === 'paused' && <PauseOverlay onResume={onResume} onTitle={onTitle} />}
    {status === 'clear' && <ClearScreen stage={stage} onNext={onNext} />}
    {status === 'over' && (
      <GameOverScreen
        score={score}
        onRetry={onStart}
        onTitle={onTitle}
        onRanking={onRanking}
      />
    )}
    {status === 'ending' && (
      <EndingScreen
        score={score}
        onRetry={onStart}
        onTitle={onTitle}
        onRanking={onRanking}
      />
    )}
  </>
);
