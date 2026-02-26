// Audio モジュールのテスト

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('Audio', () => {
  let mockOscillator: Record<string, any>;
  let mockGain: Record<string, any>;
  let mockAudioContext: Record<string, any>;

  beforeEach(() => {
    // AudioContext のモックを設定
    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      type: '',
      frequency: { value: 0 },
    };

    mockGain = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockAudioContext = {
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGain),
      currentTime: 0,
      destination: {},
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined),
    };

    // window.AudioContext を設定
    Object.defineProperty(window, 'AudioContext', {
      value: jest.fn(() => mockAudioContext),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('shoot が音を再生すること', async () => {
    // モジュールを新しくインポート（シングルトンリセット）
    const { Audio } = await import('../audio');
    Audio.shoot();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('hit が音を再生すること', async () => {
    const { Audio } = await import('../audio');
    Audio.hit();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('land が音を再生すること', async () => {
    const { Audio } = await import('../audio');
    Audio.land();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('bomb が音を再生すること', async () => {
    const { Audio } = await import('../audio');
    Audio.bomb();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('AudioContext 未対応の場合に警告を出すこと', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // webkitAudioContext も未定義に
    const win = window as unknown as Record<string, unknown>;
    delete win.webkitAudioContext;

    const { Audio } = await import('../audio');
    Audio.shoot();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Web Audio API')
    );

    consoleSpy.mockRestore();
  });

  test('suspended 状態で resume が呼ばれること', async () => {
    mockAudioContext.state = 'suspended';
    const { Audio } = await import('../audio');
    Audio.shoot();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});
