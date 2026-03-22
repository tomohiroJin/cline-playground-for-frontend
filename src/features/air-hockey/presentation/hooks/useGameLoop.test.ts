/**
 * プレゼンテーション層 useGameLoop フックのテスト
 * - パラメータが5つ以下のオブジェクトにグループ化されていること
 * - screen が 'game' のときのみ rAF が開始されること
 * - screen が 'game' 以外のとき rAF がキャンセルされること
 */
import { renderHook } from '@testing-library/react';
import { useGameLoop, type GameLoopConfig, type GameLoopRefs, type GameLoopCallbacks } from './useGameLoop';
import type { MatchStats, GamePhase } from '../../core/types';
import type { SoundSystem } from '../../core/types';
import { FIELDS } from '../../core/config';

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
  createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
  setTransform: jest.fn(),
  canvas: { width: 450, height: 900 },
})) as jest.Mock;

// Renderer モック（Canvas 描画を抑制）
jest.mock('../../renderer', () => ({
  Renderer: {
    clear: jest.fn(),
    drawField: jest.fn(),
    drawMallet: jest.fn(),
    drawPuck: jest.fn(),
    drawItem: jest.fn(),
    drawCountdown: jest.fn(),
    drawPauseOverlay: jest.fn(),
    drawEffectZones: jest.fn(),
    drawParticles: jest.fn(),
    drawShockwave: jest.fn(),
    drawGoalEffect: jest.fn(),
    drawHelp: jest.fn(),
    drawHUD: jest.fn(),
    drawFlash: jest.fn(),
    drawFeverEffect: jest.fn(),
    drawCombo: jest.fn(),
    drawShield: jest.fn(),
    drawMagnetEffect: jest.fn(),
    drawVignette: jest.fn(),
  },
}));

// rAF モック
let _rafCallback: FrameRequestCallback | null = null;
const mockRAF = jest.fn((cb: FrameRequestCallback) => {
  _rafCallback = cb;
  return 1;
});
const mockCAF = jest.fn();
(global as unknown as Record<string, unknown>).requestAnimationFrame = mockRAF;
(global as unknown as Record<string, unknown>).cancelAnimationFrame = mockCAF;

describe('useGameLoop（プレゼンテーション層）', () => {
  const createMockSound = (): SoundSystem => ({
    hit: jest.fn(),
    wall: jest.fn(),
    goal: jest.fn(),
    lose: jest.fn(),
    start: jest.fn(),
    countdown: jest.fn(),
    go: jest.fn(),
    item: jest.fn(),
    bgmStart: jest.fn(),
    bgmStop: jest.fn(),
    bgmSetTempo: jest.fn(),
    setBgmVolume: jest.fn(),
    setSeVolume: jest.fn(),
    setMuted: jest.fn(),
  });

  const createMockRefs = (): GameLoopRefs => ({
    gameRef: { current: null },
    canvasRef: { current: document.createElement('canvas') },
    lastInputRef: { current: 0 },
    scoreRef: { current: { p: 0, c: 0 } },
    phaseRef: { current: 'countdown' as GamePhase },
    countdownStartRef: { current: Date.now() },
    shakeRef: { current: null },
    statsRef: { current: { playerHits: 0, cpuHits: 0, maxPuckSpeed: 0, playerItemsCollected: 0, cpuItemsCollected: 0, playerSaves: 0, cpuSaves: 0, matchDuration: 0 } as MatchStats },
    matchStartRef: { current: Date.now() },
  });

  const createDefaultConfig = (): GameLoopConfig => ({
    difficulty: 'normal',
    field: FIELDS[0],
    winScore: 3,
    getSound: () => createMockSound(),
    bgmEnabled: false,
  });

  const createMockCallbacks = (): GameLoopCallbacks => ({
    setScores: jest.fn(),
    setWinner: jest.fn(),
    setScreen: jest.fn(),
    setShowHelp: jest.fn(),
    setShake: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    _rafCallback = null;
  });

  describe('パラメータインターフェース', () => {
    it('5つのフィールドを持つ単一オブジェクトでパラメータを受け取る', () => {
      // useGameLoop が呼び出し可能であることを確認
      const { unmount } = renderHook(() =>
        useGameLoop({
          screen: 'menu',
          showHelp: false,
          config: createDefaultConfig(),
          refs: createMockRefs(),
          callbacks: createMockCallbacks(),
        })
      );
      unmount();
      // エラーなく呼び出しが完了すれば OK
    });
  });

  describe('GameLoopConfig', () => {
    it('gameMode を指定できる', () => {
      const config: GameLoopConfig = {
        ...createDefaultConfig(),
        gameMode: '2p-local',
      };
      expect(config.gameMode).toBe('2p-local');
    });

    it('gameMode を省略するとデフォルトは undefined（後方互換）', () => {
      const config = createDefaultConfig();
      expect(config.gameMode).toBeUndefined();
    });
  });

  describe('GameLoopRefs', () => {
    it('player2KeysRef を含められる', () => {
      const refs = {
        ...createMockRefs(),
        player2KeysRef: { current: { up: false, down: false, left: false, right: false } },
      };
      expect(refs.player2KeysRef).toBeDefined();
    });
  });

  describe('rAF 管理', () => {
    it('screen が game のとき requestAnimationFrame が呼ばれる', () => {
      const { unmount } = renderHook(() =>
        useGameLoop({
          screen: 'game',
          showHelp: false,
          config: createDefaultConfig(),
          refs: createMockRefs(),
          callbacks: createMockCallbacks(),
        })
      );

      expect(mockRAF).toHaveBeenCalled();
      unmount();
    });

    it('screen が menu のとき requestAnimationFrame が呼ばれない', () => {
      const { unmount } = renderHook(() =>
        useGameLoop({
          screen: 'menu',
          showHelp: false,
          config: createDefaultConfig(),
          refs: createMockRefs(),
          callbacks: createMockCallbacks(),
        })
      );

      expect(mockRAF).not.toHaveBeenCalled();
      unmount();
    });

    it('アンマウント時に cancelAnimationFrame が呼ばれる', () => {
      const { unmount } = renderHook(() =>
        useGameLoop({
          screen: 'game',
          showHelp: false,
          config: createDefaultConfig(),
          refs: createMockRefs(),
          callbacks: createMockCallbacks(),
        })
      );

      unmount();
      expect(mockCAF).toHaveBeenCalled();
    });
  });
});
