/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — オーディオテスト
 */
import { createAudio } from '../core/audio';

/** AudioContext モック */
function createMockAudioContext() {
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
    buffer: null,
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

describe('audio モジュール', () => {
  let G;
  let audio;
  let mockAC;

  beforeEach(() => {
    mockAC = createMockAudioContext();
    (window as any).AudioContext = jest.fn().mockReturnValue(mockAC);
    (window as any).webkitAudioContext = undefined;

    G = {
      state: 'cave',
      hitStop: 0,
      bgmBeat: 0,
      cav: { won: false },
      grs: { won: false },
      bos: { won: false },
    };
    audio = createAudio(G);
  });

  afterEach(() => {
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;
  });

  describe('ea()', () => {
    it('AudioContextが生成される', () => {
      audio.ea();
      expect((window as any).AudioContext).toHaveBeenCalled();
    });

    it('2回目の呼び出しで新規AudioContextを生成しない', () => {
      audio.ea();
      audio.ea();
      expect((window as any).AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('tn()', () => {
    it('AudioContext未初期化時は何もしない', () => {
      audio.tn(440, 0.1);
      expect(mockAC.createOscillator).not.toHaveBeenCalled();
    });

    it('オシレータが生成される', () => {
      audio.ea();
      audio.tn(440, 0.1);
      expect(mockAC.createOscillator).toHaveBeenCalled();
      expect(mockAC._oscillator.connect).toHaveBeenCalled();
      expect(mockAC._oscillator.start).toHaveBeenCalled();
      expect(mockAC._oscillator.stop).toHaveBeenCalled();
    });
  });

  describe('noise()', () => {
    it('バッファソースが生成される', () => {
      audio.ea();
      audio.noise(0.1);
      expect(mockAC.createBufferSource).toHaveBeenCalled();
      expect(mockAC._bufferSource.connect).toHaveBeenCalled();
      expect(mockAC._bufferSource.start).toHaveBeenCalled();
      expect(mockAC._bufferSource.stop).toHaveBeenCalled();
    });
  });

  describe('S.tick()', () => {
    it('tnを呼び出す', () => {
      audio.ea();
      audio.S.tick();
      expect(mockAC.createOscillator).toHaveBeenCalled();
    });
  });

  describe('S.hit()', () => {
    it('複数音が生成される（tn + noise）', () => {
      audio.ea();
      audio.S.hit();
      // hit() は tn を2回 + noise を1回呼ぶ
      expect(mockAC.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockAC.createBufferSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('bgmTick()', () => {
    it('caveステートでトーンが生成される', () => {
      audio.ea();
      G.state = 'cave';
      G.bgmBeat = 0;
      audio.bgmTick();
      // bgmBeat=1, 1%4!==0, 1%8!==0, 1%16!==0 なのでトーンなし
      // bgmBeat をリセットして4の倍数にする
      G.bgmBeat = 3;
      audio.bgmTick();
      // bgmBeat=4, 4%4===0 なのでトーンあり
      expect(mockAC.createOscillator).toHaveBeenCalled();
    });

    it('勝利シーケンス中は無音', () => {
      audio.ea();
      G.state = 'cave';
      G.cav.won = true;
      const callsBefore = mockAC.createOscillator.mock.calls.length;
      audio.bgmTick();
      expect(mockAC.createOscillator.mock.calls.length).toBe(callsBefore);
    });
  });
});
