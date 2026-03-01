/**
 * audio-cleanup ユーティリティのテスト
 *
 * モジュールレベルの状態（trackedContexts, isInstalled）を
 * テスト間で分離するため、jest.resetModules() を使用して
 * 各テストで新しいモジュールインスタンスを取得する。
 */

// AudioContext のモック生成ヘルパー
const createMockAudioContext = (
  state: AudioContextState = 'running'
): AudioContext => {
  return {
    state,
    suspend: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as AudioContext;
};

// モジュールの型定義
type AudioCleanupModule = typeof import('./audio-cleanup');

/** テスト用にモジュールを新しく読み込む */
const loadFreshModule = (): AudioCleanupModule => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./audio-cleanup') as AudioCleanupModule;
};

describe('audio-cleanup', () => {
  // オリジナルの AudioContext を保持
  const OriginalAudioContext = window.AudioContext;

  beforeEach(() => {
    // モジュールキャッシュをリセットして状態を分離
    jest.resetModules();
    // AudioContext をオリジナルに戻す
    window.AudioContext = OriginalAudioContext;
  });

  afterEach(() => {
    window.AudioContext = OriginalAudioContext;
  });

  describe('installAudioContextTracker', () => {
    it('AudioContext コンストラクタを Proxy で上書きする', () => {
      // Arrange: jsdom には AudioContext がないためモックを設定
      const MockCtor = jest.fn() as unknown as typeof AudioContext;
      window.AudioContext = MockCtor;
      const { installAudioContextTracker } = loadFreshModule();

      // Act
      installAudioContextTracker();

      // Assert: コンストラクタが上書きされている
      expect(window.AudioContext).not.toBe(MockCtor);
    });

    it('Proxy 経由で生成された AudioContext が正常に動作する', () => {
      // Arrange
      const mockInstance = createMockAudioContext();
      const MockCtor = jest.fn().mockImplementation(() => mockInstance);
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker } = loadFreshModule();

      // Act
      installAudioContextTracker();
      const ctx = new window.AudioContext();

      // Assert: インスタンスが正常に返される
      expect(ctx).toBe(mockInstance);
      expect(MockCtor).toHaveBeenCalledTimes(1);
    });

    it('多重呼び出しを防止する（二重プロキシにならない）', () => {
      // Arrange
      const mockInstance = createMockAudioContext();
      const MockCtor = jest.fn().mockImplementation(() => mockInstance);
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker } = loadFreshModule();

      // Act: 2回呼び出し
      installAudioContextTracker();
      const afterFirstInstall = window.AudioContext;
      installAudioContextTracker();
      const afterSecondInstall = window.AudioContext;

      // Assert: 2回目の呼び出しではコンストラクタが変わらない
      expect(afterFirstInstall).toBe(afterSecondInstall);
    });

    it('生成された AudioContext が追跡される（stopAllAudio で停止される）', async () => {
      // Arrange
      const mockInstance = createMockAudioContext('running');
      const MockCtor = jest.fn().mockImplementation(() => mockInstance);
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker, stopAllAudio } = loadFreshModule();

      // Act: トラッカーをインストールし AudioContext を生成
      installAudioContextTracker();
      new window.AudioContext();

      // Assert: stopAllAudio で suspend が呼ばれる（close は呼ばない）
      await stopAllAudio();
      expect(mockInstance.suspend).toHaveBeenCalledTimes(1);
      expect(mockInstance.close).not.toHaveBeenCalled();
    });
  });

  describe('stopAllAudio', () => {
    it('追跡中の全 AudioContext を suspend する（close しない）', async () => {
      // Arrange
      const ctx1 = createMockAudioContext('running');
      const ctx2 = createMockAudioContext('running');
      let callCount = 0;
      const MockCtor = jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? ctx1 : ctx2;
      });
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker, stopAllAudio } = loadFreshModule();

      installAudioContextTracker();
      new window.AudioContext();
      new window.AudioContext();

      // Act
      await stopAllAudio();

      // Assert: suspend のみ、close は呼ばない
      expect(ctx1.suspend).toHaveBeenCalledTimes(1);
      expect(ctx1.close).not.toHaveBeenCalled();
      expect(ctx2.suspend).toHaveBeenCalledTimes(1);
      expect(ctx2.close).not.toHaveBeenCalled();
    });

    it('state が running でない AudioContext はスキップする', async () => {
      // Arrange
      const suspendedCtx = createMockAudioContext('suspended');
      const closedCtx = createMockAudioContext('closed');
      let callCount = 0;
      const MockCtor = jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? suspendedCtx : closedCtx;
      });
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker, stopAllAudio } = loadFreshModule();

      installAudioContextTracker();
      new window.AudioContext();
      new window.AudioContext();

      // Act
      await stopAllAudio();

      // Assert: running でないので suspend は呼ばれない
      expect(suspendedCtx.suspend).not.toHaveBeenCalled();
      expect(closedCtx.suspend).not.toHaveBeenCalled();
    });

    it('再度呼んでも同じインスタンスを再 suspend できる', async () => {
      // Arrange: state を動的に変更可能なモック
      let currentState: AudioContextState = 'running';
      const ctx = {
        get state() {
          return currentState;
        },
        suspend: jest.fn().mockImplementation(async () => {
          currentState = 'suspended';
        }),
        close: jest.fn().mockResolvedValue(undefined),
      } as unknown as AudioContext;
      const MockCtor = jest.fn().mockImplementation(() => ctx);
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker, stopAllAudio } = loadFreshModule();

      installAudioContextTracker();
      new window.AudioContext();

      // Act: 1回目の停止
      await stopAllAudio();
      expect(ctx.suspend).toHaveBeenCalledTimes(1);

      // ゲーム側が resume して running に戻るシナリオ
      currentState = 'running';

      // Act: 2回目の停止
      await stopAllAudio();
      expect(ctx.suspend).toHaveBeenCalledTimes(2);
    });

    it('suspend がエラーを投げても安全に処理する', async () => {
      // Arrange
      const errorCtx = {
        state: 'running' as AudioContextState,
        suspend: jest.fn().mockRejectedValue(new Error('suspend failed')),
        close: jest.fn().mockResolvedValue(undefined),
      } as unknown as AudioContext;
      const MockCtor = jest.fn().mockImplementation(() => errorCtx);
      window.AudioContext = MockCtor as unknown as typeof AudioContext;
      const { installAudioContextTracker, stopAllAudio } = loadFreshModule();

      installAudioContextTracker();
      new window.AudioContext();

      // Act & Assert: エラーが伝播しない
      await expect(stopAllAudio()).resolves.not.toThrow();
    });

    it('Tone.js が利用可能な場合に Transport を停止する', async () => {
      // Arrange: Tone.js モジュールをモック
      const mockTransport = {
        stop: jest.fn(),
        cancel: jest.fn(),
      };
      jest.doMock('tone', () => ({
        getTransport: () => mockTransport,
      }));
      const { stopAllAudio } = loadFreshModule();

      // Act
      await stopAllAudio();

      // Assert
      expect(mockTransport.stop).toHaveBeenCalledTimes(1);
      expect(mockTransport.cancel).toHaveBeenCalledTimes(1);
    });

    it('Tone.js が利用不可でもエラーにならない', async () => {
      // Arrange: Tone.js が import できない場合をシミュレート
      jest.doMock('tone', () => {
        throw new Error('Cannot find module tone');
      });
      const { stopAllAudio } = loadFreshModule();

      // Act & Assert: エラーが伝播しない
      await expect(stopAllAudio()).resolves.not.toThrow();
    });

    it('トラッカー未インストール時でも安全に動作する', async () => {
      // Arrange: installAudioContextTracker を呼ばずに stopAllAudio を呼ぶ
      const { stopAllAudio } = loadFreshModule();

      // Act & Assert: エラーが伝播しない
      await expect(stopAllAudio()).resolves.not.toThrow();
    });
  });
});
