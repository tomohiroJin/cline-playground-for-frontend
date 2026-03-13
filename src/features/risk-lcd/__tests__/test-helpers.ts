/**
 * RISK LCD テスト用モックユーティリティ
 *
 * 統合テスト・コンポーネントテストで共通利用するモック群
 */
import { renderHook } from '@testing-library/react';
import { useGameEngine } from '../hooks/useGameEngine';

// useGameEngine のパラメータ型を取得
type StoreParam = Parameters<typeof useGameEngine>[0];
type AudioParam = Parameters<typeof useGameEngine>[1];

// ── モック AudioContext ──

/** AudioContext のモックを window に設定する */
export function setupMockAudioContext(): void {
  const mockAudioContext = {
    state: 'running',
    resume: jest.fn().mockResolvedValue(undefined),
    createOscillator: jest.fn(() => ({
      type: '',
      frequency: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    })),
    currentTime: 0,
    destination: {},
  };
  (window as unknown as { AudioContext: unknown }).AudioContext = jest.fn(
    () => mockAudioContext,
  );
}

// ── モック Audio API（useAudio の戻り値互換） ──

/** モックオーディオの型定義 */
interface MockAudio {
  mv: jest.Mock;
  sel: jest.Mock;
  tick: jest.Mock;
  fall: jest.Mock;
  wr: jest.Mock;
  die: jest.Mock;
  ok: jest.Mock;
  combo: jest.Mock;
  near: jest.Mock;
  clr: jest.Mock;
  ss: jest.Mock;
  ul: jest.Mock;
  er: jest.Mock;
  sh: jest.Mock;
  pk: jest.Mock;
  mod: jest.Mock;
}

/** useAudio の戻り値と同じインターフェースのモック */
export function createMockAudio(): MockAudio {
  return {
    mv: jest.fn(),
    sel: jest.fn(),
    tick: jest.fn(),
    fall: jest.fn(),
    wr: jest.fn(),
    die: jest.fn(),
    ok: jest.fn(),
    combo: jest.fn(),
    near: jest.fn(),
    clr: jest.fn(),
    ss: jest.fn(),
    ul: jest.fn(),
    er: jest.fn(),
    sh: jest.fn(),
    pk: jest.fn(),
    mod: jest.fn(),
  };
}

// ── モック Store API（useStore の戻り値互換） ──

/** モックストアの型定義 */
interface MockStore {
  data: {
    pts: number;
    plays: number;
    best: number;
    bestSt: number;
    sty: string[];
    ui: string[];
    eq: string[];
    tutorialDone: boolean;
  };
  addPts: jest.Mock;
  spend: jest.Mock;
  hasStyle: jest.Mock;
  hasUnlock: jest.Mock;
  ownStyle: jest.Mock;
  ownUnlock: jest.Mock;
  maxSlots: jest.Mock;
  isEq: jest.Mock;
  toggleEq: jest.Mock;
  updateBest: jest.Mock;
  getDailyData: jest.Mock;
  isDailyPlayed: jest.Mock;
  recordDailyPlay: jest.Mock;
  markTutorialDone: jest.Mock;
}

/** useStore の戻り値と同じインターフェースのモック */
export function createMockStore(overrides?: Partial<MockStore>): MockStore {
  const defaultStore: MockStore = {
    data: {
      pts: 100,
      plays: 5,
      best: 500,
      bestSt: 3,
      sty: ['standard'],
      ui: [] as string[],
      eq: ['standard'],
      tutorialDone: true,
    },
    addPts: jest.fn(),
    spend: jest.fn().mockReturnValue(true),
    hasStyle: jest.fn((id: string) => id === 'standard'),
    hasUnlock: jest.fn().mockReturnValue(false),
    ownStyle: jest.fn(),
    ownUnlock: jest.fn(),
    maxSlots: jest.fn().mockReturnValue(1),
    isEq: jest.fn((id: string) => id === 'standard'),
    toggleEq: jest.fn().mockReturnValue(true),
    updateBest: jest.fn(),
    getDailyData: jest.fn().mockReturnValue(null),
    isDailyPlayed: jest.fn().mockReturnValue(false),
    recordDailyPlay: jest.fn().mockReturnValue(0),
    markTutorialDone: jest.fn(),
  };
  return { ...defaultStore, ...overrides };
}

// ── 統合テスト用ヘルパー ──

/** useGameEngine を モック store/audio で renderHook するヘルパー */
export function renderGameEngine(storeOverrides?: Partial<MockStore>) {
  const store = createMockStore(storeOverrides);
  const audio = createMockAudio();
  return renderHook(() =>
    useGameEngine(store as unknown as StoreParam, audio as unknown as AudioParam),
  );
}
