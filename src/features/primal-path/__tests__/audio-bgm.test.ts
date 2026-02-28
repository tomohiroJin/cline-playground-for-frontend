/**
 * 原始進化録 - PRIMAL PATH - BGM システムテスト
 */
import { BGM_PATTERNS } from '../constants';
import type { BgmType } from '../types';

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

    afterEach(() => {
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
  });
});
