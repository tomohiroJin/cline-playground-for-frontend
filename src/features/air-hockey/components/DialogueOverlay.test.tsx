/**
 * ダイアログオーバーレイのテスト
 * US-2.4（試合前ダイアログ）/ P1-04（背景+立ち絵+表情差分 強化）
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DialogueOverlay } from './DialogueOverlay';
import type { Dialogue } from '../core/story';
import type { Character } from '../core/types';

// テスト用キャラクター（portrait なし — 後方互換テスト用）
const testCharacters: Record<string, Character> = {
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: '/assets/characters/hiro.png',
    color: '#e67e22',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  },
  player: {
    id: 'player',
    name: 'アキラ',
    icon: '/assets/characters/akira.png',
    color: '#3498db',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  },
};

// テスト用キャラクター（portrait あり — 立ち絵テスト用）
const testCharactersWithPortrait: Record<string, Character> = {
  hiro: {
    ...testCharacters.hiro,
    portrait: {
      normal: '/assets/portraits/hiro-normal.png',
      happy: '/assets/portraits/hiro-happy.png',
    },
  },
  player: {
    ...testCharacters.player,
    portrait: {
      normal: '/assets/portraits/akira-normal.png',
      happy: '/assets/portraits/akira-happy.png',
    },
  },
};

const testDialogues: Dialogue[] = [
  { characterId: 'hiro', text: 'おっ、新入り？' },
  { characterId: 'hiro', text: 'まずは俺と一勝負だ。' },
  { characterId: 'player', text: 'よろしくお願いします！' },
];

describe('DialogueOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    dialogues: testDialogues,
    characters: testCharacters,
    onComplete: jest.fn(),
  };

  describe('表示', () => {
    it('半透明の暗転オーバーレイが表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByTestId('dialogue-overlay')).toBeInTheDocument();
    });

    it('キャラクター名が表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
    });

    it('スキップボタンが表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('スキップ')).toBeInTheDocument();
    });
  });

  describe('文字送り', () => {
    it('セリフが1文字ずつ表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 初期状態では全文は表示されていない
      const textElement = screen.getByTestId('dialogue-text');
      expect(textElement.textContent).not.toBe('おっ、新入り？');

      // 全文字分の時間経過（30ms/文字 × 7文字）
      act(() => {
        jest.advanceTimersByTime(30 * 7);
      });
      expect(textElement.textContent).toBe('おっ、新入り？');
    });

    it('表示中にクリックで全文が即座に表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 途中まで表示
      act(() => {
        jest.advanceTimersByTime(30 * 2);
      });

      // クリックで全文表示
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      expect(screen.getByTestId('dialogue-text').textContent).toBe('おっ、新入り？');
    });

    it('全文表示後にクリックで次のセリフへ進む', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 全文表示
      act(() => {
        jest.advanceTimersByTime(30 * 10);
      });

      // クリックで次のセリフ
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 次のセリフの文字送り開始
      act(() => {
        jest.advanceTimersByTime(30 * 20);
      });
      expect(screen.getByTestId('dialogue-text').textContent).toBe('まずは俺と一勝負だ。');
    });

    it('最後のセリフの後にクリックでonCompleteが呼ばれる', () => {
      render(<DialogueOverlay {...defaultProps} />);

      // 1つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 2つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 3つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('スキップ', () => {
    it('スキップボタンクリックで即座にonCompleteが呼ばれる', () => {
      render(<DialogueOverlay {...defaultProps} />);
      fireEvent.click(screen.getByText('スキップ'));
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('キャラクター切り替え', () => {
    it('セリフのキャラクターが変わると表示名が変わる', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();

      // 1つ目のセリフを完了 → 2つ目へ
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      // 2つ目もヒロ
      expect(screen.getByText('ヒロ')).toBeInTheDocument();

      // 2つ目のセリフを完了 → 3つ目（アキラ）へ
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      act(() => { jest.advanceTimersByTime(30 * 1); });
      expect(screen.getByText('アキラ')).toBeInTheDocument();
    });
  });

  // ── P1-04: 背景画像 ──────────────────────────────
  describe('背景画像', () => {
    it('backgroundUrl を渡すと背景画像が表示される', () => {
      render(
        <DialogueOverlay
          {...defaultProps}
          backgroundUrl="/assets/backgrounds/bg-clubroom.webp"
        />,
      );
      const bgImage = screen.getByTestId('dialogue-background');
      expect(bgImage).toBeInTheDocument();
      expect(bgImage.tagName).toBe('IMG');
      expect(bgImage).toHaveAttribute('src', '/assets/backgrounds/bg-clubroom.webp');
    });

    it('backgroundUrl がない場合は背景画像が表示されない', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.queryByTestId('dialogue-background')).not.toBeInTheDocument();
    });

    it('backgroundUrl がある場合も暗めオーバーレイが重なる', () => {
      render(
        <DialogueOverlay
          {...defaultProps}
          backgroundUrl="/assets/backgrounds/bg-clubroom.webp"
        />,
      );
      const overlay = screen.getByTestId('dialogue-bg-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  // ── P1-04: 立ち絵表示 ────────────────────────────
  describe('立ち絵表示', () => {
    it('portrait ありのキャラクターは立ち絵が表示される', () => {
      render(
        <DialogueOverlay
          {...defaultProps}
          characters={testCharactersWithPortrait}
        />,
      );
      const portrait = screen.getByTestId('dialogue-portrait');
      expect(portrait).toBeInTheDocument();
      expect(portrait.tagName).toBe('IMG');
      expect(portrait).toHaveAttribute('src', '/assets/portraits/hiro-normal.png');
    });

    it('portrait なしのキャラクターはアイコン（CharacterAvatar）にフォールバックする', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 立ち絵は表示されない
      expect(screen.queryByTestId('dialogue-portrait')).not.toBeInTheDocument();
    });

    it('expression が happy の場合は happy の立ち絵が表示される', () => {
      const dialoguesWithExpression: Dialogue[] = [
        { characterId: 'hiro', text: 'やったぜ！', expression: 'happy' },
      ];
      render(
        <DialogueOverlay
          {...defaultProps}
          dialogues={dialoguesWithExpression}
          characters={testCharactersWithPortrait}
        />,
      );
      const portrait = screen.getByTestId('dialogue-portrait');
      expect(portrait).toHaveAttribute('src', '/assets/portraits/hiro-happy.png');
    });

    it('expression 省略時は normal の立ち絵が表示される', () => {
      const dialoguesNoExpression: Dialogue[] = [
        { characterId: 'hiro', text: 'やあ。' },
      ];
      render(
        <DialogueOverlay
          {...defaultProps}
          dialogues={dialoguesNoExpression}
          characters={testCharactersWithPortrait}
        />,
      );
      const portrait = screen.getByTestId('dialogue-portrait');
      expect(portrait).toHaveAttribute('src', '/assets/portraits/hiro-normal.png');
    });

    it('同キャラの表情切り替えは即時（フェードなし）', () => {
      const dialoguesExprChange: Dialogue[] = [
        { characterId: 'hiro', text: 'やあ。' },
        { characterId: 'hiro', text: 'やったぜ！', expression: 'happy' },
      ];
      render(
        <DialogueOverlay
          {...defaultProps}
          dialogues={dialoguesExprChange}
          characters={testCharactersWithPortrait}
        />,
      );
      // 最初は normal
      const portrait = screen.getByTestId('dialogue-portrait');
      expect(portrait).toHaveAttribute('src', '/assets/portraits/hiro-normal.png');

      // 1つ目を完了 → 2つ目（同キャラ、happy）へ
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 同キャラ表情切り替えは即時 — opacity が 1 のまま
      const updatedPortrait = screen.getByTestId('dialogue-portrait');
      expect(updatedPortrait).toHaveAttribute('src', '/assets/portraits/hiro-happy.png');
      expect(updatedPortrait.style.opacity).toBe('1');
      expect(updatedPortrait.style.transition).toBe('');
    });

    it('キャラ変更時に立ち絵が切り替わる', () => {
      render(
        <DialogueOverlay
          {...defaultProps}
          characters={testCharactersWithPortrait}
        />,
      );
      // 最初はヒロの立ち絵
      expect(screen.getByTestId('dialogue-portrait')).toHaveAttribute(
        'src',
        '/assets/portraits/hiro-normal.png',
      );

      // 1つ目を完了 → 2つ目（同じヒロ）
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      act(() => { jest.advanceTimersByTime(30 * 20); });

      // 2つ目を完了 → 3つ目（アキラ）へ
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      act(() => { jest.advanceTimersByTime(30 * 1); });
      expect(screen.getByTestId('dialogue-portrait')).toHaveAttribute(
        'src',
        '/assets/portraits/akira-normal.png',
      );
    });
  });

  // ── P1-04: テキストウィンドウ ─────────────────────
  describe('テキストウィンドウ', () => {
    it('テキストウィンドウが半透明パネルで表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      const textWindow = screen.getByTestId('dialogue-text-window');
      expect(textWindow).toBeInTheDocument();
    });
  });
});
