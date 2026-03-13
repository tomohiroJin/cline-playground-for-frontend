import type { GameState, LaneIndex } from '../../types';
import { mergeStyles } from '../../utils';
import type { useStore } from '../useStore';
import type { GameMode } from './useRunningPhase';

type StoreApi = ReturnType<typeof useStore>;

/** ゲーム初期値の定数 */
const MOVE_CD_MIN = 40;
const MOVE_CD_BASE = 120;
const ORACLE_BF_ADJ = -2;
const DEFAULT_BF_ADJ_LANE = -1;
const SCORE_BASE_BONUS = 5;
const INITIAL_BF0: readonly number[] = [0, 4, 6];
const DEFAULT_MAX_STAGE = 4;
const UNLOCKED_MAX_STAGE = 5;
const INITIAL_LANE: LaneIndex = 1;

/**
 * ゲーム状態の初期オブジェクトを生成するファクトリ関数
 */
export function createGameState(
  eq: string[],
  store: StoreApi,
  mode: GameMode = 'normal',
): GameState {
  const base = mergeStyles(eq);
  let mx = store.hasUnlock('stage6') ? UNLOCKED_MAX_STAGE : DEFAULT_MAX_STAGE;
  if (mode === 'practice') mx = 0;
  const state: GameState = {
    st: {
      mu: [...base.mu],
      rs: [...base.rs],
      sf: [],
      wm: base.wm,
      cm: base.cm,
      sh: base.sh,
      sp: base.sp,
      db: base.db,
      cb: base.cb,
      bfSet: [...base.bfSet],
      autoBlock: base.autoBlock,
    },
    score: 0,
    stage: 0,
    cycle: 0,
    lane: INITIAL_LANE,
    alive: true,
    phase: 'idle',
    shields: base.sh,
    frozen: 0,
    moveOk: true,
    moveCd: Math.max(MOVE_CD_MIN, MOVE_CD_BASE * (1 + base.cm)),
    comboCount: 0,
    maxCombo: 0,
    riskScore: 0,
    total: 0,
    nearMiss: 0,
    scoreMult: 1,
    comboBonus: 0,
    slowMod: 0,
    speedMod: 0,
    revive: 0,
    bfAdj: store.hasUnlock('oracle') ? ORACLE_BF_ADJ : 0,
    bfAdj_lane: DEFAULT_BF_ADJ_LANE,
    bfAdj_extra: 0,
    baseBonus: store.hasUnlock('score_base') ? SCORE_BASE_BONUS : 0,
    perks: [],
    perkChoices: null,
    stageMod: null,
    curStgCfg: null,
    curBf0: [...INITIAL_BF0],
    artState: 'idle',
    maxStg: mx,
    walkFrame: 0,
    artFrame: 0,
    shelterSaves: 0,
    dailyMode: mode === 'daily',
    practiceMode: mode === 'practice',
    ghostLog: [],
  };
  return state;
}
