/**
 * S6-8b: CharacterAvatar の CLS 防止テスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterAvatar } from './CharacterAvatar';
import type { Character } from '../core/types';

const testCharacter: Character = {
  id: 'hiro',
  name: 'ヒロ',
  icon: '/assets/characters/hiro.png',
  color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

const noIconCharacter: Character = {
  ...testCharacter,
  id: 'noicon',
  name: 'ノーアイコン',
  icon: '',
};

describe('CharacterAvatar', () => {
  describe('CLS 防止（S6-8b）', () => {
    it('画像ロード前はイニシャル文字をフォールバック表示する', () => {
      render(<CharacterAvatar character={testCharacter} size={48} />);
      // ロード完了前はイニシャルが表示される
      expect(screen.getByText('ヒ')).toBeInTheDocument();
    });

    it('画像ロード完了後はイニシャルが非表示になる', () => {
      render(<CharacterAvatar character={testCharacter} size={48} />);
      const img = screen.getByRole('img');
      fireEvent.load(img);
      expect(screen.queryByText('ヒ')).not.toBeInTheDocument();
    });

    it('画像に width/height 属性が設定されている', () => {
      render(<CharacterAvatar character={testCharacter} size={48} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '48');
      expect(img).toHaveAttribute('height', '48');
    });

    it('icon が空の場合はイニシャル文字を表示する', () => {
      render(<CharacterAvatar character={noIconCharacter} size={48} />);
      expect(screen.getByText('ノ')).toBeInTheDocument();
    });

    it('画像ロードエラー時はイニシャル文字にフォールバックする', () => {
      render(<CharacterAvatar character={testCharacter} size={48} />);
      const img = screen.getByRole('img');
      fireEvent.error(img);
      expect(screen.getByText('ヒ')).toBeInTheDocument();
    });

    it('デフォルトと異なるサイズでも width/height が正しく設定される', () => {
      render(<CharacterAvatar character={testCharacter} size={32} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '32');
      expect(img).toHaveAttribute('height', '32');
    });
  });
});
