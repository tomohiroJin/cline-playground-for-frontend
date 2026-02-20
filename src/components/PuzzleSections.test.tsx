import React from 'react';
import { render, screen } from '@testing-library/react';
import { SetupSectionComponent, GameSectionComponent } from './PuzzleSections';
import { PuzzlePiece } from '../store/atoms';

describe('SetupSectionComponent', () => {
  const mockHandleImageSelect = jest.fn();
  const mockHandleDifficultyChange = jest.fn();
  const mockHandleStartGame = jest.fn();

  it('テーマ画像選択が表示される', () => {
    render(
      <SetupSectionComponent
        handleImageSelect={mockHandleImageSelect}
        handleDifficultyChange={mockHandleDifficultyChange}
        handleStartGame={mockHandleStartGame}
        imageUrl={null}
        originalImageSize={null}
        division={3}
        records={[]}
        totalClears={0}
      />
    );

    // テーマセレクタが表示されていること
    expect(screen.getByText('パズルを開始')).toBeInTheDocument();
    expect(screen.getByText('テーマから画像を選択')).toBeInTheDocument();
  });

  it('画像が選択されていない場合、開始ボタンが無効になる', () => {
    render(
      <SetupSectionComponent
        handleImageSelect={mockHandleImageSelect}
        handleDifficultyChange={mockHandleDifficultyChange}
        handleStartGame={mockHandleStartGame}
        imageUrl={null}
        originalImageSize={null}
        division={3}
        records={[]}
        totalClears={0}
      />
    );

    const startButton = screen.getByText('パズルを開始');
    expect(startButton).toBeDisabled();
  });
});

describe('GameSectionComponent', () => {
  const mockHandlePieceMove = jest.fn();
  const mockHandleResetGame = jest.fn();
  const mockToggleHintMode = jest.fn();
  const mockHandleEmptyPanelClick = jest.fn();
  const mockHandleEndGame = jest.fn();
  const mockSetPieces = jest.fn();
  const mockSetCompleted = jest.fn();

  const mockPieces: PuzzlePiece[] = [
    {
      id: 1,
      correctPosition: { row: 0, col: 0 },
      currentPosition: { row: 0, col: 0 },
      isEmpty: false,
    },
  ];

  it('画像とサイズが指定されている場合、パズルボードが表示される', () => {
    render(
      <GameSectionComponent
        imageUrl="test-url"
        originalImageSize={{ width: 100, height: 100 }}
        pieces={mockPieces}
        division={3}
        elapsedTime={0}
        completed={false}
        hintModeEnabled={false}
        emptyPosition={{ row: 0, col: 0 }}
        moveCount={0}
        correctRate={0}
        score={null}
        isBestScore={false}
        handlePieceMove={mockHandlePieceMove}
        handleResetGame={mockHandleResetGame}
        toggleHintMode={mockToggleHintMode}
        handleEmptyPanelClick={mockHandleEmptyPanelClick}
        handleEndGame={mockHandleEndGame}
        emptyPanelClicks={0}
        setPieces={mockSetPieces}
        setCompleted={mockSetCompleted}
      />
    );

    expect(screen.getByText('ゲームを終了して設定に戻る')).toBeInTheDocument();
  });

  it('パズルが完成した場合、完了メッセージが表示される', () => {
    render(
      <GameSectionComponent
        imageUrl="test-url"
        originalImageSize={{ width: 100, height: 100 }}
        pieces={mockPieces}
        division={3}
        elapsedTime={0}
        completed={true}
        hintModeEnabled={false}
        emptyPosition={{ row: 0, col: 0 }}
        moveCount={0}
        correctRate={0}
        score={null}
        isBestScore={false}
        handlePieceMove={mockHandlePieceMove}
        handleResetGame={mockHandleResetGame}
        toggleHintMode={mockToggleHintMode}
        handleEmptyPanelClick={mockHandleEmptyPanelClick}
        handleEndGame={mockHandleEndGame}
        emptyPanelClicks={0}
        setPieces={mockSetPieces}
        setCompleted={mockSetCompleted}
      />
    );

    expect(screen.getByText('パズルが完成しました！')).toBeInTheDocument();
  });
});
