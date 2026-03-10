/**
 * Phase 3: ステージ選択画面のテスト
 * US-2.3（ステージ選択画面）に対応
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageSelectScreen } from './StageSelectScreen';
import { CHAPTER_1_STAGES } from '../core/dialogue-data';
import type { StoryProgress } from '../core/story';
import { STORY_CHARACTERS, PLAYER_CHARACTER } from '../core/characters';

// キャラクター検索用ヘルパー
const _findChar = (id: string) => {
  if (id === 'player') return PLAYER_CHARACTER;
  return Object.values(STORY_CHARACTERS).find(c => c.id === id);
};

describe('StageSelectScreen', () => {
  const defaultProps = {
    stages: CHAPTER_1_STAGES,
    progress: { clearedStages: [] } as StoryProgress,
    onSelectStage: jest.fn(),
    onBack: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('章タイトルがヘッダーに表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      expect(screen.getByText(/第1章/)).toBeInTheDocument();
    });

    it('3ステージがカード形式で表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      expect(screen.getByText(/はじめの一打/)).toBeInTheDocument();
      expect(screen.getByText(/テクニカルな壁/)).toBeInTheDocument();
      expect(screen.getByText(/部長の壁/)).toBeInTheDocument();
    });

    it('各カードに対戦相手名が表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      expect(screen.getByText(/ヒロ/)).toBeInTheDocument();
      expect(screen.getByText(/ミサキ/)).toBeInTheDocument();
      expect(screen.getByText(/タクマ/)).toBeInTheDocument();
    });

    it('各カードに難易度が★表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      // easy = ★, normal = ★★, hard = ★★★
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('★★')).toBeInTheDocument();
      expect(screen.getByText('★★★')).toBeInTheDocument();
    });

    it('戻るボタンが表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });

    it('リセットボタンが表示される', () => {
      render(<StageSelectScreen {...defaultProps} />);
      expect(screen.getByText('リセット')).toBeInTheDocument();
    });
  });

  describe('解放状態', () => {
    it('初期状態ではステージ1-1のみ解放されている', () => {
      render(<StageSelectScreen {...defaultProps} />);
      // 1-1 は選択可能
      const stage1Card = screen.getByTestId('stage-card-1-1');
      expect(stage1Card).toBeInTheDocument();
      // 1-2, 1-3 はロック表示
      expect(screen.getAllByText('🔒').length).toBe(2);
    });

    it('ステージ1-1クリア後、1-2が解放される', () => {
      const progress: StoryProgress = { clearedStages: ['1-1'] };
      render(<StageSelectScreen {...defaultProps} progress={progress} />);
      // 1-1 はクリア済み
      expect(screen.getByText('✅')).toBeInTheDocument();
      // 1-2 は解放済み（ロックなし）、1-3 はまだロック
      expect(screen.getAllByText('🔒').length).toBe(1);
    });

    it('全ステージクリア時、すべてにチェックマークが付く', () => {
      const progress: StoryProgress = { clearedStages: ['1-1', '1-2', '1-3'] };
      render(<StageSelectScreen {...defaultProps} progress={progress} />);
      expect(screen.getAllByText('✅').length).toBe(3);
      expect(screen.queryByText('🔒')).not.toBeInTheDocument();
    });
  });

  describe('操作', () => {
    it('解放済みステージをクリックするとonSelectStageが呼ばれる', () => {
      render(<StageSelectScreen {...defaultProps} />);
      const stage1Card = screen.getByTestId('stage-card-1-1');
      fireEvent.click(stage1Card);
      expect(defaultProps.onSelectStage).toHaveBeenCalledWith(CHAPTER_1_STAGES[0]);
    });

    it('ロックされたステージをクリックしてもonSelectStageは呼ばれない', () => {
      render(<StageSelectScreen {...defaultProps} />);
      const stage2Card = screen.getByTestId('stage-card-1-2');
      fireEvent.click(stage2Card);
      expect(defaultProps.onSelectStage).not.toHaveBeenCalled();
    });

    it('戻るボタンクリックでonBackが呼ばれる', () => {
      render(<StageSelectScreen {...defaultProps} />);
      fireEvent.click(screen.getByText('戻る'));
      expect(defaultProps.onBack).toHaveBeenCalled();
    });

    it('リセットボタンクリックで確認ダイアログが表示される', () => {
      window.confirm = jest.fn(() => true);
      render(<StageSelectScreen {...defaultProps} />);
      fireEvent.click(screen.getByText('リセット'));
      expect(window.confirm).toHaveBeenCalled();
      expect(defaultProps.onReset).toHaveBeenCalled();
    });

    it('リセット確認でキャンセルした場合onResetは呼ばれない', () => {
      window.confirm = jest.fn(() => false);
      render(<StageSelectScreen {...defaultProps} />);
      fireEvent.click(screen.getByText('リセット'));
      expect(window.confirm).toHaveBeenCalled();
      expect(defaultProps.onReset).not.toHaveBeenCalled();
    });
  });
});
