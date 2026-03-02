/**
 * 原始進化録 - PRIMAL PATH - BGM・SFX システムテスト
 */
import { BGM_PATTERNS, SFX_DEFS } from '../constants';
import type { BgmType, SfxType } from '../types';

describe('BGM システム', () => {
  describe('BGM_PATTERNS 定数', () => {
    const BGM_TYPES: BgmType[] = ['title', 'grassland', 'glacier', 'volcano'];

    it('4種類のBGMパターンが定義されている', () => {
      expect(Object.keys(BGM_PATTERNS)).toHaveLength(4);
    });

    it.each(BGM_TYPES)('"%s" パターンが存在する', (type) => {
      expect(BGM_PATTERNS[type]).toBeDefined();
    });

    it.each(BGM_TYPES)('"%s" パターンに必要なプロパティがある', (type) => {
      const pattern = BGM_PATTERNS[type];
      // 周波数配列
      expect(Array.isArray(pattern.notes)).toBe(true);
      expect(pattern.notes.length).toBeGreaterThan(0);
      // テンポ（ms）
      expect(typeof pattern.tempo).toBe('number');
      expect(pattern.tempo).toBeGreaterThan(0);
      // 波形タイプ
      expect(['sine', 'square', 'triangle', 'sawtooth']).toContain(pattern.wave);
      // 音量
      expect(typeof pattern.gain).toBe('number');
      expect(pattern.gain).toBeGreaterThan(0);
      expect(pattern.gain).toBeLessThanOrEqual(1);
    });

    it('バイオームごとに異なる周波数パターンを持つ', () => {
      const grassNotes = BGM_PATTERNS.grassland.notes;
      const glacierNotes = BGM_PATTERNS.glacier.notes;
      const volcanoNotes = BGM_PATTERNS.volcano.notes;

      // 少なくとも1つのバイオームで異なるノートがある
      const notesEqual = (a: readonly number[], b: readonly number[]) =>
        a.length === b.length && a.every((v, i) => v === b[i]);

      const allSame = notesEqual(grassNotes, glacierNotes) && notesEqual(glacierNotes, volcanoNotes);
      expect(allSame).toBe(false);
    });
  });

  describe('BgmEngine', () => {
    let mockAudioContext: {
      createOscillator: jest.Mock;
      createGain: jest.Mock;
      destination: object;
      currentTime: number;
    };
    let mockOscillator: {
      connect: jest.Mock;
      start: jest.Mock;
      stop: jest.Mock;
      frequency: { setValueAtTime: jest.Mock };
      type: string;
    };
    let mockGainNode: {
      connect: jest.Mock;
      gain: { setValueAtTime: jest.Mock; linearRampToValueAtTime: jest.Mock };
    };

    beforeEach(() => {
      jest.resetModules();

      mockOscillator = {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
        type: 'sine',
      };
      mockGainNode = {
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
        },
      };
      mockAudioContext = {
        createOscillator: jest.fn(() => mockOscillator),
        createGain: jest.fn(() => mockGainNode),
        destination: {},
        currentTime: 0,
      };

      // AudioContext モック
      (globalThis as unknown as { AudioContext: unknown }).AudioContext = jest.fn(() => mockAudioContext);
    });

    afterEach(async () => {
      // BgmEngine の setInterval を確実に停止（Jest がハングしないようにする）
      try {
        const { BgmEngine } = await import('../audio');
        BgmEngine.stop();
      } catch { /* ignore */ }
      jest.restoreAllMocks();
      delete (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
    });

    it('BgmEngine.play(type) でBGMが再生される', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();
      BgmEngine.play('grassland');

      // OscillatorNode が作成されていること
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('BgmEngine.stop() でBGMが停止する', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();
      BgmEngine.play('grassland');
      BgmEngine.stop();

      // 停止後は isPlaying が false
      expect(BgmEngine.isPlaying()).toBe(false);
    });

    it('BgmEngine.setVolume() で音量を変更できる', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();
      BgmEngine.setVolume(0.5);

      // 音量が 0〜1 の範囲内で設定される
      expect(BgmEngine.getVolume()).toBe(0.5);
    });

    it('BgmEngine.setVolume() は 0〜1 の範囲にクランプする', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();

      BgmEngine.setVolume(-0.5);
      expect(BgmEngine.getVolume()).toBe(0);

      BgmEngine.setVolume(1.5);
      expect(BgmEngine.getVolume()).toBe(1);
    });

    it('バイオーム切替時に play() を再度呼ぶと BGM が切り替わる', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();
      BgmEngine.play('grassland');
      BgmEngine.play('glacier');

      // 新しい BGM が再生中
      expect(BgmEngine.isPlaying()).toBe(true);
    });

    it('同じBGMタイプで play() を再度呼ぶとスキップされる', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();
      BgmEngine.play('grassland');
      const callCount = mockAudioContext.createOscillator.mock.calls.length;
      // 同じタイプで再度再生
      BgmEngine.play('grassland');
      // 新しい Oscillator が作成されていないこと
      expect(mockAudioContext.createOscillator.mock.calls.length).toBe(callCount);
    });

    it('getCurrentType() で再生中のBGMタイプを取得できる', async () => {
      const { BgmEngine } = await import('../audio');
      BgmEngine.init();

      expect(BgmEngine.getCurrentType()).toBeNull();
      BgmEngine.play('volcano');
      expect(BgmEngine.getCurrentType()).toBe('volcano');
      BgmEngine.stop();
      expect(BgmEngine.getCurrentType()).toBeNull();
    });
  });

  describe('SFX_DEFS 定数', () => {
    const EXPECTED_SFX: SfxType[] = [
      'hit', 'crit', 'kill', 'heal', 'evo', 'death', 'click', 'boss',
      'win', 'skFire', 'skHeal', 'skRage', 'skShield', 'synergy', 'event', 'achv',
      'plDmg', 'allyJoin', 'civUp', 'envDmg',
    ];

    it('20種類のSFXが定義されている（目標15種以上）', () => {
      expect(Object.keys(SFX_DEFS).length).toBeGreaterThanOrEqual(15);
      expect(Object.keys(SFX_DEFS)).toHaveLength(20);
    });

    it.each(EXPECTED_SFX)('"%s" SFX が定義されている', (type) => {
      expect(SFX_DEFS[type]).toBeDefined();
    });

    it.each(EXPECTED_SFX)('"%s" SFX に必要なプロパティがある', (type) => {
      const def = SFX_DEFS[type];
      // 周波数配列
      expect(Array.isArray(def.f)).toBe(true);
      expect(def.f.length).toBeGreaterThan(0);
      expect(def.f.every(freq => freq > 0)).toBe(true);
      // 周波数段階時間
      expect(def.fd).toBeGreaterThan(0);
      // ゲイン
      expect(def.g).toBeGreaterThan(0);
      expect(def.g).toBeLessThanOrEqual(1);
      // ゲイン減衰時間
      expect(def.gd).toBeGreaterThan(0);
      // 波形タイプ
      expect(['sine', 'square', 'triangle', 'sawtooth']).toContain(def.w);
    });

    it('ゲイン減衰時間は周波数段階時間より長い', () => {
      for (const [key, def] of Object.entries(SFX_DEFS)) {
        expect(def.gd).toBeGreaterThanOrEqual(def.fd);
      }
    });
  });

  describe('AudioEngine', () => {
    let mockAudioContext2: {
      createOscillator: jest.Mock;
      createGain: jest.Mock;
      destination: object;
      currentTime: number;
    };
    let mockOsc2: {
      connect: jest.Mock;
      start: jest.Mock;
      stop: jest.Mock;
      frequency: { setValueAtTime: jest.Mock; exponentialRampToValueAtTime: jest.Mock };
      type: string;
    };
    let mockGain2: {
      connect: jest.Mock;
      gain: { setValueAtTime: jest.Mock; exponentialRampToValueAtTime: jest.Mock };
    };

    beforeEach(() => {
      jest.resetModules();
      mockOsc2 = {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
        type: 'sine',
      };
      mockGain2 = {
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      };
      mockAudioContext2 = {
        createOscillator: jest.fn(() => mockOsc2),
        createGain: jest.fn(() => mockGain2),
        destination: {},
        currentTime: 0,
      };
      (globalThis as unknown as { AudioContext: unknown }).AudioContext = jest.fn(() => mockAudioContext2);
    });

    afterEach(() => {
      jest.restoreAllMocks();
      delete (globalThis as unknown as { AudioContext?: unknown }).AudioContext;
    });

    it('AudioEngine.play() で SFX が再生される', async () => {
      const { AudioEngine } = await import('../audio');
      AudioEngine.init();
      AudioEngine.play('hit');

      expect(mockAudioContext2.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext2.createGain).toHaveBeenCalled();
      expect(mockOsc2.start).toHaveBeenCalled();
      expect(mockOsc2.stop).toHaveBeenCalled();
    });

    it('AudioEngine.setSfxVolume() で音量を設定・取得できる', async () => {
      const { AudioEngine } = await import('../audio');
      AudioEngine.init();
      AudioEngine.setSfxVolume(0.75);
      expect(AudioEngine.getSfxVolume()).toBe(0.75);
    });

    it('AudioEngine.setSfxVolume() は 0〜1 にクランプされる', async () => {
      const { AudioEngine } = await import('../audio');
      AudioEngine.init();

      AudioEngine.setSfxVolume(-1);
      expect(AudioEngine.getSfxVolume()).toBe(0);

      AudioEngine.setSfxVolume(2);
      expect(AudioEngine.getSfxVolume()).toBe(1);
    });
  });
});
