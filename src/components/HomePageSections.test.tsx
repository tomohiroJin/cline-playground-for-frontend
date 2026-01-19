import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetupSectionComponent, GameSectionComponent } from './HomePageSections';
import { PuzzlePiece } from '../store/atoms';
import { toPieceId, toCoordinate } from '../domain/types';

describe('SetupSectionComponent', () => {
  const mockSetImageSourceMode = jest.fn();
  const mockHandleImageUpload = jest.fn();
  const mockHandleDifficultyChange = jest.fn();
  const mockHandleStartGame = jest.fn();

  it('画像ソースモードの切り替えボタンが正しく動作する', () => {
    render(
      <SetupSectionComponent
        imageSourceMode="upload"
        setImageSourceMode={mockSetImageSourceMode}
        handleImageUpload={mockHandleImageUpload}
        handleDifficultyChange={mockHandleDifficultyChange}
        handleStartGame={mockHandleStartGame}
        imageUrl={null}
        originalImageSize={null}
        division={3}
      />
    );

    const uploadButton = screen.getByText('画像をアップロード');
    const defaultButton = screen.getByText('デフォルト画像から選択');

    fireEvent.click(defaultButton);
    expect(mockSetImageSourceMode).toHaveBeenCalledWith('default');

    fireEvent.click(uploadButton);
    expect(mockSetImageSourceMode).toHaveBeenCalledWith('upload');
  });

  it('画像が選択されていない場合、開始ボタンが無効になる', () => {
    render(
      <SetupSectionComponent
        imageSourceMode="upload"
        setImageSourceMode={mockSetImageSourceMode}
        handleImageUpload={mockHandleImageUpload}
        handleDifficultyChange={mockHandleDifficultyChange}
        handleStartGame={mockHandleStartGame}
        imageUrl={null}
        originalImageSize={null}
        division={3}
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
  const mockOnSolve = jest.fn();

  const mockPieces: PuzzlePiece[] = [
    {
      id: toPieceId(1),
      correctPosition: { row: toCoordinate(0), col: toCoordinate(0) },
      currentPosition: { row: toCoordinate(0), col: toCoordinate(0) },
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
        emptyPosition={{ row: toCoordinate(0), col: toCoordinate(0) }}
        handlePieceMove={mockHandlePieceMove}
        handleResetGame={mockHandleResetGame}
        toggleHintMode={mockToggleHintMode}
        handleEmptyPanelClick={mockHandleEmptyPanelClick}
        handleEndGame={mockHandleEndGame}
        emptyPanelClicks={0}
        onSolve={mockOnSolve}
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
        emptyPosition={{ row: toCoordinate(0), col: toCoordinate(0) }}
        handlePieceMove={mockHandlePieceMove}
        handleResetGame={mockHandleResetGame}
        toggleHintMode={mockToggleHintMode}
        handleEmptyPanelClick={mockHandleEmptyPanelClick}
        handleEndGame={mockHandleEndGame}
        emptyPanelClicks={0}
        onSolve={mockOnSolve}
      />
    );

    expect(screen.getByText('パズルが完成しました！')).toBeInTheDocument();
  });
});
