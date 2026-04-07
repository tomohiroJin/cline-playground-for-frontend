/**
 * キャラクター図鑑画面のテスト
 * P2-03: CharacterDexScreen
 *
 * テスト項目:
 *   - 全キャラカードの表示
 *   - アンロック済みキャラのアイコンと名前
 *   - ロック中キャラの「???」表示
 *   - NEW バッジの表示
 *   - カードタップのコールバック
 *   - ロック中カードのタップ不可
 *   - コンプリート率の表示
 *   - 「戻る」ボタンのコールバック
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterDexScreen } from './CharacterDexScreen';
import type { Character, DexEntry } from '../core/types';

// テスト用の図鑑エントリ
const createDexEntry = (id: string, name: string): DexEntry => ({
  profile: {
    characterId: id,
    fullName: name,
    reading: 'てすと',
    grade: '1年生',
    age: 15,
    birthday: '1月1日',
    height: '170cm',
    school: 'テスト校',
    club: 'テスト部',
    personality: ['テスト'],
    quote: 'テストセリフ',
    playStyle: 'テスト',
    specialMove: 'テスト技',
    specialMoveDesc: 'テスト説明',
    description: 'テスト紹介文',
  },
  unlockCondition: { type: 'default' },
});

// テスト用キャラクターマップ
const createCharacter = (id: string, name: string, color: string): Character => ({
  id,
  name,
  icon: `/assets/characters/${id}.png`,
  color,
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
});

const dexEntries: DexEntry[] = [
  createDexEntry('player', '蒼葉 アキラ'),
  createDexEntry('hiro', '日向 ヒロ'),
  createDexEntry('misaki', '水瀬 ミサキ'),
  createDexEntry('takuma', '鷹見 タクマ'),
];

const characters: Record<string, Character> = {
  player: createCharacter('player', 'アキラ', '#3498db'),
  hiro: createCharacter('hiro', 'ヒロ', '#e67e22'),
  misaki: createCharacter('misaki', 'ミサキ', '#9b59b6'),
  takuma: createCharacter('takuma', 'タクマ', '#c0392b'),
};

describe('CharacterDexScreen', () => {
  const defaultProps = {
    dexEntries,
    unlockedIds: ['player', 'hiro'],
    newlyUnlockedIds: ['hiro'],
    characters,
    completionRate: 0.5,
    onSelectCharacter: jest.fn(),
    onBack: jest.fn(),
    onMarkViewed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('全キャラカードが表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      // アンロック済みキャラ名が表示される
      expect(screen.getByText('アキラ')).toBeInTheDocument();
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
      // ロック中は「???」
      const lockedCards = screen.getAllByText('???');
      expect(lockedCards).toHaveLength(2);
    });

    it('アンロック済みキャラのアイコンと名前が表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      // アキラのアイコン
      const akiraIcon = screen.getByAltText('アキラ');
      expect(akiraIcon).toHaveAttribute('src', '/assets/characters/player.png');
      expect(screen.getByText('アキラ')).toBeInTheDocument();

      // ヒロのアイコン
      const hiroIcon = screen.getByAltText('ヒロ');
      expect(hiroIcon).toHaveAttribute('src', '/assets/characters/hiro.png');
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
    });

    it('ロック中キャラが「???」で表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      const lockedCards = screen.getAllByText('???');
      expect(lockedCards).toHaveLength(2);
    });

    it('NEW バッジが新規アンロックキャラに表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      const newBadges = screen.getAllByText('NEW');
      expect(newBadges).toHaveLength(1);
    });

    it('NEW バッジが新規アンロックでないキャラには表示されない', () => {
      render(
        <CharacterDexScreen
          {...defaultProps}
          newlyUnlockedIds={[]}
        />
      );

      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('アンロック済みカードタップで onSelectCharacter が呼ばれる', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      // アキラのカードをクリック
      fireEvent.click(screen.getByText('アキラ'));
      expect(defaultProps.onSelectCharacter).toHaveBeenCalledWith('player');
    });

    it('ロック中カードタップで onSelectCharacter が呼ばれない', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      // ロック中カード（「???」）をクリック
      const lockedCards = screen.getAllByText('???');
      fireEvent.click(lockedCards[0]);
      expect(defaultProps.onSelectCharacter).not.toHaveBeenCalled();
    });

    it('「戻る」ボタンで onBack が呼ばれる', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      fireEvent.click(screen.getByText('← 戻る'));
      expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('ヘッダーレイアウト（FB-2）', () => {
    it('タイトルが Header の中央列に配置される（grid-template-columns: 1fr auto 1fr）', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      const title = screen.getByText('キャラクター図鑑');
      const header = title.parentElement;
      expect(header).not.toBeNull();
      // 3 列 Grid: BackButton / Title / 空セル の 3 つの子要素
      expect(header?.children.length).toBe(3);
    });

    it('Header の最初の子は「戻る」ボタンである', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      const title = screen.getByText('キャラクター図鑑');
      const header = title.parentElement;
      expect(header?.children[0].textContent).toBe('← 戻る');
    });

    it('Header の中央の子はタイトルである', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      const title = screen.getByText('キャラクター図鑑');
      const header = title.parentElement;
      expect(header?.children[1].textContent).toBe('キャラクター図鑑');
    });
  });

  describe('コンプリート率', () => {
    it('コンプリート率が正しく表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      // 「2/4」が表示される（unlockedIds.length / dexEntries.length）
      expect(screen.getByText('2 / 4')).toBeInTheDocument();
    });

    it('全キャラアンロック時に正しく表示される', () => {
      render(
        <CharacterDexScreen
          {...defaultProps}
          unlockedIds={['player', 'hiro', 'misaki', 'takuma']}
          completionRate={1}
        />
      );

      expect(screen.getByText('4 / 4')).toBeInTheDocument();
    });
  });

  describe('ヘッダー', () => {
    it('「キャラクター図鑑」タイトルが表示される', () => {
      render(<CharacterDexScreen {...defaultProps} />);

      expect(screen.getByText('キャラクター図鑑')).toBeInTheDocument();
    });
  });

  describe('hidden キャラの非表示', () => {
    it('フックが hidden を除外済みのエントリのみ渡すため、hidden キャラは表示されない', () => {
      // Arrange: hidden キャラを除外済みのエントリ（フック側で除外される想定）
      // visible entries のみで構成（default + story-clear のみ）
      render(<CharacterDexScreen {...defaultProps} />);

      // hidden キャラ（ユウ等）は dexEntries に含まれないため表示されない
      // アンロック済み: アキラ、ヒロ（2件）
      expect(screen.getByText('アキラ')).toBeInTheDocument();
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
      // ロック中: ミサキ、タクマ（2件）
      const lockedCards = screen.getAllByText('???');
      expect(lockedCards).toHaveLength(2);
      // 合計4件のカードのみ表示
      const allCards = [...screen.getAllByText(/アキラ|ヒロ/), ...lockedCards];
      expect(allCards).toHaveLength(4);
    });
  });
});
