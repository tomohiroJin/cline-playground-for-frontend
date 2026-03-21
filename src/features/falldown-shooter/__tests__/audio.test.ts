// Audio モジュールのテスト

/** OscillatorNode のモック型 */
interface MockOscillatorNode {
  connect: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  type: string;
  frequency: { value: number };
}

/** GainNode のモック型 */
interface MockGainNode {
  connect: jest.Mock;
  gain: {
    setValueAtTime: jest.Mock;
    exponentialRampToValueAtTime: jest.Mock;
  };
}

/** AudioContext のモック型 */
interface MockAudioContext {
  createOscillator: jest.Mock;
  createGain: jest.Mock;
  currentTime: number;
  destination: Record<string, never>;
  state: string;
  resume: jest.Mock;
}

describe('Audio', () => {
  let mockOscillator: MockOscillatorNode;
  let mockGain: MockGainNode;
  let mockAudioContext: MockAudioContext;

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
    // Arrange
    const { Audio } = await import('../audio');

    // Act
    Audio.shoot();

    // Assert
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('hit が音を再生すること', async () => {
    // Arrange
    const { Audio } = await import('../audio');

    // Act
    Audio.hit();

    // Assert
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('land が音を再生すること', async () => {
    // Arrange
    const { Audio } = await import('../audio');

    // Act
    Audio.land();

    // Assert
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('bomb が音を再生すること', async () => {
    // Arrange
    const { Audio } = await import('../audio');

    // Act
    Audio.bomb();

    // Assert
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('AudioContext 未対応の場合に警告を出すこと', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    Object.defineProperty(window, 'AudioContext', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // webkitAudioContext も未定義に
    const win = window as unknown as Record<string, unknown>;
    delete win.webkitAudioContext;

    // Act
    const { Audio } = await import('../audio');
    Audio.shoot();

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Web Audio API')
    );

    consoleSpy.mockRestore();
  });

  test('suspended 状態で resume が呼ばれること', async () => {
    // Arrange
    mockAudioContext.state = 'suspended';

    // Act
    const { Audio } = await import('../audio');
    Audio.shoot();

    // Assert
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});
