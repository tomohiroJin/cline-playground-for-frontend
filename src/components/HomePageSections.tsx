import React from 'react';
import {
  SetupSection,
  GameSection,
  ToggleButtonsContainer,
  ToggleButton,
  StartButton,
} from '../pages/HomePage.styles';
import ImageUploader from '../components/molecules/ImageUploader';
import DefaultImageSelector from '../components/molecules/DefaultImageSelector';
import DifficultySelector from '../components/molecules/DifficultySelector';
import PuzzleBoard from '../components/organisms/PuzzleBoard';
import { PuzzlePiece } from '../store/atoms';

export type SetupSectionProps = {
  imageSourceMode: 'upload' | 'default';
  setImageSourceMode: React.Dispatch<React.SetStateAction<'upload' | 'default'>>;
  handleImageUpload: (url: string, width: number, height: number) => void;
  handleDifficultyChange: (newDivision: number) => void;
  handleStartGame: () => void;
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  division: number;
};

export const SetupSectionComponent: React.FC<SetupSectionProps> = ({
  imageSourceMode,
  setImageSourceMode,
  handleImageUpload,
  handleDifficultyChange,
  handleStartGame,
  imageUrl,
  originalImageSize,
  division,
}) => (
  <SetupSection>
    <ToggleButtonsContainer>
      <ToggleButton
        $isActive={imageSourceMode === 'upload'}
        onClick={() => setImageSourceMode('upload')}
      >
        画像をアップロード
      </ToggleButton>
      <ToggleButton
        $isActive={imageSourceMode === 'default'}
        onClick={() => setImageSourceMode('default')}
      >
        デフォルト画像から選択
      </ToggleButton>
    </ToggleButtonsContainer>
    {imageSourceMode === 'upload' ? (
      <ImageUploader onImageUpload={handleImageUpload} maxSizeInMB={10} />
    ) : (
      <DefaultImageSelector onImageSelect={handleImageUpload} />
    )}
    <DifficultySelector value={division} onChange={handleDifficultyChange} disabled={!imageUrl} />
    <StartButton onClick={handleStartGame} disabled={!imageUrl || !originalImageSize}>
      パズルを開始
    </StartButton>
  </SetupSection>
);

// 型定義の改善
export type Position = {
  row: number;
  col: number;
};

// ロジックを関数化
const completePuzzle = (
  pieces: PuzzlePiece[],
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>,
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const correctPieces = pieces.map(piece => ({
    ...piece,
    currentPosition: { ...piece.correctPosition },
  }));
  setPieces(correctPieces);
  setCompleted(true);
};

export type GameSectionProps = {
  imageUrl: string | null;
  originalImageSize: { width: number; height: number } | null;
  pieces: PuzzlePiece[];
  division: number;
  elapsedTime: number;
  completed: boolean;
  hintModeEnabled: boolean;
  emptyPosition: Position;
  handlePieceMove: (pieceId: number, row: number, col: number) => void;
  handleResetGame: () => void;
  toggleHintMode: () => void;
  handleEmptyPanelClick: () => void;
  handleEndGame: () => void;
  emptyPanelClicks: number;
  setPieces: React.Dispatch<React.SetStateAction<PuzzlePiece[]>>;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
};

export const GameSectionComponent: React.FC<GameSectionProps> = ({
  imageUrl,
  originalImageSize,
  pieces,
  division,
  elapsedTime,
  completed,
  hintModeEnabled,
  emptyPosition,
  handlePieceMove,
  handleResetGame,
  toggleHintMode,
  handleEmptyPanelClick,
  handleEndGame,
  emptyPanelClicks,
  setPieces,
  setCompleted,
}) => (
  <GameSection>
    {imageUrl && originalImageSize && (
      <>
        <PuzzleBoard
          imageUrl={imageUrl}
          originalWidth={originalImageSize.width}
          originalHeight={originalImageSize.height}
          pieces={pieces}
          division={division}
          elapsedTime={elapsedTime}
          completed={completed}
          hintMode={hintModeEnabled}
          emptyPosition={emptyPosition}
          onPieceMove={handlePieceMove}
          onReset={handleResetGame}
          onToggleHint={toggleHintMode}
          onEmptyPanelClick={handleEmptyPanelClick}
        />
        {completed ? (
          <div>パズルが完成しました！</div>
        ) : (
          <>
            <StartButton onClick={handleEndGame}>ゲームを終了して設定に戻る</StartButton>
            {completed}
            {emptyPanelClicks >= 10 && (
              <StartButton
                onClick={() => completePuzzle(pieces, setPieces, setCompleted)}
                style={{ marginTop: '10px', backgroundColor: '#ff9800' }}
              >
                テスト：パズルを完成させる
              </StartButton>
            )}
          </>
        )}
      </>
    )}
  </GameSection>
);
