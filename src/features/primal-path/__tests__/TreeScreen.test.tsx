/**
 * 原始進化録 - PRIMAL PATH - ツリー画面コンポーネントテスト（P4: FB#3）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TreeScreen } from '../components/TreeScreen';
import { makeSave } from './test-helpers';
import { TREE } from '../constants';
import type { SfxType } from '../types';
import type { GameAction } from '../hooks';

/* ===== テスト ===== */

describe('TreeScreen', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();
  const mockPlaySfx = jest.fn<void, [SfxType]>();
  const mockShowOverlay = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPlaySfx.mockClear();
    mockShowOverlay.mockClear();
  });

  describe('累積効果サマリー改善（P4: FB#3）', () => {
    it('取得済みノードがある場合、効果サマリーが表示される', () => {
      // Arrange: 最初のTier1ノード（bA: ATK+2）を購入済みにする
      const firstNode = TREE.find(nd => nd.t === 1);
      const tree: Record<string, number> = {};
      if (firstNode) tree[firstNode.id] = 1;

      const save = makeSave({ tree, clears: 1, bones: 100 });

      // Act
      render(
        <TreeScreen save={save} dispatch={mockDispatch} playSfx={mockPlaySfx} showOverlay={mockShowOverlay} />,
      );

      // Assert: 効果サマリーにツリーアイコンが含まれる
      expect(screen.getByText(/🌳/)).toBeInTheDocument();
    });

    it('取得済みノードがない場合、ツリーサマリーアイコンが表示されない', () => {
      // Arrange: ノード未購入
      const save = makeSave({ clears: 1, bones: 100 });

      // Act
      const { container } = render(
        <TreeScreen save={save} dispatch={mockDispatch} playSfx={mockPlaySfx} showOverlay={mockShowOverlay} />,
      );

      // Assert
      expect(container.textContent).not.toContain('🌳');
    });
  });
});
