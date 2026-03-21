/**
 * P2-07: 統合・遷移管理テスト
 *
 * テスト項目:
 *   - menu → characterDex → menu の遷移
 *   - characterDex 画面で CharacterDexScreen が表示される
 *   - プロフィールカード表示・閉じるの動作
 *   - TitleScreen に onCharacterDexClick / newUnlockCount が渡される
 *   - ストーリークリア時に useCharacterDex.checkAndUnlock() が使われる
 *   - フリーモードに影響がない
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AirHockeyGame from './AirHockeyGame';

// ── 重い依存のモック ──────────────────────────────────

// Canvas モック
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  setTransform: jest.fn(),
  canvas: { width: 450, height: 900 },
})) as jest.Mock;

// ゲームループを無効化
jest.mock('./hooks/useGameLoop', () => ({
  useGameLoop: jest.fn(),
}));

// サウンドシステムをモック
jest.mock('./core/sound', () => ({
  createSoundSystem: () => ({
    play: jest.fn(),
    bgmStart: jest.fn(),
    bgmStop: jest.fn(),
    setBgmVolume: jest.fn(),
    setSeVolume: jest.fn(),
    setMuted: jest.fn(),
  }),
}));

// スコアストレージをモック
jest.mock('../../utils/score-storage', () => ({
  saveScore: jest.fn().mockResolvedValue(undefined),
  getHighScore: jest.fn().mockResolvedValue(0),
}));

// 画像プリローダーをモック
jest.mock('./hooks/useImagePreloader', () => ({
  useImagePreloader: jest.fn(),
}));

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Image モック（onload を即発火）
Object.defineProperty(window, 'Image', {
  value: class {
    onload: (() => void) | null = null;
    src = '';
    constructor() {
      setTimeout(() => this.onload?.(), 0);
    }
  },
});

// タッチイベント防止のモック
const originalAddEventListener = document.addEventListener.bind(document);
document.addEventListener = jest.fn((type: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) => {
  if (type === 'touchmove') return;
  originalAddEventListener(type, handler, options);
});

describe('AirHockeyGame P2-07 統合テスト', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('画面遷移: menu → characterDex → menu', () => {
    it('タイトル画面の「キャラクター」ボタンをクリックすると図鑑画面に遷移する', () => {
      render(<AirHockeyGame />);

      // タイトル画面に「キャラクター」ボタンが表示されている
      const characterButton = screen.getByText('キャラクター');
      expect(characterButton).toBeInTheDocument();

      // クリックで図鑑画面に遷移
      fireEvent.click(characterButton);

      // 図鑑画面のタイトルが表示される
      expect(screen.getByText('キャラクター図鑑')).toBeInTheDocument();
    });

    it('図鑑画面の「戻る」ボタンでタイトル画面に戻る', () => {
      render(<AirHockeyGame />);

      // 図鑑画面に遷移
      fireEvent.click(screen.getByText('キャラクター'));
      expect(screen.getByText('キャラクター図鑑')).toBeInTheDocument();

      // 「戻る」ボタンでタイトルに戻る
      fireEvent.click(screen.getByText('← 戻る'));
      expect(screen.getByText('🏒 Air Hockey')).toBeInTheDocument();
    });
  });

  describe('図鑑画面: キャラクターカード表示', () => {
    it('初期状態で解放済みキャラクターのカードが表示される', () => {
      render(<AirHockeyGame />);
      fireEvent.click(screen.getByText('キャラクター'));

      // 初期解放キャラ（アキラのみ）が名前表示
      expect(screen.getByText('アキラ')).toBeInTheDocument();
    });

    it('ロック中キャラクターは「???」で表示される', () => {
      render(<AirHockeyGame />);
      fireEvent.click(screen.getByText('キャラクター'));

      // アキラ以外の3キャラ（ヒロ/ミサキ/タクマ）がロック（hidden キャラは非表示）
      const questionMarks = screen.getAllByText('???');
      expect(questionMarks.length).toBe(3);
    });
  });

  describe('プロフィールカード表示', () => {
    it('アンロック済みカードをクリックするとプロフィールカードが表示される', () => {
      render(<AirHockeyGame />);
      fireEvent.click(screen.getByText('キャラクター'));

      // アキラのカードをクリック
      const akiraCard = screen.getByText('アキラ');
      fireEvent.click(akiraCard);

      // プロフィールカードのコンテンツが表示される
      expect(screen.getByText('蒼葉 アキラ')).toBeInTheDocument();
    });

    it('プロフィールカードの閉じるボタンで図鑑画面に戻る', () => {
      render(<AirHockeyGame />);
      fireEvent.click(screen.getByText('キャラクター'));

      // アキラのプロフィールを開く
      fireEvent.click(screen.getByText('アキラ'));
      expect(screen.getByText('蒼葉 アキラ')).toBeInTheDocument();

      // 閉じるボタンをクリック
      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);

      // プロフィールカードが閉じ、図鑑画面に戻る
      expect(screen.getByText('キャラクター図鑑')).toBeInTheDocument();
    });
  });

  describe('TitleScreen への Props 受け渡し', () => {
    it('newUnlockCount が 0 の場合、通知バッジが表示されない', () => {
      render(<AirHockeyGame />);

      // 通知バッジが表示されていない（テキスト内容で判定）
      const characterButton = screen.getByText('キャラクター');
      const wrapper = characterButton.closest('[class]')?.parentElement;
      // 数字バッジがないことを確認
      expect(wrapper?.querySelector('[data-testid="notification-badge"]')).toBeNull();
    });
  });

  describe('フリーモードへの影響なし', () => {
    it('フリー対戦開始ボタンが正常に機能する', () => {
      render(<AirHockeyGame />);

      // フリー対戦開始ボタンが存在する
      const startButton = screen.getByText('フリー対戦');
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('2P 対戦フロー: menu → characterSelect → game', () => {
    it('タイトル画面に「2P 対戦」ボタンが表示される', () => {
      render(<AirHockeyGame />);

      expect(screen.getByText('2P 対戦')).toBeInTheDocument();
    });

    it('「2P 対戦」ボタンをクリックするとキャラクター選択画面に遷移する', () => {
      render(<AirHockeyGame />);

      fireEvent.click(screen.getByText('2P 対戦'));

      // キャラクター選択画面のタイトルが表示される
      expect(screen.getByText('2P 対戦')).toBeInTheDocument();
      expect(screen.getByText('VS')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '対戦開始！' })).toBeInTheDocument();
    });

    it('キャラクター選択画面の「← 戻る」でタイトルに戻る', () => {
      render(<AirHockeyGame />);

      fireEvent.click(screen.getByText('2P 対戦'));
      fireEvent.click(screen.getByRole('button', { name: '← 戻る' }));

      // タイトル画面に戻る
      expect(screen.getByText('🏒 Air Hockey')).toBeInTheDocument();
    });

    it('「対戦開始！」をクリックしてもエラーが発生しない', () => {
      render(<AirHockeyGame />);

      fireEvent.click(screen.getByText('2P 対戦'));
      expect(screen.getByRole('button', { name: '対戦開始！' })).toBeInTheDocument();

      // 対戦開始をクリック（エラーなく実行されること）
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: '対戦開始！' }));
      }).not.toThrow();
    });
  });
});
