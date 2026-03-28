/**
 * TeamSetupScreen のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamSetupScreen } from './TeamSetupScreen';
import type { Character, Difficulty } from '../core/types';

// テスト用キャラクターデータ
const mockPlayerCharacter: Character = {
  id: 'player', name: 'アキラ', icon: '/akira.png', color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};
const mockAlly: Character = {
  id: 'rookie', name: 'ルーキー', icon: '/rookie.png', color: '#27ae60',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};
const mockEnemy1: Character = {
  id: 'regular', name: 'レギュラー', icon: '/regular.png', color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};
const mockEnemy2: Character = {
  id: 'ace', name: 'エース', icon: '/ace.png', color: '#e74c3c',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};
const mockLockedChar: Character = {
  id: 'hiro', name: 'ヒロ', icon: '/hiro.png', color: '#9b59b6',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

const allCharacters = [mockAlly, mockEnemy1, mockEnemy2, mockLockedChar];
const unlockedIds = ['rookie', 'regular', 'ace'];

const createDefaultProps = () => ({
  allCharacters,
  unlockedIds,
  playerCharacter: mockPlayerCharacter,
  allyCharacter: mockAlly,
  enemyCharacter1: mockEnemy1,
  enemyCharacter2: mockEnemy2,
  onAllyChange: jest.fn(),
  onEnemy1Change: jest.fn(),
  onEnemy2Change: jest.fn(),
  allyControlType: 'cpu' as 'cpu' | 'human',
  onAllyControlTypeChange: jest.fn(),
  difficulty: 'normal' as Difficulty,
  onDifficultyChange: jest.fn(),
  onStart: jest.fn(),
  onBack: jest.fn(),
});

describe('TeamSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レイアウト', () => {
    it('ヘッダーにタイトル「ペアマッチ設定」と戻るボタンが表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('ペアマッチ設定')).toBeDefined();
      expect(screen.getByRole('button', { name: /戻る/ })).toBeDefined();
    });

    it('フルスクリーンコンテナで表示される', () => {
      const { container } = render(<TeamSetupScreen {...createDefaultProps()} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.height).toBe('100%');
      expect(root.style.display).toBe('flex');
      expect(root.style.flexDirection).toBe('column');
    });

    it('対戦開始ボタンが表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByRole('button', { name: '対戦開始！' })).toBeDefined();
    });
  });

  describe('チーム構成表示', () => {
    it('P1（プレイヤー）のキャラ名が表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('アキラ')).toBeDefined();
    });

    it('P2（味方）の選択済みキャラ名が表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('ルーキー')).toBeDefined();
    });

    it('P3（敵1）の選択済みキャラ名が表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('レギュラー')).toBeDefined();
    });

    it('P4（敵2）の選択済みキャラ名が表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('エース')).toBeDefined();
    });

    it('チーム1/チーム2のセクションが表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText(/チーム1/)).toBeDefined();
      expect(screen.getByText(/チーム2/)).toBeDefined();
    });
  });

  describe('キャラクター選択', () => {
    it('P2 スロットをクリックすると選択パネルが展開される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const p2Slot = screen.getByTestId('slot-p2');
      fireEvent.click(p2Slot);
      // 展開後、キャラクターグリッドが表示される
      expect(screen.getByTestId('character-grid-p2')).toBeDefined();
    });

    it('選択パネルでキャラをクリックすると onAllyChange が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByTestId('slot-p2'));
      // エースを選択
      const aceButton = screen.getByTestId('char-select-ace');
      fireEvent.click(aceButton);
      expect(props.onAllyChange).toHaveBeenCalledWith(mockEnemy2);
    });

    it('P3 スロットをクリックして onEnemy1Change でキャラを変更できる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByTestId('slot-p3'));
      const rookieButton = screen.getByTestId('char-select-rookie');
      fireEvent.click(rookieButton);
      expect(props.onEnemy1Change).toHaveBeenCalledWith(mockAlly);
    });

    it('P4 スロットをクリックして onEnemy2Change でキャラを変更できる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByTestId('slot-p4'));
      const regularButton = screen.getByTestId('char-select-regular');
      fireEvent.click(regularButton);
      expect(props.onEnemy2Change).toHaveBeenCalledWith(mockEnemy1);
    });

    it('ロック済みキャラは選択できない（disabled）', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByTestId('slot-p2'));
      const lockedButton = screen.getByTestId('char-select-hiro');
      expect(lockedButton).toBeDisabled();
    });
  });

  describe('難易度選択', () => {
    it('3つの難易度ボタンが表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('かんたん')).toBeDefined();
      expect(screen.getByText('ふつう')).toBeDefined();
      expect(screen.getByText('むずかしい')).toBeDefined();
    });

    it('現在の難易度がハイライトされる', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const normalButton = screen.getByText('ふつう');
      // ハイライトされたボタンはスタイルが異なる
      expect(normalButton.closest('button')?.style.backgroundColor).toBeTruthy();
    });

    it('難易度ボタンクリックで onDifficultyChange が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByText('かんたん'));
      expect(props.onDifficultyChange).toHaveBeenCalledWith('easy');
    });
  });

  describe('アクション', () => {
    it('「対戦開始！」ボタンで onStart が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByText('対戦開始！'));
      expect(props.onStart).toHaveBeenCalledTimes(1);
    });

    it('「戻る」ボタンで onBack が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByText('← 戻る'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('P2 CPU/人間トグル', () => {
    it('CPU/人間のセグメントコントロールが表示される', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.getByText('CPU')).toBeDefined();
      expect(screen.getByText('人間')).toBeDefined();
    });

    it('allyControlType=cpu のとき CPU ボタンがハイライトされる', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const cpuButton = screen.getByText('CPU').closest('button') as HTMLElement;
      expect(cpuButton.style.backgroundColor).toBeTruthy();
    });

    it('「人間」をクリックすると onAllyControlTypeChange(human) が呼ばれる', () => {
      const props = createDefaultProps();
      render(<TeamSetupScreen {...props} />);
      fireEvent.click(screen.getByText('人間'));
      expect(props.onAllyControlTypeChange).toHaveBeenCalledWith('human');
    });

    it('allyControlType=human のとき操作ヒントが表示される', () => {
      const props = { ...createDefaultProps(), allyControlType: 'human' as const };
      render(<TeamSetupScreen {...props} />);
      expect(screen.getByText(/WASD/)).toBeDefined();
    });

    it('allyControlType=cpu のとき操作ヒントが表示されない', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      expect(screen.queryByText(/WASD/)).toBeNull();
    });
  });

  describe('デザイン改善（S5-8）', () => {
    it('チーム1セクションに青系の左ボーダーがある', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const section = screen.getByTestId('team1-section');
      // JSDOM は HEX を rgb() に変換する
      expect(section.style.borderLeft).toContain('3px solid');
      expect(section.style.borderLeft).toContain('52, 152, 219');
    });

    it('チーム2セクションに赤系の左ボーダーがある', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const section = screen.getByTestId('team2-section');
      expect(section.style.borderLeft).toContain('3px solid');
      expect(section.style.borderLeft).toContain('231, 76, 60');
    });

    it('P1 スロットの opacity が 1 である', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const p1Slot = screen.getByTestId('slot-p1');
      expect(p1Slot.style.opacity).toBe('');
    });

    it('難易度セクションがチームセクションより前に表示される', () => {
      const { container } = render(<TeamSetupScreen {...createDefaultProps()} />);
      const scrollArea = container.querySelector('[data-testid="scroll-area"]') as HTMLElement;
      const children = Array.from(scrollArea.children);
      const diffIndex = children.findIndex(el => el.textContent?.includes('CPU 難易度'));
      const team1Index = children.findIndex(el => el.textContent?.includes('チーム1'));
      expect(diffIndex).toBeLessThan(team1Index);
    });

    it('CPU/人間トグルのタッチターゲットが 44px 以上', () => {
      render(<TeamSetupScreen {...createDefaultProps()} />);
      const cpuButton = screen.getByText('CPU').closest('button') as HTMLElement;
      expect(cpuButton.style.minHeight).toBe('44px');
    });
  });
});
