/**
 * フリー対戦 CPU キャラ選択画面のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FreeBattleCharacterSelect } from './FreeBattleCharacterSelect';
import type { Character } from '../core/types';

const mockCharacters: Character[] = [
  { id: 'rookie', name: 'ソウタ', icon: '', color: '#27ae60', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
  { id: 'regular', name: 'ケンジ', icon: '', color: '#2c3e50', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
  { id: 'ace', name: 'レン', icon: '', color: '#c0392b', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
  { id: 'hiro', name: 'ヒロ', icon: '', color: '#e67e22', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
];

describe('FreeBattleCharacterSelect', () => {
  it('全キャラクターの名前が表示される', () => {
    render(
      <FreeBattleCharacterSelect
        characters={mockCharacters}
        unlockedIds={['rookie', 'regular', 'ace', 'hiro']}
        difficulty="normal"
        onConfirm={jest.fn()}
        onBack={jest.fn()}
      />
    );

    // デフォルト選択のキャラはカードと詳細の両方に表示されるため getAllByText
    expect(screen.getAllByText('ソウタ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ケンジ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('レン').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('ヒロ').length).toBeGreaterThanOrEqual(1);
  });

  it('未解放キャラのボタンが無効化されている', () => {
    render(
      <FreeBattleCharacterSelect
        characters={mockCharacters}
        unlockedIds={['rookie', 'regular', 'ace']}
        difficulty="normal"
        onConfirm={jest.fn()}
        onBack={jest.fn()}
      />
    );

    // ヒロは未解放なのでボタンが disabled
    const hiroButton = screen.getByText('ヒロ').closest('button');
    expect(hiroButton).toBeDisabled();
  });

  it('キャラ選択して確定ボタンを押すと onConfirm が呼ばれる', () => {
    const onConfirm = jest.fn();
    render(
      <FreeBattleCharacterSelect
        characters={mockCharacters}
        unlockedIds={['rookie', 'regular', 'ace', 'hiro']}
        difficulty="normal"
        onConfirm={onConfirm}
        onBack={jest.fn()}
      />
    );

    // ヒロを選択
    fireEvent.click(screen.getByText('ヒロ'));
    // 対戦開始ボタンを押す
    fireEvent.click(screen.getByText('対戦開始！'));

    expect(onConfirm).toHaveBeenCalledWith(mockCharacters[3]);
  });

  it('戻るボタンで onBack が呼ばれる', () => {
    const onBack = jest.fn();
    render(
      <FreeBattleCharacterSelect
        characters={mockCharacters}
        unlockedIds={['rookie', 'regular', 'ace']}
        difficulty="normal"
        onConfirm={jest.fn()}
        onBack={onBack}
      />
    );

    fireEvent.click(screen.getByText('← 戻る'));

    expect(onBack).toHaveBeenCalled();
  });

  describe('難易度ラベル表示（FB-1 R-1）', () => {
    it('rookie カードに「Easy」バッジが表示される', () => {
      render(
        <FreeBattleCharacterSelect
          characters={mockCharacters}
          unlockedIds={['rookie', 'regular', 'ace']}
          difficulty="normal"
          onConfirm={jest.fn()}
          onBack={jest.fn()}
        />
      );
      const rookieCard = screen.getByText('ソウタ').closest('button');
      expect(rookieCard?.textContent).toContain('Easy');
    });

    it('regular カードに「Normal」バッジが表示される', () => {
      render(
        <FreeBattleCharacterSelect
          characters={mockCharacters}
          unlockedIds={['rookie', 'regular', 'ace']}
          difficulty="easy"
          onConfirm={jest.fn()}
          onBack={jest.fn()}
        />
      );
      const regularCard = screen.getByText('ケンジ').closest('button');
      expect(regularCard?.textContent).toContain('Normal');
    });

    it('ace カードに「Hard」バッジが表示される', () => {
      render(
        <FreeBattleCharacterSelect
          characters={mockCharacters}
          unlockedIds={['rookie', 'regular', 'ace']}
          difficulty="normal"
          onConfirm={jest.fn()}
          onBack={jest.fn()}
        />
      );
      const aceCard = screen.getByText('レン').closest('button');
      expect(aceCard?.textContent).toContain('Hard');
    });

    it('フリー対戦キャラ以外（hiro 等）には難易度バッジが表示されない', () => {
      render(
        <FreeBattleCharacterSelect
          characters={mockCharacters}
          unlockedIds={['rookie', 'regular', 'ace', 'hiro']}
          difficulty="normal"
          onConfirm={jest.fn()}
          onBack={jest.fn()}
        />
      );
      const hiroCard = screen.getByText('ヒロ').closest('button');
      expect(hiroCard?.textContent).not.toContain('Easy');
      expect(hiroCard?.textContent).not.toContain('Normal');
      expect(hiroCard?.textContent).not.toContain('Hard');
    });
  });

  it('難易度に応じたデフォルト選択がされる', () => {
    const onConfirm = jest.fn();
    render(
      <FreeBattleCharacterSelect
        characters={mockCharacters}
        unlockedIds={['rookie', 'regular', 'ace']}
        difficulty="easy"
        onConfirm={onConfirm}
        onBack={jest.fn()}
      />
    );

    // デフォルトでソウタが選択 → そのまま対戦開始
    fireEvent.click(screen.getByText('対戦開始！'));
    expect(onConfirm).toHaveBeenCalledWith(mockCharacters[0]); // rookie
  });
});
