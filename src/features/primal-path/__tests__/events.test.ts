/**
 * 原始進化録 - PRIMAL PATH - ランダムイベントテスト
 */
import {
  rollEvent, applyEventChoice, dominantCiv,
} from '../game-logic';
import type { RunState, EventChoice, RandomEventDef } from '../types';
import { TB_DEFAULTS, DIFFS, RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES } from '../constants';

/* ===== Helpers ===== */

function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    hp: 80, mhp: 80, atk: 8, def: 2, cr: 0.05, burn: 0, aM: 1, dm: 1,
    cT: 0, cL: 0, cR: 0,
    al: [], bms: ['grassland', 'glacier', 'volcano'],
    cB: 1, cBT: 'grassland', cW: 1, wpb: 4, bE: 0, bb: 0,
    di: 0, dd: DIFFS[0], fe: null, tb: { ...TB_DEFAULTS },
    mxA: 3, evoN: 3, fReq: 5, saReq: 4,
    rvU: 0, bc: 0, log: [], turn: 0, kills: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0, wDmg: 0, wTurn: 0,
    awoken: [], en: null, sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    btlCount: 0, eventCount: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
    ...overrides,
  };
}

/* ===== 定数検証 ===== */

describe('イベント定数', () => {
  it('EVENT_CHANCEが0.3である', () => {
    expect(EVENT_CHANCE).toBe(0.3);
  });

  it('EVENT_MIN_BATTLESが1である', () => {
    expect(EVENT_MIN_BATTLES).toBe(1);
  });

  it('RANDOM_EVENTSが8種定義されている', () => {
    expect(RANDOM_EVENTS).toHaveLength(8);
  });

  it('各イベントに2〜3個の選択肢がある', () => {
    for (const evt of RANDOM_EVENTS) {
      expect(evt.choices.length).toBeGreaterThanOrEqual(2);
      expect(evt.choices.length).toBeLessThanOrEqual(3);
    }
  });

  it('全イベントIDがユニークである', () => {
    const ids = RANDOM_EVENTS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ===== dominantCiv ===== */

describe('dominantCiv', () => {
  it('techが最も高い場合はtechを返す', () => {
    const run = makeRun({ cT: 5, cL: 2, cR: 3 });
    expect(dominantCiv(run)).toBe('tech');
  });

  it('lifeが最も高い場合はlifeを返す', () => {
    const run = makeRun({ cT: 1, cL: 4, cR: 2 });
    expect(dominantCiv(run)).toBe('life');
  });

  it('ritが最も高い場合はritを返す', () => {
    const run = makeRun({ cT: 2, cL: 2, cR: 5 });
    expect(dominantCiv(run)).toBe('rit');
  });

  it('全て同じレベルの場合はtechを返す（タイブレーク）', () => {
    const run = makeRun({ cT: 3, cL: 3, cR: 3 });
    expect(dominantCiv(run)).toBe('tech');
  });
});

/* ===== rollEvent ===== */

describe('rollEvent', () => {
  it('序盤（btlCount < EVENT_MIN_BATTLES）はイベント発生しない', () => {
    // Arrange: btlCount = 0 < EVENT_MIN_BATTLES(1)
    const run = makeRun({ btlCount: 0 });

    // Act: 確率100%でも発生しない
    const result = rollEvent(run, () => 0);

    // Assert
    expect(result).toBeUndefined();
  });

  it('btlCount >= EVENT_MIN_BATTLES で確率が通ればイベント発生する', () => {
    // Arrange
    const run = makeRun({ btlCount: 3 });

    // Act: rng = 0.1 < EVENT_CHANCE(0.3) → 発生
    const result = rollEvent(run, () => 0.1);

    // Assert
    expect(result).toBeDefined();
    expect(result!.id).toBeDefined();
  });

  it('確率が通らなければイベント発生しない', () => {
    // Arrange
    const run = makeRun({ btlCount: 5 });

    // Act: rng = 0.5 > EVENT_CHANCE(0.3) → 発生しない
    const result = rollEvent(run, () => 0.5);

    // Assert
    expect(result).toBeUndefined();
  });

  it('バイオームアフィニティのあるイベントが対応バイオームで重み付けされる', () => {
    // Arrange: 火山バイオームでrng→イベント発生確定、選択で beast_den が選ばれやすい
    const run = makeRun({ btlCount: 5, cBT: 'volcano' });
    const counts: Record<string, number> = {};

    // Act: 複数回試行
    let callIdx = 0;
    for (let i = 0; i < 100; i++) {
      callIdx = 0;
      const result = rollEvent(run, () => {
        callIdx++;
        // 1回目: 確率チェック（< 0.2 で通す）、2回目以降: イベント選択
        if (callIdx === 1) return 0.1;
        return Math.random();
      });
      if (result) {
        counts[result.id] = (counts[result.id] ?? 0) + 1;
      }
    }

    // Assert: beast_den（火山アフィニティ持ち）が少なくとも1回出現
    expect(counts['beast_den'] ?? 0).toBeGreaterThan(0);
  });

  it('minBiomeCount を満たさないイベントは候補に含まれない', () => {
    // 現在の定義では minBiomeCount を持つイベントがないため、
    // 将来の拡張テストとして、候補数がイベント数以下であることを確認
    const run = makeRun({ btlCount: 3 });
    const result = rollEvent(run, () => 0.1);
    if (result) {
      const candidates = RANDOM_EVENTS.filter(e => {
        if (e.minBiomeCount && run.bc < e.minBiomeCount) return false;
        return true;
      });
      expect(candidates.map(c => c.id)).toContain(result.id);
    }
  });
});

/* ===== applyEventChoice ===== */

describe('applyEventChoice', () => {
  describe('stat_change 効果', () => {
    it('ATK+8が正しく適用される', () => {
      // Arrange
      const run = makeRun({ atk: 10 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'stat_change', stat: 'atk', value: 8 },
        riskLevel: 'safe',
      };

      // Act
      const result = applyEventChoice(run, choice);

      // Assert
      expect(result.atk).toBe(18);
    });

    it('DEF+5が正しく適用される', () => {
      const run = makeRun({ def: 2 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'stat_change', stat: 'def', value: 5 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.def).toBe(7);
    });

    it('HP（最大HP）+10が正しく適用される', () => {
      const run = makeRun({ mhp: 80 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'stat_change', stat: 'hp', value: 10 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.mhp).toBe(90);
    });
  });

  describe('heal 効果', () => {
    it('HPが回復される（上限は最大HP）', () => {
      const run = makeRun({ hp: 50, mhp: 80 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'heal', amount: 40 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(80); // 50 + 40 = 90 → mhp(80) でクランプ
    });

    it('HP満タンの場合は変化しない', () => {
      const run = makeRun({ hp: 80, mhp: 80 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'heal', amount: 15 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(80);
    });
  });

  describe('damage 効果', () => {
    it('HPが減少する（最低1まで）', () => {
      const run = makeRun({ hp: 30 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'damage', amount: 25 },
        riskLevel: 'dangerous',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(5); // 30 - 25 = 5
    });

    it('HPが0以下にならない（最低1）', () => {
      const run = makeRun({ hp: 10 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'damage', amount: 100 },
        riskLevel: 'dangerous',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(1);
    });
  });

  describe('bone_change 効果', () => {
    it('骨が増加する', () => {
      const run = makeRun({ bE: 10 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'bone_change', amount: 20 },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.bE).toBe(30);
    });
  });

  describe('civ_level_up 効果', () => {
    it('tech のレベルが1上がる', () => {
      const run = makeRun({ cT: 2 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'civ_level_up', civType: 'tech' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.cT).toBe(3);
    });

    it('life のレベルが1上がる', () => {
      const run = makeRun({ cL: 3 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'civ_level_up', civType: 'life' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.cL).toBe(4);
    });

    it('rit のレベルが1上がる', () => {
      const run = makeRun({ cR: 1 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'civ_level_up', civType: 'rit' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.cR).toBe(2);
    });

    it('dominant の場合は最もレベルの高い文明が上がる', () => {
      const run = makeRun({ cT: 2, cL: 5, cR: 3 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'civ_level_up', civType: 'dominant' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.cL).toBe(6); // life が最高なので +1
    });
  });

  describe('nothing 効果', () => {
    it('何も変化しない', () => {
      const run = makeRun();
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.hp).toBe(run.hp);
      expect(result.atk).toBe(run.atk);
      expect(result.def).toBe(run.def);
    });
  });

  describe('random_evolution 効果', () => {
    it('ランダム進化で取得進化が1つ増える', () => {
      const run = makeRun({ evs: [] });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'random_evolution' },
        riskLevel: 'risky',
      };
      const result = applyEventChoice(run, choice);
      expect(result.evs.length).toBe(1);
    });
  });

  describe('add_ally 効果', () => {
    it('仲間枠に空きがある場合、仲間が追加される', () => {
      const run = makeRun({ al: [], mxA: 3, cT: 2, cL: 1, cR: 0 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'add_ally', allyTemplate: 'random' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.al.length).toBe(1);
    });

    it('仲間枠が満杯の場合、仲間は追加されない', () => {
      const allies = [
        { n: 'A', hp: 10, mhp: 10, atk: 3, t: 'tech' as const, a: 1 },
        { n: 'B', hp: 10, mhp: 10, atk: 3, t: 'life' as const, a: 1 },
        { n: 'C', hp: 10, mhp: 10, atk: 3, t: 'rit' as const, a: 1 },
      ];
      const run = makeRun({ al: allies, mxA: 3 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'add_ally', allyTemplate: 'random' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.al.length).toBe(3); // 変化なし
    });
  });

  describe('イミュータブル性', () => {
    it('元のRunStateが変更されない', () => {
      const run = makeRun({ hp: 50, atk: 10 });
      const originalHp = run.hp;
      const originalAtk = run.atk;
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'stat_change', stat: 'atk', value: 8 },
        riskLevel: 'safe',
      };
      applyEventChoice(run, choice);
      expect(run.hp).toBe(originalHp);
      expect(run.atk).toBe(originalAtk);
    });
  });

  describe('eventCount', () => {
    it('イベント適用後にeventCountが1増える', () => {
      const run = makeRun({ eventCount: 2 });
      const choice: EventChoice = {
        label: 'テスト', description: 'テスト',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      };
      const result = applyEventChoice(run, choice);
      expect(result.eventCount).toBe(3);
    });
  });
});
