/**
 * 原始進化録 - PRIMAL PATH - AudioEngine.cleanup() テスト
 *
 * ページ遷移時に BGM が確実に停止するための cleanup メソッドをテストする。
 * Non-Brake Descent の Audio.cleanup() パターンに準拠。
 */
describe('AudioEngine.cleanup()', () => {
  let mockClose: jest.Mock;
  let mockResume: jest.Mock;
  let mockAudioContext: {
    createOscillator: jest.Mock;
    createGain: jest.Mock;
    destination: object;
    currentTime: number;
    state: string;
    close: jest.Mock;
    resume: jest.Mock;
  };
  let mockOscillator: {
    connect: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
    disconnect: jest.Mock;
    frequency: { setValueAtTime: jest.Mock };
    type: string;
    onended: (() => void) | null;
  };
  let mockGainNode: {
    connect: jest.Mock;
    disconnect: jest.Mock;
    gain: { setValueAtTime: jest.Mock; linearRampToValueAtTime: jest.Mock };
  };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    mockClose = jest.fn().mockResolvedValue(undefined);
    mockResume = jest.fn().mockResolvedValue(undefined);

    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
      frequency: { setValueAtTime: jest.fn() },
      type: 'sine',
      onended: null,
    };
    mockGainNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
    };
    mockAudioContext = {
      createOscillator: jest.fn(() => ({ ...mockOscillator })),
      createGain: jest.fn(() => ({ ...mockGainNode })),
      destination: {},
      currentTime: 0,
      state: 'running',
      close: mockClose,
      resume: mockResume,
    };

    (globalThis as unknown as { AudioContext: unknown }).AudioContext = jest.fn(
      () => mockAudioContext,
    );
  });

  afterEach(async () => {
    // テスト後の安全な後片付け
    try {
      const { BgmEngine } = await import('../audio');
      BgmEngine.stop();
    } catch {
      /* ignore */
    }
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it('cleanup() 呼び出し後に BGM が停止する', async () => {
    // Arrange: BGM を再生
    const { AudioEngine, BgmEngine } = await import('../audio');
    AudioEngine.init();
    BgmEngine.play('grassland');
    expect(BgmEngine.isPlaying()).toBe(true);

    // Act: cleanup を実行
    AudioEngine.cleanup();

    // Assert: BGM が停止している
    expect(BgmEngine.isPlaying()).toBe(false);
    expect(BgmEngine.getCurrentType()).toBeNull();
  });

  it('cleanup() 呼び出し後に setInterval がクリアされる', async () => {
    // Arrange: BGM を再生（setInterval が動いている状態）
    const { AudioEngine, BgmEngine } = await import('../audio');
    AudioEngine.init();
    BgmEngine.play('grassland');

    // Act: cleanup を実行
    AudioEngine.cleanup();

    // Assert: タイマーを進めても新しい音が再生されない
    const callCountBefore = mockAudioContext.createOscillator.mock.calls.length;
    jest.advanceTimersByTime(5000);
    const callCountAfter = mockAudioContext.createOscillator.mock.calls.length;
    expect(callCountAfter).toBe(callCountBefore);
  });

  it('cleanup() 呼び出し後に AudioContext.close() が呼ばれる', async () => {
    // Arrange: AudioContext を初期化
    const { AudioEngine } = await import('../audio');
    AudioEngine.init();

    // Act: cleanup を実行
    AudioEngine.cleanup();

    // Assert: close() が呼ばれている
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('cleanup() を複数回呼んでもエラーにならない', async () => {
    // Arrange: AudioContext を初期化
    const { AudioEngine } = await import('../audio');
    AudioEngine.init();

    // Act & Assert: 複数回 cleanup を呼んでも例外が発生しない
    expect(() => {
      AudioEngine.cleanup();
      AudioEngine.cleanup();
      AudioEngine.cleanup();
    }).not.toThrow();
  });

  it('cleanup() 後に init() で新しい AudioContext が生成される', async () => {
    // Arrange: 初期化して cleanup
    const { AudioEngine } = await import('../audio');
    const AudioContextMock = (globalThis as unknown as { AudioContext: jest.Mock }).AudioContext;
    AudioEngine.init();
    expect(AudioContextMock).toHaveBeenCalledTimes(1);

    AudioEngine.cleanup();

    // Act: 再度初期化
    AudioEngine.init();

    // Assert: 新しい AudioContext が生成されている（コンストラクタが2回目の呼び出し）
    expect(AudioContextMock).toHaveBeenCalledTimes(2);
  });

  it('cleanup() 後に再度 BGM を正常に再生できる', async () => {
    // Arrange: BGM を再生して cleanup
    const { AudioEngine, BgmEngine } = await import('../audio');
    AudioEngine.init();
    BgmEngine.play('grassland');
    AudioEngine.cleanup();
    expect(BgmEngine.isPlaying()).toBe(false);

    // Act: 再度初期化して BGM 再生
    AudioEngine.init();
    BgmEngine.play('volcano');

    // Assert: BGM が正常に再生されている
    expect(BgmEngine.isPlaying()).toBe(true);
    expect(BgmEngine.getCurrentType()).toBe('volcano');
  });
});
