/**
 * フリー対戦 CPU キャラ選択画面のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FreeBattleCharacterSelect } from './FreeBattleCharacterSelect';
import type { Character } from '../core/types';

const mockCharacters: Character[] = [
  { id: 'rookie', name: 'ルーキー', icon: '', color: '#27ae60', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
  { id: 'regular', name: 'レギュラー', icon: '', color: '#2c3e50', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
  { id: 'ace', name: 'エース', icon: '', color: '#c0392b', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } },
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
    expect(screen.getAllByText('ルーキー').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('レギュラー').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('エース').length).toBeGreaterThanOrEqual(1);
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

    fireEvent.click(screen.getByText('戻る'));

    expect(onBack).toHaveBeenCalled();
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

    // デフォルトでルーキーが選択 → そのまま対戦開始
    fireEvent.click(screen.getByText('対戦開始！'));
    expect(onConfirm).toHaveBeenCalledWith(mockCharacters[0]); // rookie
  });
});
