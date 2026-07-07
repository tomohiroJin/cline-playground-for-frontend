import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameSectionComponent } from './GameSection';
import { PuzzlePiece } from '../types/puzzle';

describe('GameSectionComponent の盤面額装', () => {
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

  it('盤面（PuzzleBoard）が ArtFrame（額装）でラップされている', () => {
    renderGameSection();

    // 額縁の存在を検証（ArtFrame が data-testid="art-frame" を出力）
    const frame = screen.getByTestId('art-frame');
    expect(frame).toBeInTheDocument();
    // 額縁が盤面（ボードグリッド）を内包していること
    expect(frame).toContainElement(screen.getByTitle('ボードグリッド'));
  });
});
