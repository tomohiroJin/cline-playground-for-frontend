/**
 * 原始進化録 - PRIMAL PATH - ランダムイベントテスト
 */
import {
  rollEvent, applyEventChoice, dominantCiv, formatEventResult,
  computeEventResult, getEffectHintColor, getEffectHintIcon,
} from '../game-logic';
import type { RunState, EventChoice, EventId, RandomEventDef, EventEffect } from '../types';
import { RANDOM_EVENTS, EVOS, EVENT_CHANCE, EVENT_MIN_BATTLES } from '../constants';
import { makeRun } from './test-helpers';

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

  it('全イベントにsituationTextが定義されている', () => {
    for (const evt of RANDOM_EVENTS) {
      expect(typeof evt.situationText).toBe('string');
      expect(evt.situationText.length).toBeGreaterThan(0);
    }
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

/* ===== バランス調整検証（FB-P3-2） ===== */

describe('イベントバランス調整', () => {
  /** ヘルパー: イベントIDで定数を検索 */
  const findEvent = (id: EventId) =>
    RANDOM_EVENTS.find(e => e.id === id)!;

  describe('迷い仲間（lost_ally）', () => {
    it('助ける側にHP消費リスク（damage効果）がある', () => {
      const evt = findEvent('lost_ally');
      const helpChoice = evt.choices.find(c => c.label.includes('助ける'))!;
      // 助ける側は複合効果 or ダメージリスクを含む
      expect(helpChoice.riskLevel).not.toBe('safe');
    });

    it('立ち去る側に小さな報酬がある', () => {
      const evt = findEvent('lost_ally');
      const leaveChoice = evt.choices.find(c => c.label.includes('立ち去る'))!;
      expect(leaveChoice.effect.type).not.toBe('nothing');
    });
  });

  describe('毒沼（poison_swamp）', () => {
    it('突っ切る側に報酬（stat_change）がある', () => {
      const evt = findEvent('poison_swamp');
      const rushChoice = evt.choices.find(c => c.label.includes('突っ切る'))!;
      // 効果がステータス変更であること（ダメージだけでなく報酬付き）
      expect(rushChoice.effect.type).toBe('stat_change');
    });
  });

  describe('獣の巣穴（beast_den）', () => {
    it('探索にhp_damageコストがある（ダメージリスク）', () => {
      const evt = findEvent('beast_den');
      const exploreChoice = evt.choices.find(c => c.label.includes('探索'))!;
      expect(exploreChoice.cost).toBeDefined();
      expect(exploreChoice.cost!.type).toBe('hp_damage');
    });

    it('見なかったことにする側に小報酬がある', () => {
      const evt = findEvent('beast_den');
      const ignoreChoice = evt.choices.find(c => c.label.includes('見なかった'))!;
      expect(ignoreChoice.effect.type).not.toBe('nothing');
    });
  });

  describe('星降る夜（starry_night）', () => {
    it('瞑想の回復量が40未満に調整されている', () => {
      const evt = findEvent('starry_night');
      const meditateChoice = evt.choices.find(c => c.label.includes('瞑想'))!;
      if (meditateChoice.effect.type === 'heal') {
        expect(meditateChoice.effect.amount).toBeLessThan(40);
      }
    });
  });

  describe('hp_damage コスト', () => {
    it('毒沼の突っ切るにhp_damageコストがある', () => {
      const evt = findEvent('poison_swamp');
      const rushChoice = evt.choices.find(c => c.label.includes('突っ切る'))!;
      expect(rushChoice.cost).toBeDefined();
      expect(rushChoice.cost!.type).toBe('hp_damage');
      expect(rushChoice.cost!.amount).toBeGreaterThan(0);
    });

    it('獣の巣穴の探索にhp_damageコストがある', () => {
      const evt = findEvent('beast_den');
      const exploreChoice = evt.choices.find(c => c.label.includes('探索'))!;
      expect(exploreChoice.cost).toBeDefined();
      expect(exploreChoice.cost!.type).toBe('hp_damage');
      expect(exploreChoice.cost!.amount).toBeGreaterThan(0);
    });
  });
});

/* ===== formatEventResult（FB-P3-1） ===== */

describe('formatEventResult', () => {
  it('stat_change ATK をフォーマットする', () => {
    const result = formatEventResult({ type: 'stat_change', stat: 'atk', value: 8 });
    expect(result.icon).toBe('💪');
    expect(result.text).toContain('ATK');
    expect(result.text).toContain('+8');
  });

  it('stat_change DEF をフォーマットする', () => {
    const result = formatEventResult({ type: 'stat_change', stat: 'def', value: 5 });
    expect(result.icon).toBe('🛡️');
    expect(result.text).toContain('DEF');
    expect(result.text).toContain('+5');
  });

  it('stat_change HP をフォーマットする', () => {
    const result = formatEventResult({ type: 'stat_change', stat: 'hp', value: 10 });
    expect(result.icon).toBe('❤️');
    expect(result.text).toContain('最大HP');
    expect(result.text).toContain('+10');
  });

  it('heal をフォーマットする', () => {
    const result = formatEventResult({ type: 'heal', amount: 25 });
    expect(result.icon).toBe('💚');
    expect(result.text).toContain('HP');
    expect(result.text).toContain('25');
  });

  it('damage をフォーマットする', () => {
    const result = formatEventResult({ type: 'damage', amount: 20 });
    expect(result.icon).toBe('💔');
    expect(result.text).toContain('20');
  });

  it('bone_change をフォーマットする', () => {
    const result = formatEventResult({ type: 'bone_change', amount: 20 });
    expect(result.icon).toBe('🦴');
    expect(result.text).toContain('+20');
  });

  it('civ_level_up をフォーマットする', () => {
    const result = formatEventResult({ type: 'civ_level_up', civType: 'tech' });
    expect(result.icon).toBe('📈');
    expect(result.text).toContain('文明レベル');
  });

  it('random_evolution をフォーマットする', () => {
    const result = formatEventResult({ type: 'random_evolution' });
    expect(result.icon).toBe('🧬');
    expect(result.text).toContain('進化');
  });

  it('nothing をフォーマットする', () => {
    const result = formatEventResult({ type: 'nothing' });
    expect(result.icon).toBe('…');
    expect(result.text).toContain('何も起こらなかった');
  });

  it('add_ally をフォーマットする', () => {
    const result = formatEventResult({ type: 'add_ally', allyTemplate: 'random' });
    expect(result.icon).toBe('🤝');
    expect(result.text).toContain('仲間');
  });

  it('hp_damageコスト付きの場合、コスト情報が含まれる', () => {
    const result = formatEventResult(
      { type: 'stat_change', stat: 'atk', value: 5 },
      { type: 'hp_damage', amount: 20 },
    );
    expect(result.text).toContain('ATK');
    expect(result.text).toContain('HP');
  });

  it('boneコスト付きの場合、コスト情報が含まれる', () => {
    const result = formatEventResult(
      { type: 'stat_change', stat: 'atk', value: 8 },
      { type: 'bone', amount: 30 },
    );
    expect(result.text).toContain('ATK');
    expect(result.text).toContain('骨');
  });

  it('random_evolution で進化名が渡された場合、具体的な名前が表示される', () => {
    const result = formatEventResult(
      { type: 'random_evolution' },
      undefined,
      '火の爪',
    );
    expect(result.icon).toBe('🧬');
    expect(result.text).toContain('火の爪');
  });

  it('random_evolution で進化名が無い場合、汎用テキストが表示される', () => {
    const result = formatEventResult(
      { type: 'random_evolution' },
    );
    expect(result.text).toContain('ランダムな進化');
  });
});

/* ===== computeEventResult（FB-P3-R2-1） ===== */

describe('computeEventResult', () => {
  it('基本効果とコストを適用したrunを返す', () => {
    // Arrange
    const run = makeRun({ atk: 10 });
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
    };

    // Act
    const { nextRun } = computeEventResult(run, choice);

    // Assert
    expect(nextRun.atk).toBe(18);
  });

  it('boneコストを適用する', () => {
    const run = makeRun({ bE: 50, atk: 10 });
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
      cost: { type: 'bone', amount: 30 },
    };

    const { nextRun } = computeEventResult(run, choice);

    expect(nextRun.bE).toBe(20);
    expect(nextRun.atk).toBe(18);
  });

  it('hp_damageコストを適用する', () => {
    const run = makeRun({ hp: 50, atk: 10 });
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'stat_change', stat: 'atk', value: 5 },
      riskLevel: 'dangerous',
      cost: { type: 'hp_damage', amount: 20 },
    };

    const { nextRun } = computeEventResult(run, choice);

    expect(nextRun.hp).toBe(30);
    expect(nextRun.atk).toBe(15);
  });

  it('random_evolution の場合、獲得した進化名を返す', () => {
    const run = makeRun({ evs: [], cT: 2, cL: 1, cR: 0 });
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'random_evolution' },
      riskLevel: 'risky',
    };

    const { nextRun, evoName } = computeEventResult(run, choice, () => 0);

    expect(nextRun.evs.length).toBe(1);
    expect(evoName).toBeDefined();
    expect(typeof evoName).toBe('string');
    expect(evoName!.length).toBeGreaterThan(0);
  });

  it('random_evolution 以外の場合、evoName は undefined', () => {
    const run = makeRun({ atk: 10 });
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
    };

    const { evoName } = computeEventResult(run, choice);

    expect(evoName).toBeUndefined();
  });

  it('元のRunStateを変更しない（イミュータブル）', () => {
    const run = makeRun({ hp: 50, atk: 10 });
    const originalHp = run.hp;
    const choice: EventChoice = {
      label: 'テスト', description: 'テスト',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
      cost: { type: 'hp_damage', amount: 20 },
    };

    computeEventResult(run, choice);

    expect(run.hp).toBe(originalHp);
    expect(run.atk).toBe(10);
  });
});

/* ===== getEffectHintColor（FB-P3-3） ===== */

describe('getEffectHintColor', () => {
  it('heal は緑を返す', () => {
    expect(getEffectHintColor({ type: 'heal', amount: 10 })).toBe('#50e090');
  });

  it('damage は赤を返す', () => {
    expect(getEffectHintColor({ type: 'damage', amount: 5 })).toBe('#f05050');
  });

  it('stat_change は金を返す', () => {
    expect(getEffectHintColor({ type: 'stat_change', stat: 'atk', value: 3 })).toBe('#f0c040');
  });

  it('add_ally は青を返す', () => {
    expect(getEffectHintColor({ type: 'add_ally', allyTemplate: 'random' })).toBe('#50a0e0');
  });

  it('random_evolution は紫を返す', () => {
    expect(getEffectHintColor({ type: 'random_evolution' })).toBe('#c060f0');
  });

  it('civ_level_up は金を返す', () => {
    expect(getEffectHintColor({ type: 'civ_level_up', civType: 'tech' })).toBe('#f0c040');
  });

  it('bone_change は骨色を返す', () => {
    expect(getEffectHintColor({ type: 'bone_change', amount: 20 })).toBe('#c0a040');
  });

  it('nothing はグレーを返す', () => {
    expect(getEffectHintColor({ type: 'nothing' })).toBe('#606060');
  });
});

/* ===== getEffectHintIcon（FB-P3-3） ===== */

describe('getEffectHintIcon', () => {
  it('全エフェクトタイプに対応するアイコンを返す', () => {
    const cases: { effect: EventEffect; icon: string }[] = [
      { effect: { type: 'heal', amount: 10 }, icon: '💚' },
      { effect: { type: 'damage', amount: 5 }, icon: '💔' },
      { effect: { type: 'stat_change', stat: 'atk', value: 3 }, icon: '📈' },
      { effect: { type: 'add_ally', allyTemplate: 'random' }, icon: '🤝' },
      { effect: { type: 'random_evolution' }, icon: '🧬' },
      { effect: { type: 'civ_level_up', civType: 'tech' }, icon: '🏛️' },
      { effect: { type: 'bone_change', amount: 20 }, icon: '🦴' },
      { effect: { type: 'nothing' }, icon: '…' },
    ];
    for (const { effect, icon } of cases) {
      expect(getEffectHintIcon(effect)).toBe(icon);
    }
  });
});
