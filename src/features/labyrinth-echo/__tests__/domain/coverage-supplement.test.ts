/**
 * ドメイン層カバレッジ補完テスト
 *
 * Phase 5 (I-5.1) — カバレッジギャップを埋めるテスト群
 */
import { invariant } from '../../domain/contracts/invariants';
import { evaluateCondition, parseCondition } from '../../domain/events/condition';
import { shuffleWith } from '../../domain/events/random';
import {
  determineEnding,
  getDeathFlavor,
  getDeathTip,
} from '../../domain/services/ending-service';
import {
  canPurchaseUnlock,
  checkAutoUnlocks,
} from '../../domain/services/unlock-service';
import {
  applyModifiers,
  applyChangesToPlayer,
  computeDrain,
} from '../../domain/services/combat-service';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { FLOOR_META } from '../../domain/constants/floor-meta';
import { createTestPlayer, createTestFx, createTestOutcome, createTestDifficulty, createDomainTestPlayer, createDomainTestDifficulty } from '../helpers/factories';
import { createMetaState } from '../../domain/models/meta-state';
import type { Player } from '../../domain/models/player';
import type { Condition } from '../../domain/events/condition';
import type { FxState } from '../../domain/models/unlock';
import { FX_DEFAULTS } from '../../domain/models/unlock';

// ヘルパー
const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  hp: 50,
  maxHp: 100,
  mn: 30,
  maxMn: 60,
  inf: 10,
  statuses: [],
  ...overrides,
});

const makeFx = (overrides: Partial<FxState> = {}): FxState => ({
  ...FX_DEFAULTS,
  ...overrides,
});

// =============================================================================
// invariants — 分岐カバレッジ補完
// =============================================================================
describe('invariant', () => {
  it('条件がtruthyの場合は例外を投げない', () => {
    // Act & Assert
    expect(() => invariant(true, 'test')).not.toThrow();
    expect(() => invariant(1, 'test')).not.toThrow();
    expect(() => invariant('value', 'test')).not.toThrow();
  });

  it('条件がfalsyかつdetailなしの場合のエラーメッセージ', () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    expect(() => invariant(false, 'testCtx')).toThrow('[迷宮の残響] Invariant violation in testCtx');

    jest.restoreAllMocks();
  });

  it('条件がfalsyかつdetail付きの場合のエラーメッセージ', () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act & Assert
    expect(() => invariant(false, 'ctx', '詳細情報')).toThrow('Invariant violation in ctx: 詳細情報');

    jest.restoreAllMocks();
  });
});

// =============================================================================
// condition — >= / <= 演算子カバレッジ
// =============================================================================
describe('条件評価 >= / <= 演算子', () => {
  describe('parseCondition', () => {
    it('"hp>=50" をパースできる', () => {
      const result = parseCondition('hp>=50');
      expect(result).toEqual({ type: 'hp', op: '>=', value: 50 });
    });

    it('"mn<=20" をパースできる', () => {
      const result = parseCondition('mn<=20');
      expect(result).toEqual({ type: 'mn', op: '<=', value: 20 });
    });

    it('"inf>=10" をパースできる', () => {
      const result = parseCondition('inf>=10');
      expect(result).toEqual({ type: 'inf', op: '>=', value: 10 });
    });
  });

  describe('evaluateCondition', () => {
    it('hp >= threshold（境界値一致）でtrueを返す', () => {
      const condition: Condition = { type: 'hp', op: '>=', value: 50 };
      const player = makePlayer({ hp: 50 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('hp >= threshold（未満）でfalseを返す', () => {
      const condition: Condition = { type: 'hp', op: '>=', value: 50 };
      const player = makePlayer({ hp: 49 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(false);
    });

    it('mn <= threshold（境界値一致）でtrueを返す', () => {
      const condition: Condition = { type: 'mn', op: '<=', value: 30 };
      const player = makePlayer({ mn: 30 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('mn <= threshold（超過）でfalseを返す', () => {
      const condition: Condition = { type: 'mn', op: '<=', value: 30 };
      const player = makePlayer({ mn: 31 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(false);
    });

    it('inf >= threshold でtrueを返す', () => {
      const condition: Condition = { type: 'inf', op: '>=', value: 10 };
      const player = makePlayer({ inf: 10 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });

    it('inf <= threshold でtrueを返す', () => {
      const condition: Condition = { type: 'inf', op: '<=', value: 10 };
      const player = makePlayer({ inf: 10 });
      expect(evaluateCondition(condition, player, makeFx())).toBe(true);
    });
  });
});

// =============================================================================
// shuffleWith — デフォルト引数（DefaultRandomSource）カバレッジ
// =============================================================================
describe('shuffleWith デフォルト引数', () => {
  it('rng未指定で動作する（DefaultRandomSourceが使用される）', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];

    // Act
    const result = shuffleWith(array);

    // Assert — 全要素が保持される
    expect(result).toHaveLength(5);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});

// =============================================================================
// ending-service — フォールバック・フロアヒント補完
// =============================================================================
describe('EndingService 補完', () => {
  describe('determineEnding', () => {
    it('MN低下時にmadnessを返す', () => {
      // Arrange
      const player = makePlayer({ hp: 80, maxHp: 100, mn: 10, maxMn: 60, inf: 5, statuses: [] });

      // Act
      const ending = determineEnding(player, [], createTestDifficulty({ id: 'normal' }));

      // Assert
      expect(ending.id).toBe('madness');
    });

    it('呪い状態でcursedを返す', () => {
      // Arrange
      const player = makePlayer({ hp: 40, maxHp: 100, mn: 30, maxMn: 60, inf: 5, statuses: ['呪い'] });

      // Act
      const ending = determineEnding(player, [], createTestDifficulty({ id: 'normal' }));

      // Assert
      expect(ending.id).toBe('cursed');
    });

    it('出血+恐怖状態でcursedを返す', () => {
      // Arrange
      const player = makePlayer({ hp: 40, maxHp: 100, mn: 30, maxMn: 60, inf: 5, statuses: ['出血', '恐怖'] });

      // Act
      const ending = determineEnding(player, [], createTestDifficulty({ id: 'normal' }));

      // Assert
      expect(ending.id).toBe('cursed');
    });

    it('ironエンディング: HP50%超+ステータス異常ありの場合', () => {
      // Arrange
      const player = makePlayer({ hp: 60, maxHp: 100, mn: 30, maxMn: 60, inf: 5, statuses: ['負傷'] });

      // Act
      const ending = determineEnding(player, [], createTestDifficulty({ id: 'normal' }));

      // Assert
      expect(ending.id).toBe('iron');
    });

    it('veteranエンディング: ログ13件以上', () => {
      // Arrange
      const player = makePlayer({ hp: 40, maxHp: 100, mn: 30, maxMn: 60, inf: 5, statuses: [] });
      const log = Array.from({ length: 15 }, (_, i) => ({
        fl: 1,
        step: i,
        ch: `選択肢${i}`,
        hp: -5,
        mn: -3,
        inf: 2,
      }));

      // Act
      const ending = determineEnding(player, log, createTestDifficulty({ id: 'normal' }));

      // Assert
      expect(ending.id).toBe('veteran');
    });
  });

  describe('getDeathTip', () => {
    it('中層フロア（3-4）のヒントを返す', () => {
      // Act
      const tip = getDeathTip('体力消耗', 3);

      // Assert
      expect(tip).toContain('第3層');
    });

    it('深層フロア（5）のヒントを返す', () => {
      // Act
      const tip = getDeathTip('精神崩壊', 5);

      // Assert
      expect(tip).toContain('最深層');
    });

    it('序盤フロア（1-2）のヒントを返す', () => {
      // Act
      const tip = getDeathTip('体力消耗', 2);

      // Assert
      expect(tip).toContain('最初');
    });
  });

  describe('getDeathFlavor', () => {
    it('ラン数でテキストがループする', () => {
      // Arrange & Act
      const f0 = getDeathFlavor('精神崩壊', 0);
      const f3 = getDeathFlavor('精神崩壊', 3);

      // Assert — 3テキストで回転するため同じ
      expect(f0).toBe(f3);
    });
  });
});

// =============================================================================
// unlock-service — difficultyRequirement / achievementCondition カバレッジ
// =============================================================================
describe('UnlockService 補完', () => {
  describe('canPurchaseUnlock', () => {
    it('difficultyRequirementが未達の場合は購入不可', () => {
      // Arrange — u31はtrophyカテゴリでdifficultyRequirement: 'easy'
      const meta = createMetaState({ kp: 100, unlocked: [], clearedDifficulties: [] });

      // Act
      const result = canPurchaseUnlock('u31', meta);

      // Assert
      expect(result.purchasable).toBe(false);
      expect(result.reason).toContain('クリアが必要');
    });

    it('abyss_perfectエンディング達成でtrophy購入可能', () => {
      // Arrange — u35: trophy with difficultyRequirement: 'abyss_perfect'
      const meta = createMetaState({
        kp: 100,
        unlocked: [],
        clearedDifficulties: [],
        endings: ['abyss_perfect'],
      });

      // Act
      const result = canPurchaseUnlock('u35', meta);

      // Assert
      expect(result.purchasable).toBe(true);
    });

    it('存在しないアンロックIDの場合は購入不可', () => {
      // Arrange
      const meta = createMetaState({ kp: 100 });

      // Act
      const result = canPurchaseUnlock('nonexistent', meta);

      // Assert
      expect(result.purchasable).toBe(false);
      expect(result.reason).toBe('不明なアンロック');
    });

    it('achievementCondition未達の場合は購入不可', () => {
      // Arrange — u36: achieve with condition: runs >= 20
      const meta = createMetaState({ kp: 100, unlocked: [], runs: 5 });

      // Act
      const result = canPurchaseUnlock('u36', meta);

      // Assert
      expect(result.purchasable).toBe(false);
    });

    it('achievementCondition達成時は購入可能', () => {
      // Arrange — u36: achieve with condition: runs >= 20
      const meta = createMetaState({ kp: 100, unlocked: [], runs: 25 });

      // Act
      const result = canPurchaseUnlock('u36', meta);

      // Assert
      expect(result.purchasable).toBe(true);
    });
  });

  describe('checkAutoUnlocks', () => {
    it('abyss_perfectエンディングでトロフィーが自動解放される', () => {
      // Arrange
      const meta = createMetaState({
        unlocked: [],
        endings: ['abyss_perfect'],
        clearedDifficulties: [],
      });

      // Act
      const newUnlocks = checkAutoUnlocks(meta);

      // Assert
      expect(newUnlocks).toContain('u35');
    });

    it('条件未達のアンロックは返されない', () => {
      // Arrange
      const meta = createMetaState({
        unlocked: [],
        runs: 1,
        clearedDifficulties: [],
        endings: [],
      });

      // Act
      const newUnlocks = checkAutoUnlocks(meta);

      // Assert
      expect(newUnlocks).not.toContain('u36');
    });
  });
});

// =============================================================================
// combat-service — 追加エッジケース
// =============================================================================
describe('CombatService 補完', () => {
  describe('applyModifiers', () => {
    it('回復にdmgMultが適用されない（正の値は乗算対象外）', () => {
      // Arrange
      const outcome = createTestOutcome({ hp: 10 });
      const fx = createTestFx();
      const diff = createDomainTestDifficulty({ modifiers: { dmgMult: 2 } });

      // Act
      const result = applyModifiers(outcome, fx, diff, []);

      // Assert — dmgMultは負の値のみに適用
      expect(result.hp).toBe(10);
    });

    it('MN回復にmnReduceは適用されない', () => {
      // Arrange
      const outcome = createTestOutcome({ mn: 10 });
      const fx = createTestFx({ mnReduce: 0.5 });

      // Act
      const result = applyModifiers(outcome, fx, null, []);

      // Assert — mnReduceは負の値のみに適用
      expect(result.mn).toBe(10);
    });

    it('情報値が負の場合infoMultは適用されない', () => {
      // Arrange
      const outcome = createTestOutcome({ inf: -5 });
      const fx = createTestFx({ infoMult: 2 });

      // Act
      const result = applyModifiers(outcome, fx, null, []);

      // Assert
      expect(result.inf).toBe(-5);
    });
  });

  describe('applyChangesToPlayer', () => {
    it('同じステータスの重複追加を防ぐ', () => {
      // Arrange
      const player = createDomainTestPlayer({ statuses: ['負傷'] });

      // Act
      const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'add:負傷');

      // Assert
      expect(result.statuses.filter((s: string) => s === '負傷')).toHaveLength(1);
    });

    it('存在しないステータスのremoveはエラーにならない', () => {
      // Arrange
      const player = createDomainTestPlayer({ statuses: ['負傷'] });

      // Act
      const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, 'remove:混乱');

      // Assert
      expect(result.statuses).toContain('負傷');
    });

    it('flagがnullの場合はステータス変更なし', () => {
      // Arrange
      const player = createDomainTestPlayer({ statuses: ['負傷'] });

      // Act
      const result = applyChangesToPlayer(player, { hp: 0, mn: 0, inf: 0 }, null);

      // Assert
      expect(result.statuses).toEqual(['負傷']);
    });
  });

  describe('computeDrain', () => {
    it('難易度のdrainModが適用される', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 50, maxHp: 55, mn: 30, maxMn: 35, statuses: [] });
      const fx = createTestFx({ drainImmune: false });
      const diff = createDomainTestDifficulty({ modifiers: { drainMod: -3 } });

      // Act
      const result = computeDrain(player, fx, diff);

      // Assert
      expect(result.drain).not.toBeNull();
      expect(result.drain!.mn).toBe(-3);
    });

    it('ステータス効果のtickがない場合（恐怖にはtickがある）', () => {
      // Arrange
      const player = createDomainTestPlayer({ hp: 50, maxHp: 55, mn: 30, maxMn: 35, statuses: ['恐怖'] });
      const fx = createTestFx({ drainImmune: true });

      // Act
      const result = computeDrain(player, fx, null);

      // Assert
      expect(result.drain).not.toBeNull();
      expect(result.drain!.mn).toBeLessThan(0);
    });
  });
});

// =============================================================================
// 定数 — barrel export / 定数定義カバレッジ
// =============================================================================
describe('定数定義', () => {
  describe('EVENT_TYPE', () => {
    it('全イベントタイプが定義されている', () => {
      expect(EVENT_TYPE.exploration).toBeDefined();
      expect(EVENT_TYPE.encounter).toBeDefined();
      expect(EVENT_TYPE.trap).toBeDefined();
      expect(EVENT_TYPE.rest).toBeDefined();
    });

    it('各タイプにlabelとcolorsが存在する', () => {
      for (const [, def] of Object.entries(EVENT_TYPE)) {
        expect(def.label).toBeTruthy();
        expect(def.colors).toHaveLength(3);
      }
    });
  });

  describe('FLOOR_META', () => {
    it('フロア1〜5が定義されている', () => {
      for (let i = 1; i <= 5; i++) {
        expect(FLOOR_META[i]).toBeDefined();
        expect(FLOOR_META[i].name).toBeTruthy();
        expect(FLOOR_META[i].desc).toBeTruthy();
        expect(FLOOR_META[i].color).toBeTruthy();
      }
    });
  });
});

// =============================================================================
// domain/index.ts barrel export カバレッジ
// =============================================================================
describe('domain barrel export', () => {
  it('主要なエクスポートが利用可能', async () => {
    // Act
    const domain = await import('../../domain/index');

    // Assert — 主要エクスポートが存在する
    expect(domain.invariant).toBeDefined();
    expect(domain.createPlayerModel).toBeDefined();
    expect(domain.createMetaState).toBeDefined();
    expect(domain.evaluateCondition).toBeDefined();
    expect(domain.parseCondition).toBeDefined();
    expect(domain.DefaultRandomSource).toBeDefined();
    expect(domain.SeededRandomSource).toBeDefined();
    expect(domain.shuffleWith).toBeDefined();
    expect(domain.pickEvent).toBeDefined();
    expect(domain.findChainEvent).toBeDefined();
    expect(domain.applyModifiers).toBeDefined();
    expect(domain.computeFx).toBeDefined();
    expect(domain.determineEnding).toBeDefined();
    expect(domain.getUnlockedTitles).toBeDefined();
    expect(domain.CFG).toBeDefined();
    expect(domain.FLOOR_META).toBeDefined();
    expect(domain.DIFFICULTY).toBeDefined();
    expect(domain.UNLOCKS).toBeDefined();
    expect(domain.ENDINGS).toBeDefined();
    expect(domain.TITLES).toBeDefined();
    expect(domain.STATUS_META).toBeDefined();
    expect(domain.FRESH_META).toBeDefined();
  });
});
