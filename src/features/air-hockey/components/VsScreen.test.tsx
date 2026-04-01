/**
 * VS 画面のテスト
 * P1-05: VsScreen 演出強化
 *
 * アニメーションシーケンス:
 *   0ms       背景グラデーション フェードイン
 *   200-800ms キャラ左右からスライドイン
 *   800ms     VS テキスト バウンス
 *   1000ms    ステージ情報 フェードイン
 *   1000-2500ms 待機
 *   2500-3000ms 全体フェードアウト
 *   3000ms    onComplete
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { VsScreen } from './VsScreen';
import type { Character } from '../core/types';

// portrait ありのキャラクター
const playerChar: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  portrait: {
    normal: '/assets/portraits/akira-normal.png',
    happy: '/assets/portraits/akira-happy.png',
  },
  vsImage: '/assets/vs/akira-vs.png',
};

const cpuChar: Character = {
  id: 'hiro',
  name: 'ヒロ',
  icon: '/assets/characters/hiro.png',
  color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  portrait: {
    normal: '/assets/portraits/hiro-normal.png',
    happy: '/assets/portraits/hiro-happy.png',
  },
  vsImage: '/assets/vs/hiro-vs.png',
};

// portrait なしのキャラクター（フォールバック用）
const playerCharNoPortrait: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

const cpuCharNoPortrait: Character = {
  id: 'hiro',
  name: 'ヒロ',
  icon: '/assets/characters/hiro.png',
  color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

describe('VsScreen', () => {
  let defaultProps: {
    playerCharacter: Character;
    cpuCharacter: Character;
    stageName: string;
    fieldName: string;
    onComplete: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    defaultProps = {
      playerCharacter: playerChar,
      cpuCharacter: cpuChar,
      stageName: 'はじめの一打',
      fieldName: 'Original',
      onComplete: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('表示', () => {
    it('VSテキストが表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('VS')).toBeInTheDocument();
    });

    it('プレイヤー名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('アキラ')).toBeInTheDocument();
    });

    it('対戦相手名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
    });

    it('ステージ名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText(/はじめの一打/)).toBeInTheDocument();
    });

    it('フィールド名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText(/Original/)).toBeInTheDocument();
    });
  });

  describe('背景グラデーション', () => {
    it('プレイヤーカラーとCPUカラーによる2色グラデーション背景が表示される', () => {
      const { container } = render(<VsScreen {...defaultProps} />);
      const overlay = container.firstChild as HTMLElement;
      const bgStyle = overlay.style.background;
      // プレイヤーカラー(#3498db)とCPUカラー(#e67e22)のグラデーションを含む
      expect(bgStyle).toContain('linear-gradient');
    });
  });

  describe('立ち絵表示', () => {
    it('portrait ありの場合、VS用立ち絵画像が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      const images = screen.getAllByRole('img');
      const vsImages = images.filter(
        (img) =>
          img.getAttribute('src')?.includes('/assets/vs/') ||
          img.getAttribute('alt')?.includes('立ち絵')
      );
      expect(vsImages.length).toBeGreaterThanOrEqual(2);
    });

    it('プレイヤーのVS用立ち絵パスが正しい', () => {
      render(<VsScreen {...defaultProps} />);
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      expect(playerImg).toHaveAttribute('src', '/assets/vs/akira-vs.png');
    });

    it('CPUのVS用立ち絵パスが正しい', () => {
      render(<VsScreen {...defaultProps} />);
      const cpuImg = screen.getByAltText('ヒロ 立ち絵');
      expect(cpuImg).toHaveAttribute('src', '/assets/vs/hiro-vs.png');
    });

    it('vsImage未定義の場合、アイコン画像にフォールバックする', () => {
      const playerWithoutVs: Character = { ...playerChar, vsImage: undefined };
      const cpuWithoutVs: Character = { ...cpuChar, vsImage: undefined };
      render(
        <VsScreen
          {...defaultProps}
          playerCharacter={playerWithoutVs}
          cpuCharacter={cpuWithoutVs}
        />
      );
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      expect(playerImg).toHaveAttribute('src', '/assets/characters/akira.png');
      const cpuImg = screen.getByAltText('ヒロ 立ち絵');
      expect(cpuImg).toHaveAttribute('src', '/assets/characters/hiro.png');
    });

    it('portrait・vsImage両方未定義の場合、アイコン画像にフォールバックする', () => {
      render(
        <VsScreen
          {...defaultProps}
          playerCharacter={playerCharNoPortrait}
          cpuCharacter={cpuCharNoPortrait}
        />
      );
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      expect(playerImg).toHaveAttribute('src', '/assets/characters/akira.png');
      const cpuImg = screen.getByAltText('ヒロ 立ち絵');
      expect(cpuImg).toHaveAttribute('src', '/assets/characters/hiro.png');
    });
  });

  describe('アニメーションフェーズ', () => {
    it('初期状態ではキャラがスライドイン前の位置にいる', () => {
      render(<VsScreen {...defaultProps} />);
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      // 初期位置: 画面外（translateX で左にオフセット）
      expect(playerImg.parentElement?.style.transform).toContain('translateX');
    });

    it('800ms経過後にVSテキストが表示される', () => {
      render(<VsScreen {...defaultProps} />);
      const vsText = screen.getByText('VS');
      // 初期状態では非表示（opacity: 0 or scale: 0）
      expect(vsText.style.opacity).toBe('0');

      act(() => {
        jest.advanceTimersByTime(900);
      });
      // 800ms 以降は表示開始
      expect(Number(vsText.style.opacity)).toBeGreaterThan(0);
    });
  });

  describe('自動遷移', () => {
    it('3秒後にonCompleteが呼ばれる', () => {
      render(<VsScreen {...defaultProps} />);
      expect(defaultProps.onComplete).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('2.5秒時点ではまだonCompleteが呼ばれない', () => {
      render(<VsScreen {...defaultProps} />);
      act(() => {
        jest.advanceTimersByTime(2400);
      });
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });
  });

  describe('スタイル仕様', () => {
    it('VSテキストのフォントサイズが72pxである', () => {
      render(<VsScreen {...defaultProps} />);
      const vsText = screen.getByText('VS');
      expect(vsText.style.fontSize).toBe('72px');
    });

    it('キャラ名のフォントサイズが24pxである', () => {
      render(<VsScreen {...defaultProps} />);
      const playerName = screen.getByText('アキラ');
      expect(playerName.style.fontSize).toBe('24px');
    });

    it('キャラ名がそれぞれのキャラカラーで表示される', () => {
      render(<VsScreen {...defaultProps} />);
      const playerName = screen.getByText('アキラ');
      const cpuName = screen.getByText('ヒロ');
      // JSDOM は HEX を rgb() に変換する
      expect(playerName.style.color).toBe('rgb(52, 152, 219)');
      expect(cpuName.style.color).toBe('rgb(230, 126, 34)');
    });
  });

  describe('2v2 モード', () => {
    const allyChar: Character = {
      id: 'rookie',
      name: 'ルーキー',
      icon: '/assets/characters/rookie.png',
      color: '#27ae60',
      reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    };

    const enemy2Char: Character = {
      id: 'ace',
      name: 'エース',
      icon: '/assets/characters/ace.png',
      color: '#e74c3c',
      reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    };

    it('is2v2=true で 4 キャラの名前が全て表示される', () => {
      render(
        <VsScreen
          {...defaultProps}
          is2v2
          allyCharacter={allyChar}
          enemyCharacter2={enemy2Char}
        />
      );
      expect(screen.getByText('アキラ')).toBeInTheDocument();
      expect(screen.getByText('ルーキー')).toBeInTheDocument();
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
      expect(screen.getByText('エース')).toBeInTheDocument();
    });

    it('is2v2=true で VS テキストが表示される', () => {
      render(
        <VsScreen
          {...defaultProps}
          is2v2
          allyCharacter={allyChar}
          enemyCharacter2={enemy2Char}
        />
      );
      expect(screen.getByText('VS')).toBeInTheDocument();
    });

    it('is2v2=true で 4 キャラの立ち絵/アイコンが表示される', () => {
      render(
        <VsScreen
          {...defaultProps}
          is2v2
          allyCharacter={allyChar}
          enemyCharacter2={enemy2Char}
        />
      );
      const images = screen.getAllByRole('img');
      // P1, P2, P3, P4 の 4 つの立ち絵
      expect(images.length).toBeGreaterThanOrEqual(4);
    });

    it('is2v2=true でも 3 秒後に onComplete が呼ばれる', () => {
      render(
        <VsScreen
          {...defaultProps}
          is2v2
          allyCharacter={allyChar}
          enemyCharacter2={enemy2Char}
        />
      );
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('is2v2 未指定時は従来の 2 キャラ表示（後方互換）', () => {
      render(<VsScreen {...defaultProps} />);
      // ally / enemy2 のキャラは表示されない
      expect(screen.queryByText('ルーキー')).not.toBeInTheDocument();
      expect(screen.queryByText('エース')).not.toBeInTheDocument();
    });

    it('is2v2=true でチームラベル「チーム1」「チーム2」が表示される', () => {
      render(
        <VsScreen
          {...defaultProps}
          is2v2
          allyCharacter={allyChar}
          enemyCharacter2={enemy2Char}
        />
      );
      expect(screen.getByText('チーム1')).toBeInTheDocument();
      expect(screen.getByText('チーム2')).toBeInTheDocument();
    });
  });

  describe('prefers-reduced-motion 対応', () => {
    it('reduced-motion 時にスライドアニメーションがスキップされる', () => {
      // matchMedia をモック
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<VsScreen {...defaultProps} />);
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      // reduced-motion 時は translateX(0) で初期表示
      expect(playerImg.parentElement?.style.transform).toContain('translateX(0');
    });

    it('reduced-motion 時に 1v1 でも transition が none になる', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query, onchange: null,
          addListener: jest.fn(), removeListener: jest.fn(),
          addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
        })),
      });

      render(<VsScreen {...defaultProps} />);
      const playerImg = screen.getByAltText('アキラ 立ち絵');
      expect(playerImg.parentElement?.style.transition).toBe('none');
    });
  });

  describe('2v2 操作タイプラベル', () => {
    const allyChar: Character = {
      id: 'rookie', name: 'ルーキー', icon: '/assets/characters/rookie.png', color: '#27ae60',
      reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    };
    const enemy2Char: Character = {
      id: 'ace', name: 'エース', icon: '/assets/characters/ace.png', color: '#e74c3c',
      reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    };

    describe('P2 ラベル', () => {
      it('allyControlType=cpu 時に「CPU」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} allyControlType="cpu" />
        );
        expect(screen.getByText('CPU')).toBeInTheDocument();
      });

      it('allyControlType=human 時に「2P」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} allyControlType="human" />
        );
        expect(screen.getByText('2P')).toBeInTheDocument();
      });
    });

    describe('P3 ラベル', () => {
      it('enemy1ControlType=cpu 時に P3 に「CPU」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy1ControlType="cpu" />
        );
        expect(screen.getByText('CPU')).toBeInTheDocument();
      });

      it('enemy1ControlType=human 時に P3 に「3P」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy1ControlType="human" />
        );
        expect(screen.getByText('3P')).toBeInTheDocument();
      });
    });

    describe('P4 ラベル', () => {
      it('enemy2ControlType=cpu 時に P4 に「CPU」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy2ControlType="cpu" />
        );
        expect(screen.getByText('CPU')).toBeInTheDocument();
      });

      it('enemy2ControlType=human 時に P4 に「4P」ラベルが表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy2ControlType="human" />
        );
        expect(screen.getByText('4P')).toBeInTheDocument();
      });
    });

    describe('ラベル非表示', () => {
      it('controlType が undefined の場合ラベルが表示されない', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} />
        );
        expect(screen.queryByText('CPU')).not.toBeInTheDocument();
        expect(screen.queryByText('2P')).not.toBeInTheDocument();
        expect(screen.queryByText('3P')).not.toBeInTheDocument();
        expect(screen.queryByText('4P')).not.toBeInTheDocument();
      });
    });

    describe('ラベルスタイル（R-1）', () => {
      it('CPU ラベルのフォントサイズが 12px である', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} allyControlType="cpu" enemy1ControlType="cpu" enemy2ControlType="cpu" />
        );
        const cpuLabels = screen.getAllByText('CPU');
        cpuLabels.forEach(label => {
          expect(label.style.fontSize).toBe('12px');
        });
      });

      it('CPU ラベルの色が #888 である', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} allyControlType="cpu" />
        );
        const cpuLabel = screen.getByText('CPU');
        expect(cpuLabel.style.color).toBe('rgb(136, 136, 136)');
      });

      it('人間操作ラベル（2P）はチーム1カラーで表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} allyControlType="human" />
        );
        const label = screen.getByText('2P');
        // Team1 カラー: #3498db → rgb(52, 152, 219)
        expect(label.style.color).toBe('rgb(52, 152, 219)');
        expect(label.style.fontWeight).toBe('bold');
      });

      it('人間操作ラベル（3P）はチーム2カラーで表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy1ControlType="human" />
        );
        const label = screen.getByText('3P');
        // Team2 カラー: #e74c3c → rgb(231, 76, 60)
        expect(label.style.color).toBe('rgb(231, 76, 60)');
        expect(label.style.fontWeight).toBe('bold');
      });

      it('人間操作ラベル（4P）はチーム2カラーで表示される', () => {
        render(
          <VsScreen {...defaultProps} is2v2 allyCharacter={allyChar} enemyCharacter2={enemy2Char} enemy2ControlType="human" />
        );
        const label = screen.getByText('4P');
        // Team2 カラー: #e74c3c → rgb(231, 76, 60)
        expect(label.style.color).toBe('rgb(231, 76, 60)');
        expect(label.style.fontWeight).toBe('bold');
      });
    });
  });
});
