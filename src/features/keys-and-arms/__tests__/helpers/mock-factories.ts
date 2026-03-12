/**
 * KEYS & ARMS — テスト用モック生成ヘルパー
 *
 * 各テストで重複するモック生成ロジックを共通化する。
 */
import type { DrawingAPI } from '../../types/rendering';
import type { AudioModule, SoundEffects } from '../../types/audio';

/** Canvas 2D コンテキストのモックを生成 */
export function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    ellipse: jest.fn(),
    quadraticCurveTo: jest.fn(),
    setLineDash: jest.fn(),
    set lineDashOffset(_v: number) { /* noop */ },
  } as unknown as CanvasRenderingContext2D;
}

/** DrawingAPI のモックを生成 */
export function createMockDrawingAPI(ctx?: CanvasRenderingContext2D): DrawingAPI {
  const mockCtx = ctx ?? createMockCanvasContext();
  return {
    $: mockCtx,
    lcdFg: jest.fn().mockReturnValue('#1a2810'),
    lcdBg: jest.fn().mockReturnValue('rgba(80,92,64,0.14)'),
    circle: jest.fn(),
    circleS: jest.fn(),
    onFill: jest.fn(),
    onStroke: jest.fn(),
    R: jest.fn(),
    txt: jest.fn(),
    txtC: jest.fn(),
    px: jest.fn(),
    drawK: jest.fn(),
    iHeart: jest.fn(),
    iGem: jest.fn(),
    iSlime: jest.fn(),
    iGoblin: jest.fn(),
    iSkel: jest.fn(),
    iBoss: jest.fn(),
    iArmDown: jest.fn(),
    iArmUp: jest.fn(),
  };
}

/** AudioModule のモック（全メソッド no-op）を生成 */
export function createMockAudioModule(): AudioModule {
  const S: SoundEffects = {
    tick: jest.fn(),
    move: jest.fn(),
    grab: jest.fn(),
    hit: jest.fn(),
    kill: jest.fn(),
    pry: jest.fn(),
    guard: jest.fn(),
    clear: jest.fn(),
    over: jest.fn(),
    start: jest.fn(),
    warn: jest.fn(),
    steal: jest.fn(),
    shieldBreak: jest.fn(),
    gem: jest.fn(),
    zap: jest.fn(),
    set: jest.fn(),
    step: jest.fn(),
    ladder: jest.fn(),
    safe: jest.fn(),
    drip: jest.fn(),
    combo: jest.fn(),
    bossDie: jest.fn(),
  };

  return {
    ea: jest.fn(),
    tn: jest.fn(),
    noise: jest.fn(),
    bgmTick: jest.fn(),
    S,
  };
}

/** AudioContext のモックを生成 */
export interface MockAudioContext {
  currentTime: number;
  sampleRate: number;
  destination: Record<string, unknown>;
  createOscillator: jest.Mock;
  createGain: jest.Mock;
  createBufferSource: jest.Mock;
  createBuffer: jest.Mock;
  _oscillator: { type: string; frequency: { value: number }; connect: jest.Mock; start: jest.Mock; stop: jest.Mock };
  _gain: { gain: { value: number; setValueAtTime: jest.Mock; exponentialRampToValueAtTime: jest.Mock }; connect: jest.Mock };
  _bufferSource: { buffer: AudioBuffer | null; connect: jest.Mock; start: jest.Mock; stop: jest.Mock };
}

export function createMockAudioContext(): MockAudioContext {
  const mockGain = {
    gain: {
      value: 0,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  };

  const mockOscillator = {
    type: '',
    frequency: { value: 0 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  const mockBufferSource = {
    buffer: null as AudioBuffer | null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  const mockBuffer = {
    getChannelData: jest.fn().mockReturnValue(new Float32Array(100)),
  };

  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createOscillator: jest.fn().mockReturnValue(mockOscillator),
    createGain: jest.fn().mockReturnValue(mockGain),
    createBufferSource: jest.fn().mockReturnValue(mockBufferSource),
    createBuffer: jest.fn().mockReturnValue(mockBuffer),
    _oscillator: mockOscillator,
    _gain: mockGain,
    _bufferSource: mockBufferSource,
  };
}
