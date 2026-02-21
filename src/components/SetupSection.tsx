import React from 'react';
import {
  SetupSection,
  StartButton,
} from '../pages/PuzzlePage.styles';
import ThemeSelector from '../components/molecules/ThemeSelector';
import DifficultySelector from '../components/molecules/DifficultySelector';
import { themes } from '../data/themes';
import { PuzzleRecord } from '../types/puzzle';

/**
 * SetupSectionコンポーネントのプロパティの型定義
 */
export type SetupSectionProps = {
  handleImageSelect: (url: string, width: number, height: number) => void;
  handleDifficultyChange: (newDivision: number) => void;
  handleStartGame: () => void;
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  division: number;
  records: PuzzleRecord[];
  totalClears: number;
};

/**
 * SetupSectionコンポーネント
 */
export const SetupSectionComponent: React.FC<SetupSectionProps> = ({
  handleImageSelect,
  handleDifficultyChange,
  handleStartGame,
  imageUrl,
  originalImageSize,
  division,
  records,
  totalClears,
}) => (
  <SetupSection>
    <ThemeSelector
      themes={themes}
      records={records}
      totalClears={totalClears}
      onImageSelect={handleImageSelect}
    />
    <DifficultySelector value={division} onChange={handleDifficultyChange} disabled={!imageUrl} />
    <StartButton onClick={handleStartGame} disabled={!imageUrl || !originalImageSize}>
      パズルを開始
    </StartButton>
  </SetupSection>
);
