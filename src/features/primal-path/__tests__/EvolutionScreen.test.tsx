/**
 * 原始進化録 - PRIMAL PATH - 進化選択画面コンポーネントテスト（Phase 6-2）
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EvolutionScreen } from '../components/EvolutionScreen';
import type { Evolution, SfxType } from '../types';
import { EVOS } from '../constants';
import { makeRun } from './test-helpers';
import type { GameAction } from '../hooks';

/* ===== テスト用データ ===== */

/** タグ付き進化を3件取得（fire, regen, hunt タグ付き） */
const testEvoPicks: Evolution[] = [
  EVOS[0],  // 火おこし: ATK+3, tags: ['fire']
  EVOS[8],  // 薬草知識: HP+12, tags: ['regen']
  EVOS[1],  // 投石術: ATK+2 会心+3%, tags: ['hunt']
];

/* ===== テスト ===== */

describe('EvolutionScreen', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();
  const mockPlaySfx = jest.fn<void, [SfxType]>();

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPlaySfx.mockClear();
  });

  describe('基本レンダリング', () => {
    it('「進化を選べ」タイトルが表示される', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );

      // Assert
      expect(screen.getByText('進化を選べ')).toBeInTheDocument();
    });

    it('進化カードが3枚表示される', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );

      // Assert: 各進化名が表示される
      expect(screen.getByText(/火おこし/)).toBeInTheDocument();
      expect(screen.getByText(/薬草知識/)).toBeInTheDocument();
      expect(screen.getByText(/投石術/)).toBeInTheDocument();
    });

    it('各進化カードに進化名が表示される', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );

      // Assert: 説明文も表示される
      expect(screen.getByText(/ATK\+3/)).toBeInTheDocument();
      expect(screen.getByText(/HP\+12/)).toBeInTheDocument();
    });
  });

  describe('シナジータグ表示', () => {
    it('タグ付き進化のシナジータグバッジが表示される', () => {
      // Arrange: 火おこし は tags: ['fire'] を持つ
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );

      // Assert: 🔥火 のタグバッジが表示される（SYNERGY_TAG_INFO.fire.ic + nm = "🔥火"）
      // タグカウント表示（0→1）も含む
      expect(screen.getAllByText(/🔥火/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('進化カード選択', () => {
    it('カードクリックで dispatch が呼ばれる', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );
      // 「火おこし」カードをクリック
      fireEvent.click(screen.getByText(/火おこし/).closest('[class]')!);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SELECT_EVO' }),
      );
    });

    it('カードクリックで playSfx("evo") が呼ばれる', () => {
      // Arrange
      const run = makeRun();

      // Act
      render(
        <EvolutionScreen run={run} evoPicks={testEvoPicks} dispatch={mockDispatch} playSfx={mockPlaySfx} battleSpd={750} />,
      );
      fireEvent.click(screen.getByText(/薬草知識/).closest('[class]')!);

      // Assert
      expect(mockPlaySfx).toHaveBeenCalledWith('evo');
    });
  });
});
