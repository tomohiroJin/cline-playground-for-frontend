/**
 * シナリオレビュー指摘修正テスト
 *
 * #1: fe 未設定でも最終ボスに進める（civ レベルフォールバック）
 * #2: bal ルートの最終ボスが存在する
 * #3: Tier2 覚醒は 1 回のみ
 * #8: endlessWave がランごとにリセットされる
 */
import { resolveFinalBossKey } from '../domain/battle/boss-service';
import { checkAwakeningRules } from '../domain/awakening/awakening-service';
import { startRunState } from '../domain/progression/run-service';
import { BOSS, FINAL_BOSS_ORDER } from '../constants/battle';
import type { RunState, SaveData } from '../types';

/** テスト用の最小 RunState を生成 */
function makeRun(overrides: Partial<RunState> = {}): RunState {
  const base: RunState = {
    hp: 80, mhp: 80, atk: 10, def: 2, cr: 0.05, aM: 1, dm: 1,
    cT: 0, cL: 0, cR: 0,
    al: [], evs: [], bE: 0, bb: 0,
    cB: 3, cBT: 'grassland', cW: 5, wpb: 4,
    bms: ['grassland', 'glacier', 'volcano'],
    bc: 3, di: 0, dd: { hm: 1, am: 1, em: 1, bm: 1, bb: 1 },
    log: [], wTurn: 0, btlCount: 12, eventCount: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0,
    en: null, rvU: 0,
    sk: { avl: [], cds: {}, bfs: [] },
    awoken: [], fe: null,
    saReq: 4, fReq: 5, evoN: 3, mxA: 3,
    tb: { bA: 0, bH: 0, bD: 0, rr: 0, bM: 0, iR: 0, fR: 0, aH: 0, aA: 0, cr: 0, sC: 0, rg: 0, rv: 0, aS: 0, eN: 0, fQ: 0, dM: 0, aQ: 0, rP: 0 },
    _fbk: '', _fPhase: 0, _wDmgBase: 0,
    isEndless: false, endlessWave: 0,
  } as unknown as RunState;
  return { ...base, ...overrides };
}

describe('#1: fe 未設定でも最終ボスに進める', () => {
  it('resolveFinalBossKey は fe=null のとき最高 civ レベルで決定する', () => {
    const run = makeRun({ fe: null, cT: 5, cL: 3, cR: 2 });
    expect(resolveFinalBossKey(run)).toBe('ft');
  });

  it('resolveFinalBossKey は fe=bal のとき bal 用ボスキーを返す', () => {
    const run = makeRun({ fe: 'bal' as never });
    const key = resolveFinalBossKey(run);
    expect(key).toBeDefined();
    expect(BOSS[key]).toBeDefined();
  });
});

describe('#2: bal ルートの最終ボス', () => {
  it('FINAL_BOSS_ORDER に bal 用エントリが存在する', () => {
    expect(FINAL_BOSS_ORDER['fb']).toBeDefined();
    expect(FINAL_BOSS_ORDER['fb'].length).toBeGreaterThanOrEqual(1);
  });

  it('BOSS に bal 用の最終ボスが存在する', () => {
    expect(BOSS['fb']).toBeDefined();
    expect(BOSS['fb'].n).toBeTruthy();
  });
});

describe('#3: Tier2 覚醒は 1 回のみ', () => {
  it('既に Tier2 覚醒済みの場合、別の Tier2 覚醒が返されない', () => {
    const run = makeRun({
      cT: 6, cL: 6, cR: 2,
      awoken: [
        { id: 'sa_tech', nm: '炎の目覚め', cl: '#f08050' },
        { id: 'fa_tech', nm: '炎王の始祖', cl: '#f08050' },
      ],
      fe: 'tech' as never,
    });
    const rule = checkAwakeningRules(run);
    // life Tier2 の条件を満たすが、既に tech Tier2 があるため返されない
    if (rule) {
      expect(rule.tier).not.toBe(2);
    }
  });
});

describe('#8: endlessWave がランごとにリセットされる', () => {
  it('新規ランで endlessWave が 0 にリセットされる', () => {
    const save: SaveData = {
      bones: 100, tree: {}, clears: 5, runs: 10,
      best: {}, loopCount: 0,
    };
    const run = startRunState(0, save);
    expect(run.endlessWave).toBe(0);
    expect(run.isEndless).toBe(false);
  });
});
