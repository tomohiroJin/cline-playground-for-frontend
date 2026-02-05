import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IpnePage, { ClearScreen } from './IpnePage';

// Audio APIのモック
jest.mock('../features/ipne/audio', () => ({
  enableAudio: jest.fn().mockResolvedValue(true),
  isAudioInitialized: jest.fn().mockReturnValue(true),
  initializeAudioSettings: jest.fn().mockReturnValue({
    masterVolume: 0.7,
    seVolume: 0.8,
    bgmVolume: 0.5,
    isMuted: false,
  }),
  getAudioSettings: jest.fn().mockReturnValue({
    masterVolume: 0.7,
    seVolume: 0.8,
    bgmVolume: 0.5,
    isMuted: false,
  }),
  setMasterVolume: jest.fn(),
  setSeVolume: jest.fn(),
  setBgmVolume: jest.fn(),
  toggleMute: jest.fn(),
  playTitleBgm: jest.fn(),
  playGameBgm: jest.fn(),
  playClearJingle: jest.fn(),
  playGameOverJingle: jest.fn(),
  stopBgm: jest.fn(),
  playPlayerDamageSound: jest.fn(),
  playEnemyKillSound: jest.fn(),
  playBossKillSound: jest.fn(),
  playGameClearSound: jest.fn(),
  playGameOverSound: jest.fn(),
  playLevelUpSound: jest.fn(),
  playAttackHitSound: jest.fn(),
  playItemPickupSound: jest.fn(),
  playHealSound: jest.fn(),
  playTrapTriggeredSound: jest.fn(),
}));

// requestAnimationFrameのモック（無限ループを防ぐため、コールバックは非同期で実行しない）
let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;

// Canvasコンテキストのモック
const mockCanvasContext = {
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  quadraticCurveTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  closePath: jest.fn(),
  setLineDash: jest.fn(),
  getLineDash: jest.fn(() => []),
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  drawImage: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createPattern: jest.fn(),
  clip: jest.fn(),
  isPointInPath: jest.fn(),
  isPointInStroke: jest.fn(),
  rect: jest.fn(),
  ellipse: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  canvas: { width: 800, height: 600 },
};

beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    rafId++;
    rafCallbacks.push(cb);
    // コールバックは即座に実行せず、IDだけを返す
    return rafId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

  // Canvas getContextのモック
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext) as jest.Mock;
});

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('IpnePage', () => {
  // タップして音声を有効化してから「ゲームを開始」ボタンを取得するヘルパー
  const enableAudioAndGetStartButton = async () => {
    // 「タップしてゲームを開始」をクリックして音声を有効化
    const tapMessage = screen.getByText(/タップしてゲームを開始/i);
    fireEvent.click(tapMessage);

    // 音声有効化後、「ゲームを開始」ボタンが表示される
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ゲームを開始/i })).toBeInTheDocument();
    });
    return screen.getByRole('button', { name: /ゲームを開始/i });
  };

  describe('タイトル画面', () => {
    test('タイトル画面が正しく表示されること（音声未有効時はタップメッセージが表示される）', () => {
      render(<IpnePage />);
      expect(screen.getByText(/タップしてゲームを開始/i)).toBeInTheDocument();
    });

    test('タップして音声を有効化すると「ゲームを開始」ボタンが表示されること', async () => {
      render(<IpnePage />);
      await enableAudioAndGetStartButton();
      expect(screen.getByRole('button', { name: /ゲームを開始/i })).toBeInTheDocument();
    });

    test('ゲーム開始ボタンをクリックすると職業選択画面に遷移すること', async () => {
      render(<IpnePage />);
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /ゲームを開始/i })).not.toBeInTheDocument();
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });
    });
  });

  describe('職業選択画面', () => {
    test('職業選択画面で2つの職業カードが表示されること', async () => {
      render(<IpnePage />);
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/戦士/i)).toBeInTheDocument();
        expect(screen.getByText(/盗賊/i)).toBeInTheDocument();
      });
    });

    test('職業を選択して開始するとプロローグ画面に遷移すること', async () => {
      render(<IpnePage />);
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });

      // 戦士を選択
      fireEvent.click(screen.getByText(/戦士/i));
      // 開始ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: /この職業で開始/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
    });
  });

  describe('プロローグ画面', () => {
    test('プロローグ画面でスキップボタンが表示されること', async () => {
      render(<IpnePage />);
      // タイトル→職業選択→プロローグへ遷移
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/戦士/i));
      fireEvent.click(screen.getByRole('button', { name: /この職業で開始/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
    });
  });

  describe('ゲーム画面', () => {
    test('ゲーム画面にCanvasが表示されること', async () => {
      render(<IpnePage />);
      // タイトル→職業選択→プロローグ→ゲームへ遷移
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);
      await waitFor(() => {
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/戦士/i));
      fireEvent.click(screen.getByRole('button', { name: /この職業で開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /ゲーム画面/i })).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    test('ゲーム領域に適切なaria属性が設定されていること', async () => {
      render(<IpnePage />);
      // タイトル→職業選択→プロローグ→ゲームへ遷移
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);
      await waitFor(() => {
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/戦士/i));
      fireEvent.click(screen.getByRole('button', { name: /この職業で開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));

      await waitFor(() => {
        const gameRegion = screen.getByRole('region', { name: /ゲーム/i });
        expect(gameRegion).toBeInTheDocument();
      });
    });
  });

  describe('画面遷移の状態初期化', () => {
    test('タイトルから開始した場合、正しく初期化されること', () => {
      render(<IpnePage />);

      // タイトル画面が表示される（タップメッセージで確認）
      expect(screen.getByText(/タップしてゲームを開始/i)).toBeInTheDocument();
    });

    test('プロローグをスキップ後、ゲーム画面が表示されること', async () => {
      render(<IpnePage />);

      // タイトル→職業選択
      const startButton = await enableAudioAndGetStartButton();
      fireEvent.click(startButton);
      await waitFor(() => {
        expect(screen.getByText(/職業を選択/i)).toBeInTheDocument();
      });

      // 職業選択→プロローグ
      fireEvent.click(screen.getByText(/盗賊/i));
      fireEvent.click(screen.getByRole('button', { name: /この職業で開始/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /スキップ/i })).toBeInTheDocument();
      });

      // プロローグ→ゲーム
      fireEvent.click(screen.getByRole('button', { name: /スキップ/i }));
      await waitFor(() => {
        expect(screen.getByRole('region', { name: /ゲーム/i })).toBeInTheDocument();
      });
    });
  });
});

describe('ClearScreen', () => {
  const defaultProps = {
    onRetry: jest.fn(),
    onBackToTitle: jest.fn(),
    clearTime: 180000, // 3分
    rating: 'b' as const,
    isNewBest: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('クリア画面が正しく表示されること', () => {
    render(<ClearScreen {...defaultProps} />);

    // 評価が表示される
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('リトライボタンが表示され、クリックでコールバックが呼ばれること', () => {
    const mockRetry = jest.fn();

    render(<ClearScreen {...defaultProps} onRetry={mockRetry} />);

    const retryButton = screen.getByRole('button', { name: /もう一度プレイ/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  test('タイトルに戻るボタンが表示され、クリックでコールバックが呼ばれること', () => {
    const mockBackToTitle = jest.fn();

    render(<ClearScreen {...defaultProps} onBackToTitle={mockBackToTitle} />);

    const backButton = screen.getByRole('button', { name: /タイトルに戻る/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockBackToTitle).toHaveBeenCalledTimes(1);
  });

  test('新記録の場合にNEW BESTバッジが表示されること', () => {
    render(<ClearScreen {...defaultProps} isNewBest={true} />);

    expect(screen.getByText(/NEW BEST/i)).toBeInTheDocument();
  });

  test('各評価ランクが正しく表示されること', () => {
    const { rerender } = render(<ClearScreen {...defaultProps} rating="s" />);
    expect(screen.getByText('S')).toBeInTheDocument();

    rerender(<ClearScreen {...defaultProps} rating="a" />);
    expect(screen.getByText('A')).toBeInTheDocument();

    rerender(<ClearScreen {...defaultProps} rating="c" />);
    expect(screen.getByText('C')).toBeInTheDocument();

    rerender(<ClearScreen {...defaultProps} rating="d" />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
