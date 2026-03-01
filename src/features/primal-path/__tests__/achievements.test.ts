/**
 * 原始進化録 - PRIMAL PATH - ラン統計・実績・チャレンジテスト
 */
import {
  calcRunStats, checkAchievement, applyChallenge,
} from '../game-logic';
import type { RunState, AchievementDef, RunStats, AggregateStats, ChallengeDef } from '../types';
import {
  ACHIEVEMENTS, CHALLENGES,
  STATS_KEY, ACHIEVEMENTS_KEY, AGGREGATE_KEY,
} from '../constants';
import { makeRun } from './test-helpers';
import { MetaStorage } from '../storage';

function makeAggregateStats(overrides: Partial<AggregateStats> = {}): AggregateStats {
  return {
    totalRuns: 0,
    totalClears: 0,
    totalKills: 0,
    totalBoneEarned: 0,
    totalEvents: 0,
    clearedDifficulties: [],
    achievedAwakenings: [],
    achievedSynergiesTier1: [],
    achievedSynergiesTier2: [],
    clearedChallenges: [],
    treeCompletionRate: 0,
    lastBossDamageTaken: 0,
    ...overrides,
  };
}

/* ===== calcRunStats ===== */

describe('calcRunStats', () => {
  it('勝利ランの統計を正しく集計する', () => {
    const run = makeRun({
      kills: 15, dmgDealt: 500, dmgTaken: 200, maxHit: 45,
      bc: 3, evs: [{ n: 'a', d: '', t: 'tech', r: 0, e: {} }],
      eventCount: 2, bE: 100, bb: 20,
      awoken: [{ id: 'sa_tech', nm: '技術覚醒', cl: '#f00' }],
    });
    const stats = calcRunStats(run, 'victory', 120);
    expect(stats.result).toBe('victory');
    expect(stats.totalKills).toBe(15);
    expect(stats.totalDamageDealt).toBe(500);
    expect(stats.totalDamageTaken).toBe(200);
    expect(stats.maxDamage).toBe(45);
    expect(stats.biomeCount).toBe(3);
    expect(stats.evolutionCount).toBe(1);
    expect(stats.eventCount).toBe(2);
    expect(stats.boneEarned).toBe(120);
    expect(stats.playtimeSeconds).toBeGreaterThanOrEqual(0);
    expect(stats.awakening).toBe('技術覚醒');
  });

  it('敗北ランの統計を正しく集計する', () => {
    const run = makeRun({ kills: 3, bc: 1 });
    const stats = calcRunStats(run, 'defeat', 60);
    expect(stats.result).toBe('defeat');
    expect(stats.totalKills).toBe(3);
    expect(stats.biomeCount).toBe(1);
    expect(stats.awakening).toBeUndefined();
  });

  it('難易度が統計に正しく記録される', () => {
    const run = makeRun({ di: 2 });
    const stats = calcRunStats(run, 'defeat', 30);
    expect(stats.difficulty).toBe(2);
  });

  it('IDはユニークな文字列である', () => {
    const run = makeRun();
    const s1 = calcRunStats(run, 'defeat', 10);
    const s2 = calcRunStats(run, 'defeat', 10);
    expect(typeof s1.id).toBe('string');
    expect(s1.id.length).toBeGreaterThan(0);
  });

  it('日付がISO形式で記録される', () => {
    const run = makeRun();
    const stats = calcRunStats(run, 'victory', 0);
    expect(stats.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('スキル使用回数が0で初期化される', () => {
    const run = makeRun();
    const stats = calcRunStats(run, 'victory', 0);
    expect(stats.skillUsageCount).toBe(0);
  });

  it('シナジー数が取得済み進化から計算される', () => {
    const run = makeRun({
      evs: [
        { n: 'a', d: '', t: 'tech', r: 0, e: {}, tags: ['fire'] },
        { n: 'b', d: '', t: 'tech', r: 0, e: {}, tags: ['fire'] },
      ],
    });
    const stats = calcRunStats(run, 'victory', 0);
    expect(stats.synergyCount).toBe(1); // 1つのシナジー発動
  });

  it('チャレンジIDがundefinedとなる（通常ラン）', () => {
    const run = makeRun();
    const stats = calcRunStats(run, 'victory', 0);
    expect(stats.challengeId).toBeUndefined();
  });
});

/* ===== checkAchievement ===== */

describe('checkAchievement', () => {
  const findAch = (id: string): AchievementDef =>
    ACHIEVEMENTS.find(a => a.id === id)!;

  describe('first_clear', () => {
    it('初勝利で解除される', () => {
      const stats = makeAggregateStats();
      const runStats: RunStats = {
        id: '1', date: '', result: 'victory', difficulty: 0,
        biomeCount: 3, totalKills: 10, maxDamage: 30,
        totalDamageDealt: 200, totalDamageTaken: 100,
        totalHealing: 0, evolutionCount: 5, synergyCount: 0,
        eventCount: 0, skillUsageCount: 0, boneEarned: 50,
        playtimeSeconds: 120, awakening: undefined, challengeId: undefined,
      };
      expect(checkAchievement(findAch('first_clear'), stats, runStats)).toBe(true);
    });

    it('敗北では解除されない', () => {
      const stats = makeAggregateStats();
      const runStats: RunStats = {
        id: '1', date: '', result: 'defeat', difficulty: 0,
        biomeCount: 1, totalKills: 3, maxDamage: 10,
        totalDamageDealt: 50, totalDamageTaken: 80,
        totalHealing: 0, evolutionCount: 2, synergyCount: 0,
        eventCount: 0, skillUsageCount: 0, boneEarned: 10,
        playtimeSeconds: 60, awakening: undefined, challengeId: undefined,
      };
      expect(checkAchievement(findAch('first_clear'), stats, runStats)).toBe(false);
    });
  });

  describe('clear_count', () => {
    it('10回クリアで解除される', () => {
      const stats = makeAggregateStats({ totalClears: 10 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('clear_10'), stats, runStats)).toBe(true);
    });

    it('9回では解除されない', () => {
      const stats = makeAggregateStats({ totalClears: 9 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('clear_10'), stats, runStats)).toBe(false);
    });
  });

  describe('clear_difficulty', () => {
    it('氷河期クリアで解除される', () => {
      const stats = makeAggregateStats({ clearedDifficulties: [0, 1] });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('clear_hard'), stats, runStats)).toBe(true);
    });
  });

  describe('all_difficulties_cleared', () => {
    it('全4難易度クリアで解除される', () => {
      const stats = makeAggregateStats({ clearedDifficulties: [0, 1, 2, 3] });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('all_difficulties'), stats, runStats)).toBe(true);
    });

    it('3難易度では解除されない', () => {
      const stats = makeAggregateStats({ clearedDifficulties: [0, 1, 2] });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('all_difficulties'), stats, runStats)).toBe(false);
    });
  });

  describe('all_awakenings', () => {
    it('全覚醒達成で解除される', () => {
      const stats = makeAggregateStats({ achievedAwakenings: ['tech', 'life', 'rit', 'bal'] });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('all_awakenings'), stats, runStats)).toBe(true);
    });
  });

  describe('max_damage', () => {
    it('100ダメージ以上で解除される', () => {
      const stats = makeAggregateStats();
      const runStats = { result: 'victory', maxDamage: 100 } as RunStats;
      expect(checkAchievement(findAch('big_damage'), stats, runStats)).toBe(true);
    });

    it('99ダメージでは解除されない', () => {
      const stats = makeAggregateStats();
      const runStats = { result: 'victory', maxDamage: 99 } as RunStats;
      expect(checkAchievement(findAch('big_damage'), stats, runStats)).toBe(false);
    });
  });

  describe('total_kills', () => {
    it('累計100撃破で解除される', () => {
      const stats = makeAggregateStats({ totalKills: 100 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('mass_slayer'), stats, runStats)).toBe(true);
    });
  });

  describe('synergy_tier2', () => {
    it('火シナジーTier2達成で解除される', () => {
      const stats = makeAggregateStats({ achievedSynergiesTier2: ['fire'] });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('fire_master'), stats, runStats)).toBe(true);
    });
  });

  describe('all_synergies_tier1', () => {
    it('全シナジーTier1で解除される', () => {
      const stats = makeAggregateStats({
        achievedSynergiesTier1: ['fire', 'ice', 'regen', 'shield', 'hunt', 'spirit', 'tribe', 'wild'],
      });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('all_synergies'), stats, runStats)).toBe(true);
    });
  });

  describe('event_count', () => {
    it('累計10イベントで解除される', () => {
      const stats = makeAggregateStats({ totalEvents: 10 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('event_explorer'), stats, runStats)).toBe(true);
    });
  });

  describe('speed_clear', () => {
    it('5分以内のクリアで解除される', () => {
      const stats = makeAggregateStats();
      const runStats = { result: 'victory', playtimeSeconds: 300 } as RunStats;
      expect(checkAchievement(findAch('speed_runner'), stats, runStats)).toBe(true);
    });

    it('敗北では解除されない', () => {
      const stats = makeAggregateStats();
      const runStats = { result: 'defeat', playtimeSeconds: 100 } as RunStats;
      expect(checkAchievement(findAch('speed_runner'), stats, runStats)).toBe(false);
    });
  });

  describe('bone_hoarder', () => {
    it('累計1000骨で解除される', () => {
      const stats = makeAggregateStats({ totalBoneEarned: 1000 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('bone_collector'), stats, runStats)).toBe(true);
    });
  });

  describe('full_tree', () => {
    it('ツリー完成率100%で解除される', () => {
      const stats = makeAggregateStats({ treeCompletionRate: 1.0 });
      const runStats = { result: 'victory' } as RunStats;
      expect(checkAchievement(findAch('full_tree'), stats, runStats)).toBe(true);
    });
  });
});

/* ===== 実績定数検証 ===== */

describe('実績定数', () => {
  it('15個の実績が定義されている', () => {
    expect(ACHIEVEMENTS).toHaveLength(15);
  });

  it('全実績IDがユニークである', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全実績にアイコンが設定されている', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.icon.length).toBeGreaterThan(0);
    }
  });
});

/* ===== チャレンジ ===== */

describe('チャレンジ定数', () => {
  it('3種のチャレンジが定義されている', () => {
    expect(CHALLENGES).toHaveLength(3);
  });

  it('全チャレンジIDがユニークである', () => {
    const ids = CHALLENGES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('applyChallenge', () => {
  it('脆き肉体: HPが半減し敵ATK+25%される', () => {
    const run = makeRun({ hp: 80, mhp: 80 });
    const challenge = CHALLENGES.find(c => c.id === 'fragile')!;
    const next = applyChallenge(run, challenge);
    expect(next.mhp).toBe(40);
    expect(next.hp).toBe(40);
  });

  it('原始回帰: 進化制限が設定される', () => {
    const run = makeRun();
    const challenge = CHALLENGES.find(c => c.id === 'minimalist')!;
    const next = applyChallenge(run, challenge);
    expect(next.maxEvo).toBe(5);
  });

  it('生存競争: 制限時間が設定される', () => {
    const run = makeRun();
    const challenge = CHALLENGES.find(c => c.id === 'time_trial')!;
    const next = applyChallenge(run, challenge);
    expect(next.timeLimit).toBe(600);
  });

  it('チャレンジ適用はイミュータブルである', () => {
    const run = makeRun();
    const challenge = CHALLENGES.find(c => c.id === 'fragile')!;
    const next = applyChallenge(run, challenge);
    expect(next).not.toBe(run);
    expect(run.mhp).toBe(80); // 元の値は変わらない
  });
});

/* ===== MetaStorage ===== */

describe('MetaStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('RunStats', () => {
    it('保存・読込のラウンドトリップが正しく動作する', () => {
      const stats: RunStats[] = [{
        id: '1', date: '2026-01-01', result: 'victory', difficulty: 0,
        biomeCount: 3, totalKills: 10, maxDamage: 50,
        totalDamageDealt: 500, totalDamageTaken: 200,
        totalHealing: 100, evolutionCount: 8, synergyCount: 2,
        eventCount: 3, skillUsageCount: 5, boneEarned: 100,
        playtimeSeconds: 180, awakening: 'tech', challengeId: undefined,
      }];
      MetaStorage.saveRunStats(stats);
      const loaded = MetaStorage.loadRunStats();
      expect(loaded).toEqual(stats);
    });

    it('データがない場合は空配列を返す', () => {
      expect(MetaStorage.loadRunStats()).toEqual([]);
    });

    it('最新50件のみ保持される', () => {
      const stats: RunStats[] = Array.from({ length: 60 }, (_, i) => ({
        id: String(i), date: '', result: 'victory' as const, difficulty: 0,
        biomeCount: 3, totalKills: 10, maxDamage: 50,
        totalDamageDealt: 500, totalDamageTaken: 200,
        totalHealing: 100, evolutionCount: 8, synergyCount: 2,
        eventCount: 3, skillUsageCount: 5, boneEarned: 100,
        playtimeSeconds: 180, awakening: undefined, challengeId: undefined,
      }));
      MetaStorage.saveRunStats(stats);
      const loaded = MetaStorage.loadRunStats();
      expect(loaded).toHaveLength(50);
      // 最新50件（末尾から50件）が保持される
      expect(loaded[0].id).toBe('10');
    });
  });

  describe('AchievementState', () => {
    it('保存・読込のラウンドトリップが正しく動作する', () => {
      const states = [
        { id: 'first_clear', unlocked: true, unlockedDate: '2026-01-01' },
        { id: 'clear_10', unlocked: false, unlockedDate: undefined },
      ];
      MetaStorage.saveAchievements(states);
      const loaded = MetaStorage.loadAchievements();
      expect(loaded).toEqual(states);
    });

    it('データがない場合は空配列を返す', () => {
      expect(MetaStorage.loadAchievements()).toEqual([]);
    });
  });

  describe('AggregateStats', () => {
    it('保存・読込のラウンドトリップが正しく動作する', () => {
      const stats = makeAggregateStats({ totalRuns: 42, totalClears: 28 });
      MetaStorage.saveAggregate(stats);
      const loaded = MetaStorage.loadAggregate();
      expect(loaded).toEqual(stats);
    });

    it('データがない場合は初期値を返す', () => {
      const loaded = MetaStorage.loadAggregate();
      expect(loaded.totalRuns).toBe(0);
      expect(loaded.totalClears).toBe(0);
      expect(loaded.clearedDifficulties).toEqual([]);
    });
  });

  describe('ストレージキー', () => {
    it('正しいキーが定義されている', () => {
      expect(STATS_KEY).toBe('primal-path-stats');
      expect(ACHIEVEMENTS_KEY).toBe('primal-path-achievements');
      expect(AGGREGATE_KEY).toBe('primal-path-aggregate');
    });
  });
});
