import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { FIELDS, DIFFICULTY_OPTIONS, WIN_SCORE_OPTIONS } from '../core/config';

// 共通のデフォルト Props
const defaultProps = {
  diff: DIFFICULTY_OPTIONS[0],
  setDiff: jest.fn(),
  field: FIELDS[0],
  setField: jest.fn(),
  winScore: WIN_SCORE_OPTIONS[0],
  setWinScore: jest.fn(),
  highScore: 0,
  onStart: jest.fn(),
  onStoryClick: jest.fn(),
  onShowAchievements: jest.fn(),
  onHelpClick: jest.fn(),
  onSettingsClick: jest.fn(),
  onDailyChallengeClick: jest.fn(),
} as const;

describe('TitleScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('既存機能', () => {
    it('タイトルとフリー対戦ボタンが表示される', () => {
      render(<TitleScreen {...defaultProps} />);

      expect(screen.getByText('🏒 Air Hockey')).toBeInTheDocument();
      expect(screen.getByText('フリー対戦')).toBeInTheDocument();
    });

    it('ストーリーボタンが表示される', () => {
      render(<TitleScreen {...defaultProps} />);

      expect(screen.getByText('ストーリー')).toBeInTheDocument();
    });
  });

  describe('メインボタン', () => {
    it('フリー対戦・ストーリー・キャラクターの3つのメインボタンがすべて表示される', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
          newUnlockCount={0}
        />
      );

      expect(screen.getByText('フリー対戦')).toBeInTheDocument();
      expect(screen.getByText('ストーリー')).toBeInTheDocument();
      expect(screen.getByText('キャラクター')).toBeInTheDocument();
    });
  });

  describe('キャラクターボタン', () => {
    it('onCharacterDexClick が渡された場合、「キャラクター」ボタンが表示される', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
          newUnlockCount={0}
        />
      );

      expect(screen.getByText('キャラクター')).toBeInTheDocument();
    });

    it('onCharacterDexClick が未指定の場合、「キャラクター」ボタンが表示されない', () => {
      render(<TitleScreen {...defaultProps} />);

      expect(screen.queryByText('キャラクター')).not.toBeInTheDocument();
    });

    it('「キャラクター」ボタンをクリックすると onCharacterDexClick が呼ばれる', () => {
      const onCharacterDexClick = jest.fn();
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={onCharacterDexClick}
          newUnlockCount={0}
        />
      );

      fireEvent.click(screen.getByText('キャラクター'));
      expect(onCharacterDexClick).toHaveBeenCalledTimes(1);
    });

    it('「キャラクター」ボタンはストーリーボタンの後に表示される', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
          newUnlockCount={0}
        />
      );

      const storyButton = screen.getByText('ストーリー');
      const characterButton = screen.getByText('キャラクター');

      // DOM 上でストーリーボタンがキャラクターボタンより前にある
      const allButtons = screen.getAllByRole('button');
      const storyIndex = allButtons.indexOf(storyButton);
      const characterIndex = allButtons.indexOf(characterButton);
      expect(storyIndex).toBeLessThan(characterIndex);
    });
  });

  describe('通知バッジ', () => {
    it('newUnlockCount > 0 の場合、キャラクターボタン付近にバッジが表示される', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
          newUnlockCount={5}
        />
      );

      // キャラクターボタンが表示され、バッジの数字が見える
      expect(screen.getByText('キャラクター')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('newUnlockCount === 0 の場合、バッジが表示されない', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
          newUnlockCount={0}
        />
      );

      expect(screen.queryByTestId('character-badge')).not.toBeInTheDocument();
    });

    it('newUnlockCount が未指定の場合、バッジが表示されない', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onCharacterDexClick={jest.fn()}
        />
      );

      expect(screen.queryByTestId('character-badge')).not.toBeInTheDocument();
    });
  });

  describe('2P 対戦ボタン', () => {
    it('onTwoPlayerClick が渡された場合、「2P 対戦」ボタンが表示される', () => {
      render(
        <TitleScreen
          {...defaultProps}
          onTwoPlayerClick={jest.fn()}
        />
      );

      expect(screen.getByText('2P 対戦')).toBeInTheDocument();
    });

    it('onTwoPlayerClick が未指定の場合、「2P 対戦」ボタンが表示されない', () => {
      render(<TitleScreen {...defaultProps} />);

      expect(screen.queryByText('2P 対戦')).not.toBeInTheDocument();
    });

    it('「2P 対戦」ボタンをクリックすると onTwoPlayerClick が呼ばれる', () => {
      const onTwoPlayerClick = jest.fn();
      render(
        <TitleScreen
          {...defaultProps}
          onTwoPlayerClick={onTwoPlayerClick}
        />
      );

      fireEvent.click(screen.getByText('2P 対戦'));
      expect(onTwoPlayerClick).toHaveBeenCalledTimes(1);
    });
  });
});
