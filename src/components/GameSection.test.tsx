import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameSectionComponent } from './GameSection';
import { PuzzlePiece } from '../types/puzzle';

describe('GameSectionComponent の HUD 解説プレート', () => {
  const mockHandlePieceMove = jest.fn();
  const mockHandleResetGame = jest.fn();
  const mockToggleHintMode = jest.fn();
  const mockHandleEmptyPanelClick = jest.fn();
  const mockHandleEndGame = jest.fn();
  const mockCompletePuzzleForDebug = jest.fn();

  const mockPieces: PuzzlePiece[] = [
    {
      id: 1,
      correctPosition: { row: 0, col: 0 },
      currentPosition: { row: 0, col: 0 },
      isEmpty: false,
    },
  ];

  const renderGameSection = () =>
    render(
      <GameSectionComponent
        imageUrl="test-url"
        originalImageSize={{ width: 100, height: 100 }}
        pieces={mockPieces}
        division={3}
        elapsedTime={65}
        completed={false}
        hintModeEnabled={false}
        emptyPosition={{ row: 0, col: 0 }}
        moveCount={4}
        correctRate={0}
        score={null}
        isBestScore={false}
        handlePieceMove={mockHandlePieceMove}
        handleResetGame={mockHandleResetGame}
        toggleHintMode={mockToggleHintMode}
        handleEmptyPanelClick={mockHandleEmptyPanelClick}
        handleEndGame={mockHandleEndGame}
        emptyPanelClicks={0}
        onCompletePuzzleForDebug={mockCompletePuzzleForDebug}
      />
    );

  it('経過時間・手数が「時間」「手数」ラベルの解説プレートとして表示される', () => {
    renderGameSection();

    expect(screen.getByText('時間')).toBeInTheDocument();
    expect(screen.getByText('手数')).toBeInTheDocument();
  });

  it('盤面が ArtFrame（額装）でラップされている', () => {
    renderGameSection();

    expect(screen.getByTestId('art-frame')).toBeInTheDocument();
  });
});
