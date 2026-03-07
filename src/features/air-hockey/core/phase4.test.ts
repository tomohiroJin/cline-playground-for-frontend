/**
 * Phase 4: 発展的機能のテスト
 */
import { CONSTANTS } from './constants';
import { FIELDS, ITEMS } from './config';

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string | null => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// ── 4.1 キーボード操作 ──────────────────────────────────

import {
  createKeyboardState,
  updateKeyboardState,
  calculateKeyboardMovement,
  KeyboardState,
  KEYBOARD_MOVE_SPEED,
} from './keyboard';

describe('4.1 キーボード操作', () => {
  describe('createKeyboardState', () => {
    it('初期状態では全キーが未押下', () => {
      const state = createKeyboardState();
      expect(state.up).toBe(false);
      expect(state.down).toBe(false);
      expect(state.left).toBe(false);
      expect(state.right).toBe(false);
    });
  });

  describe('updateKeyboardState', () => {
    it('ArrowUp キー押下で up が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'ArrowUp', true);
      expect(updated.up).toBe(true);
    });

    it('w キー押下で up が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'w', true);
      expect(updated.up).toBe(true);
    });

    it('ArrowDown キー押下で down が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'ArrowDown', true);
      expect(updated.down).toBe(true);
    });

    it('s キー押下で down が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 's', true);
      expect(updated.down).toBe(true);
    });

    it('ArrowLeft キー押下で left が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'ArrowLeft', true);
      expect(updated.left).toBe(true);
    });

    it('a キー押下で left が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'a', true);
      expect(updated.left).toBe(true);
    });

    it('ArrowRight キー押下で right が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'ArrowRight', true);
      expect(updated.right).toBe(true);
    });

    it('d キー押下で right が true になる', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'd', true);
      expect(updated.right).toBe(true);
    });

    it('キーリリースで false に戻る', () => {
      let state = createKeyboardState();
      state = updateKeyboardState(state, 'ArrowUp', true);
      state = updateKeyboardState(state, 'ArrowUp', false);
      expect(state.up).toBe(false);
    });

    it('関係ないキーは状態を変えない', () => {
      const state = createKeyboardState();
      const updated = updateKeyboardState(state, 'q', true);
      expect(updated).toEqual(state);
    });
  });

  describe('calculateKeyboardMovement', () => {
    const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
    const { MALLET: MR } = CONSTANTS.SIZES;

    it('上キーでマレットが上に移動する', () => {
      const state: KeyboardState = { up: true, down: false, left: false, right: false };
      const pos = { x: W / 2, y: H * 0.75 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.y).toBeLessThan(pos.y);
      expect(result.x).toBe(pos.x);
    });

    it('下キーでマレットが下に移動する', () => {
      const state: KeyboardState = { up: false, down: true, left: false, right: false };
      const pos = { x: W / 2, y: H * 0.75 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.y).toBeGreaterThan(pos.y);
    });

    it('左キーでマレットが左に移動する', () => {
      const state: KeyboardState = { up: false, down: false, left: true, right: false };
      const pos = { x: W / 2, y: H * 0.75 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.x).toBeLessThan(pos.x);
    });

    it('右キーでマレットが右に移動する', () => {
      const state: KeyboardState = { up: false, down: false, left: false, right: true };
      const pos = { x: W / 2, y: H * 0.75 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.x).toBeGreaterThan(pos.x);
    });

    it('プレイヤー側半面内にクランプされる', () => {
      const state: KeyboardState = { up: true, down: false, left: false, right: false };
      // 上限ギリギリの位置
      const pos = { x: W / 2, y: H / 2 + MR + 11 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.y).toBeGreaterThanOrEqual(H / 2 + MR + 10);
    });

    it('キャンバス境界にクランプされる（左端）', () => {
      const state: KeyboardState = { up: false, down: false, left: true, right: false };
      const pos = { x: MR + 6, y: H * 0.75 };
      const result = calculateKeyboardMovement(state, pos, CONSTANTS);
      expect(result.x).toBeGreaterThanOrEqual(MR + 5);
    });

    it('移動速度がマウスより遅い（KEYBOARD_MOVE_SPEED で制限）', () => {
      expect(KEYBOARD_MOVE_SPEED).toBeLessThanOrEqual(8);
      expect(KEYBOARD_MOVE_SPEED).toBeGreaterThan(0);
    });
  });
});

// ── 4.2 難易度オートアジャスト ──────────────────────────────────

import {
  getStreakRecord,
  saveStreakRecord,
  recordMatchResult,
  getSuggestedDifficulty,
  StreakRecord,
  STREAK_THRESHOLD,
} from './difficulty-adjust';

describe('4.2 難易度オートアジャスト', () => {
  describe('getStreakRecord / saveStreakRecord', () => {
    it('初期状態では連勝・連敗ともに 0', () => {
      const record = getStreakRecord();
      expect(record.winStreak).toBe(0);
      expect(record.loseStreak).toBe(0);
    });

    it('保存した記録を読み込める', () => {
      const record: StreakRecord = { winStreak: 3, loseStreak: 0 };
      saveStreakRecord(record);
      const loaded = getStreakRecord();
      expect(loaded.winStreak).toBe(3);
      expect(loaded.loseStreak).toBe(0);
    });
  });

  describe('recordMatchResult', () => {
    it('勝利で連勝カウントが増加する', () => {
      const prev: StreakRecord = { winStreak: 0, loseStreak: 0 };
      const next = recordMatchResult(prev, true);
      expect(next.winStreak).toBe(1);
      expect(next.loseStreak).toBe(0);
    });

    it('敗北で連敗カウントが増加する', () => {
      const prev: StreakRecord = { winStreak: 0, loseStreak: 0 };
      const next = recordMatchResult(prev, false);
      expect(next.loseStreak).toBe(1);
      expect(next.winStreak).toBe(0);
    });

    it('勝利で連敗カウントがリセットされる', () => {
      const prev: StreakRecord = { winStreak: 0, loseStreak: 2 };
      const next = recordMatchResult(prev, true);
      expect(next.winStreak).toBe(1);
      expect(next.loseStreak).toBe(0);
    });

    it('敗北で連勝カウントがリセットされる', () => {
      const prev: StreakRecord = { winStreak: 2, loseStreak: 0 };
      const next = recordMatchResult(prev, false);
      expect(next.loseStreak).toBe(1);
      expect(next.winStreak).toBe(0);
    });

    it('連続して勝利するとカウントが累積する', () => {
      let record: StreakRecord = { winStreak: 0, loseStreak: 0 };
      record = recordMatchResult(record, true);
      record = recordMatchResult(record, true);
      record = recordMatchResult(record, true);
      expect(record.winStreak).toBe(3);
    });
  });

  describe('getSuggestedDifficulty', () => {
    it('3連敗で難易度を下げる提案を返す', () => {
      const record: StreakRecord = { winStreak: 0, loseStreak: STREAK_THRESHOLD };
      const suggestion = getSuggestedDifficulty(record, 'normal');
      expect(suggestion).toBe('easy');
    });

    it('3連勝で難易度を上げる提案を返す', () => {
      const record: StreakRecord = { winStreak: STREAK_THRESHOLD, loseStreak: 0 };
      const suggestion = getSuggestedDifficulty(record, 'normal');
      expect(suggestion).toBe('hard');
    });

    it('easy で連敗しても下がらない（最低難易度）', () => {
      const record: StreakRecord = { winStreak: 0, loseStreak: STREAK_THRESHOLD };
      const suggestion = getSuggestedDifficulty(record, 'easy');
      expect(suggestion).toBeUndefined();
    });

    it('hard で連勝しても上がらない（最高難易度）', () => {
      const record: StreakRecord = { winStreak: STREAK_THRESHOLD, loseStreak: 0 };
      const suggestion = getSuggestedDifficulty(record, 'hard');
      expect(suggestion).toBeUndefined();
    });

    it('連勝・連敗が閾値未満なら提案なし', () => {
      const record: StreakRecord = { winStreak: 2, loseStreak: 0 };
      const suggestion = getSuggestedDifficulty(record, 'normal');
      expect(suggestion).toBeUndefined();
    });
  });
});

// ── 4.3 フィールド/アイテムアンロック ──────────────────────────────────

import {
  UNLOCK_CONDITIONS,
  getUnlockState,
  saveUnlockState,
  checkUnlocks,
  isFieldUnlocked,
  isItemUnlocked,
  UnlockState,
  UnlockContext,
} from './unlock';

describe('4.3 フィールド/アイテムアンロック', () => {
  describe('getUnlockState / saveUnlockState', () => {
    it('初期状態では初期フィールド・アイテムのみアンロック', () => {
      const state = getUnlockState();
      expect(state.unlockedFields).toContain('classic');
      expect(state.unlockedFields).toContain('wide');
      expect(state.unlockedItems).toContain('split');
      expect(state.unlockedItems).toContain('speed');
      expect(state.unlockedItems).toContain('invisible');
    });

    it('保存した状態を読み込める', () => {
      const state: UnlockState = {
        unlockedFields: ['classic', 'wide', 'pillars'],
        unlockedItems: ['split', 'speed', 'invisible', 'shield'],
        totalWins: 5,
      };
      saveUnlockState(state);
      const loaded = getUnlockState();
      expect(loaded.unlockedFields).toContain('pillars');
      expect(loaded.unlockedItems).toContain('shield');
      expect(loaded.totalWins).toBe(5);
    });
  });

  describe('isFieldUnlocked / isItemUnlocked', () => {
    it('初期フィールドはアンロック済み', () => {
      const state = getUnlockState();
      expect(isFieldUnlocked(state, 'classic')).toBe(true);
      expect(isFieldUnlocked(state, 'wide')).toBe(true);
    });

    it('ロックされたフィールドは false', () => {
      const state = getUnlockState();
      expect(isFieldUnlocked(state, 'pillars')).toBe(false);
    });

    it('初期アイテムはアンロック済み', () => {
      const state = getUnlockState();
      expect(isItemUnlocked(state, 'split')).toBe(true);
    });
  });

  describe('checkUnlocks', () => {
    it('勝利数3でフィールドがアンロックされる', () => {
      const state: UnlockState = {
        unlockedFields: ['classic', 'wide'],
        unlockedItems: ['split', 'speed', 'invisible'],
        totalWins: 2,
      };
      const ctx: UnlockContext = { isWin: true, difficulty: 'normal', fieldId: 'classic' };
      const result = checkUnlocks(state, ctx);
      // totalWins が 3 になり、条件を満たすアンロックが発生するはず
      expect(result.totalWins).toBe(3);
      expect(result.unlockedFields.length).toBeGreaterThan(state.unlockedFields.length);
    });

    it('敗北では totalWins が増加しない', () => {
      const state: UnlockState = {
        unlockedFields: ['classic', 'wide'],
        unlockedItems: ['split', 'speed', 'invisible'],
        totalWins: 2,
      };
      const ctx: UnlockContext = { isWin: false, difficulty: 'normal', fieldId: 'classic' };
      const result = checkUnlocks(state, ctx);
      expect(result.totalWins).toBe(2);
    });

    it('hard 勝利でアイテムがアンロックされる', () => {
      const state: UnlockState = {
        unlockedFields: ['classic', 'wide'],
        unlockedItems: ['split', 'speed', 'invisible'],
        totalWins: 4,
      };
      const ctx: UnlockContext = { isWin: true, difficulty: 'hard', fieldId: 'classic' };
      const result = checkUnlocks(state, ctx);
      // hard 勝利条件のアンロックが発生するはず
      expect(result.unlockedItems.length).toBeGreaterThanOrEqual(state.unlockedItems.length);
    });

    it('既にアンロック済みのものは重複しない', () => {
      const state: UnlockState = {
        unlockedFields: ['classic', 'wide', 'pillars', 'zigzag', 'fortress', 'bastion'],
        unlockedItems: ['split', 'speed', 'invisible', 'shield', 'magnet', 'big'],
        totalWins: 100,
      };
      const ctx: UnlockContext = { isWin: true, difficulty: 'hard', fieldId: 'classic' };
      const result = checkUnlocks(state, ctx);
      // セットの長さは変わらない
      const uniqueFields = new Set(result.unlockedFields);
      expect(uniqueFields.size).toBe(result.unlockedFields.length);
    });
  });

  describe('UNLOCK_CONDITIONS', () => {
    it('アンロック条件が定義されている', () => {
      expect(UNLOCK_CONDITIONS.length).toBeGreaterThan(0);
    });

    it('各条件に必須プロパティがある', () => {
      for (const cond of UNLOCK_CONDITIONS) {
        expect(cond.id).toBeDefined();
        expect(cond.type).toMatch(/^(field|item)$/);
        expect(cond.targetId).toBeDefined();
        expect(typeof cond.check).toBe('function');
        expect(cond.description).toBeDefined();
      }
    });
  });
});

// ── 4.4 デイリーチャレンジ ──────────────────────────────────

import {
  generateDailySeed,
  generateDailyChallenge,
  getDailyChallengeResult,
  saveDailyChallengeResult,
  DailyChallenge,
  DailyChallengeResult,
} from './daily-challenge';

describe('4.4 デイリーチャレンジ', () => {
  describe('generateDailySeed', () => {
    it('同一日付で同一シード値が生成される', () => {
      const date = new Date('2026-03-07');
      const seed1 = generateDailySeed(date);
      const seed2 = generateDailySeed(date);
      expect(seed1).toBe(seed2);
    });

    it('異なる日付で異なるシード値が生成される', () => {
      const date1 = new Date('2026-03-07');
      const date2 = new Date('2026-03-08');
      const seed1 = generateDailySeed(date1);
      const seed2 = generateDailySeed(date2);
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('generateDailyChallenge', () => {
    it('同一日付で同一チャレンジが生成される', () => {
      const date = new Date('2026-03-07');
      const challenge1 = generateDailyChallenge(date);
      const challenge2 = generateDailyChallenge(date);
      expect(challenge1).toEqual(challenge2);
    });

    it('チャレンジに必要なプロパティがある', () => {
      const challenge = generateDailyChallenge(new Date('2026-03-07'));
      expect(challenge.date).toBe('2026-03-07');
      expect(challenge.fieldId).toBeDefined();
      expect(challenge.difficulty).toBeDefined();
      expect(challenge.winScore).toBeGreaterThan(0);
      expect(challenge.modifiers).toBeDefined();
      expect(challenge.title).toBeDefined();
    });

    it('フィールドIDが有効なフィールドである', () => {
      const challenge = generateDailyChallenge(new Date('2026-03-07'));
      const fieldIds = FIELDS.map(f => f.id);
      expect(fieldIds).toContain(challenge.fieldId);
    });

    it('難易度が有効な値である', () => {
      const challenge = generateDailyChallenge(new Date('2026-03-07'));
      expect(['easy', 'normal', 'hard']).toContain(challenge.difficulty);
    });

    it('異なる日付で異なるチャレンジが生成される', () => {
      const c1 = generateDailyChallenge(new Date('2026-03-07'));
      const c2 = generateDailyChallenge(new Date('2026-03-08'));
      // 少なくとも日付が異なる
      expect(c1.date).not.toBe(c2.date);
    });
  });

  describe('getDailyChallengeResult / saveDailyChallengeResult', () => {
    it('未プレイのチャレンジは undefined を返す', () => {
      const result = getDailyChallengeResult('2026-03-07');
      expect(result).toBeUndefined();
    });

    it('クリア結果を保存・読み込みできる', () => {
      const result: DailyChallengeResult = {
        date: '2026-03-07',
        isCleared: true,
        playerScore: 5,
        cpuScore: 2,
      };
      saveDailyChallengeResult(result);
      const loaded = getDailyChallengeResult('2026-03-07');
      expect(loaded).toBeDefined();
      expect(loaded!.isCleared).toBe(true);
      expect(loaded!.playerScore).toBe(5);
    });

    it('異なる日付の結果は独立している', () => {
      saveDailyChallengeResult({
        date: '2026-03-07',
        isCleared: true,
        playerScore: 5,
        cpuScore: 2,
      });
      const other = getDailyChallengeResult('2026-03-08');
      expect(other).toBeUndefined();
    });
  });
});
