/**
 * 原始進化録 - PRIMAL PATH - テスト共通ヘルパー
 */
import type { RunState, SaveData, GameState } from '../types';
import { DIFFS, TB_DEFAULTS, FRESH_SAVE } from '../constants';
import { initialState } from '../hooks';

/** テスト用の最小限 RunState を生成 */
export function makeRun(overrides: Partial<RunState> = {}): RunState {
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
    btlCount: 0, eventCount: 0, skillUseCount: 0, totalHealing: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
    ...overrides,
  };
}

/** テスト用の最小限 SaveData を生成 */
export function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return { ...FRESH_SAVE, ...overrides };
}

/** テスト用の最小限 GameState を生成 */
export function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    ...initialState(),
    ...overrides,
  };
}
