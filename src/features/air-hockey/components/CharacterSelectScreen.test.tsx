/**
 * キャラクター選択画面のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import type { Character } from '../core/types';

// テスト用キャラクターデータ
const createTestCharacter = (id: string, name: string, color = '#000'): Character => ({
  id,
  name,
  icon: `/assets/characters/${id}.png`,
  color,
  reactions: { onScore: ['!'], onConcede: ['...'], onWin: ['Win!'], onLose: ['Lose...'] },
});

const mockCharacters: Character[] = [
  createTestCharacter('player', 'アキラ', '#3498db'),
  createTestCharacter('hiro', 'ヒロ', '#e74c3c'),
  createTestCharacter('misaki', 'ミサキ', '#9b59b6'),
  createTestCharacter('takuma', 'タクマ', '#e67e22'),
];

describe('CharacterSelectScreen', () => {
  const defaultProps = {
    characters: mockCharacters,
    onStartBattle: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('画面タイトル「2P 対戦」が表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      expect(screen.getByText('2P 対戦')).toBeInTheDocument();
    });

    it('全キャラクターがグリッドに表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      // 各キャラクターの alt テキストがグリッドのアイコンに存在
      expect(screen.getAllByAltText('アキラ').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByAltText('ヒロ').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByAltText('ミサキ').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByAltText('タクマ').length).toBeGreaterThanOrEqual(1);
    });

    it('1P と 2P の選択パネルが表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      expect(screen.getByText('1P')).toBeInTheDocument();
      expect(screen.getByText('2P')).toBeInTheDocument();
    });

    it('VS テキストが表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      expect(screen.getByText('VS')).toBeInTheDocument();
    });

    it('対戦開始ボタンが表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: '対戦開始！' })).toBeInTheDocument();
    });

    it('戻るボタンが表示される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: '← 戻る' })).toBeInTheDocument();
    });
  });

  describe('キャラクター選択', () => {
    it('初期状態で 1P にアキラ、2P にヒロが選択されている', () => {
      render(<CharacterSelectScreen {...defaultProps} />);
      // 1P パネルと 2P パネルにそれぞれキャラアイコンが表示される
      const akiraImages = screen.getAllByAltText('アキラ');
      const hiroImages = screen.getAllByAltText('ヒロ');
      // アキラ: 1Pパネル + グリッド = 2
      expect(akiraImages.length).toBe(2);
      // ヒロ: 2Pパネル + グリッド = 2
      expect(hiroImages.length).toBe(2);
    });

    it('キャラクターをタップすると選択中プレイヤーのキャラが変更される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      // ミサキのグリッドカードをクリック（alt テキストで特定）
      const misakiImg = screen.getByAltText('ミサキ');
      fireEvent.click(misakiImg);

      // 1P パネルにミサキが表示される（パネル + グリッド = 2）
      const allMisaki = screen.getAllByAltText('ミサキ');
      expect(allMisaki.length).toBe(2);
    });

    it('2P パネルをクリックして切り替え後、キャラ選択が 2P に反映される', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      // 2P パネルをクリックして選択中プレイヤーを切り替え
      fireEvent.click(screen.getByText('2P'));

      // タクマのグリッドカードをクリック
      const takumaImg = screen.getByAltText('タクマ');
      fireEvent.click(takumaImg);

      // 2P パネルにタクマが表示される（パネル + グリッド = 2）
      const allTakuma = screen.getAllByAltText('タクマ');
      expect(allTakuma.length).toBe(2);
    });

    it('同キャラ選択が可能（ミラーマッチ）', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      // 2P に切り替えてアキラを選択
      fireEvent.click(screen.getByText('2P'));
      // グリッド内のアキラのアイコンをクリック（2番目の img — 1つ目はパネル）
      const akiraImages = screen.getAllByAltText('アキラ');
      // 初期: 1P パネル + グリッド = 2個。グリッドのものをクリック
      fireEvent.click(akiraImages[akiraImages.length - 1]);

      // 両パネルにアキラが表示される: 1Pパネル + 2Pパネル + グリッド = 3
      const updatedAkira = screen.getAllByAltText('アキラ');
      expect(updatedAkira.length).toBe(3);
    });
  });

  describe('操作', () => {
    it('対戦開始ボタンで onStartBattle がキャラクター情報のみで呼ばれる', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '対戦開始！' }));

      expect(defaultProps.onStartBattle).toHaveBeenCalledWith({
        player1Character: expect.objectContaining({ id: 'player' }),
        player2Character: expect.objectContaining({ id: 'hiro' }),
      });
    });

    it('onStartBattle に field / winScore が含まれない', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '対戦開始！' }));

      const config = defaultProps.onStartBattle.mock.calls[0][0];
      expect(config).not.toHaveProperty('field');
      expect(config).not.toHaveProperty('winScore');
    });

    it('戻るボタンで onBack が呼ばれる', () => {
      render(<CharacterSelectScreen {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: '← 戻る' }));

      expect(defaultProps.onBack).toHaveBeenCalled();
    });
  });
});
