/**
 * 原始進化録 - PRIMAL PATH - カスタムフック
 */
import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import type {
  GameState, GamePhase, RunState, Evolution, SaveData,
  Ally, BiomeId, BgmType, CivTypeExt, SfxType, TickEvent, ASkillId,
  EventChoice, RandomEventDef,
  RunStats, AchievementState, AggregateStats,
} from './types';
import {
  startRunState, startBattle, tick, afterBattle, applyEvo,
  applyAwkFx, checkAwakeningRules, rollE, calcBoneReward,
  startFinalBoss, handleFinalBossKill, pickBiomeAuto,
  applyBiomeSelection, applyFirstBiome, applyAutoLastBiome,
  deadAllies, allyReviveCost, getTB, applySkill,
  rollEvent, applyEventChoice,
  calcRunStats, checkAchievement, applyChallenge, calcSynergies,
} from './game-logic';
import { AWK_SA, AWK_FA, BOSS, DIFFS, BIO, FRESH_SAVE, TREE as TREE_DATA, ACHIEVEMENTS, CHALLENGES } from './constants';
import { AudioEngine, BgmEngine } from './audio';
import { Storage, MetaStorage } from './storage';

/* ===== Action Types ===== */

type GameAction =
  | { type: 'LOAD_SAVE'; save: SaveData }
  | { type: 'START_RUN'; di: number }
  | { type: 'PICK_BIOME'; biome: BiomeId }
  | { type: 'SELECT_EVO'; evo: Evolution }
  | { type: 'PROCEED_AFTER_AWK' }
  | { type: 'PROCEED_TO_BATTLE' }
  | { type: 'BATTLE_TICK'; nextRun: RunState }
  | { type: 'CHANGE_SPEED'; speed: number }
  | { type: 'SURRENDER' }
  | { type: 'AFTER_BATTLE' }
  | { type: 'BIOME_CLEARED' }
  | { type: 'GO_FINAL_BOSS' }
  | { type: 'FINAL_BOSS_KILLED' }
  | { type: 'GAME_OVER'; won: boolean }
  | { type: 'RETURN_TO_TITLE' }
  | { type: 'GO_DIFF' }
  | { type: 'GO_HOW' }
  | { type: 'GO_TREE' }
  | { type: 'BUY_TREE_NODE'; nodeId: string }
  | { type: 'REVIVE_ALLY'; allyIndex: number; pct: number }
  | { type: 'SKIP_REVIVE' }
  | { type: 'SHOW_EVO' }
  | { type: 'RESET_SAVE' }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'PREPARE_BIOME_SELECT' }
  | { type: 'USE_SKILL'; sid: ASkillId }
  | { type: 'TRIGGER_EVENT'; event: RandomEventDef }
  | { type: 'CHOOSE_EVENT'; choice: EventChoice }
  | { type: 'APPLY_EVENT_RESULT'; nextRun: RunState }
  | { type: 'LOAD_META' }
  | { type: 'RECORD_RUN_END'; won: boolean }
  | { type: 'START_CHALLENGE'; challengeId: string; di: number }
  | { type: 'SKIP_EVO' };

/* ===== Initial State ===== */

function initialState(): GameState {
  return {
    phase: 'title',
    save: { ...FRESH_SAVE, tree: {}, best: {} },
    run: null,
    finalMode: false,
    battleSpd: 750,
    evoPicks: [],
    pendingAwk: null,
    reviveTargets: [],
    gameResult: null,
    currentEvent: undefined,
    runStats: [],
    aggregate: MetaStorage.loadAggregate(),
    achievementStates: [],
    newAchievements: [],
  };
}

/* ===== Biome Transition Helper ===== */

function transitionAfterBiome(state: GameState, run: RunState): GameState {
  if (run.bc >= 3) {
    return { ...state, run, phase: 'prefinal' };
  }
  const pick = pickBiomeAuto(run);
  if (pick.needSelection) {
    return { ...state, run, phase: 'biome' };
  }
  const autoRun = applyAutoLastBiome(run);
  const evoPicks = rollE(autoRun);
  return { ...state, run: autoRun, phase: 'evo', evoPicks };
}

/* ===== Meta Progression Helper ===== */

/** ランの結果から累計統計を更新 */
function updateAggregate(prev: AggregateStats, rs: RunStats, run: RunState): AggregateStats {
  const next: AggregateStats = {
    ...prev,
    totalRuns: prev.totalRuns + 1,
    totalKills: prev.totalKills + rs.totalKills,
    totalBoneEarned: prev.totalBoneEarned + rs.boneEarned,
    totalEvents: prev.totalEvents + rs.eventCount,
    clearedDifficulties: [...prev.clearedDifficulties],
    achievedAwakenings: [...prev.achievedAwakenings],
    achievedSynergiesTier1: [...prev.achievedSynergiesTier1],
    achievedSynergiesTier2: [...prev.achievedSynergiesTier2],
    clearedChallenges: [...prev.clearedChallenges],
    treeCompletionRate: prev.treeCompletionRate,
    lastBossDamageTaken: run.dmgTaken,
  };

  if (rs.result === 'victory') {
    next.totalClears = prev.totalClears + 1;
    if (!next.clearedDifficulties.includes(rs.difficulty)) {
      next.clearedDifficulties.push(rs.difficulty);
    }
    if (rs.challengeId && !next.clearedChallenges.includes(rs.challengeId)) {
      next.clearedChallenges.push(rs.challengeId);
    }
  } else {
    next.totalClears = prev.totalClears;
  }

  /* 覚醒記録の更新 */
  for (const aw of run.awoken) {
    if (!next.achievedAwakenings.includes(aw.id)) {
      next.achievedAwakenings.push(aw.id);
    }
  }

  /* シナジー記録の更新 */
  const synergies = calcSynergies(run.evs);
  for (const syn of synergies) {
    if (syn.tier >= 1 && !next.achievedSynergiesTier1.includes(syn.tag)) {
      next.achievedSynergiesTier1.push(syn.tag);
    }
    if (syn.tier >= 2 && !next.achievedSynergiesTier2.includes(syn.tag)) {
      next.achievedSynergiesTier2.push(syn.tag);
    }
  }

  return next;
}

/** 実績チェックを実行し、新規解除を返す */
function checkAllAchievements(
  currentStates: AchievementState[],
  stats: RunStats,
  aggregate: AggregateStats,
): { nextStates: AchievementState[]; newIds: string[] } {
  const newIds: string[] = [];
  const nextStates = ACHIEVEMENTS.map(ach => {
    const existing = currentStates.find(s => s.id === ach.id);
    if (existing?.unlocked) return existing;

    const unlocked = checkAchievement(ach, aggregate, stats);
    if (unlocked) {
      newIds.push(ach.id);
      return { id: ach.id, unlocked: true, unlockedDate: new Date().toISOString() };
    }
    return existing ?? { id: ach.id, unlocked: false, unlockedDate: undefined };
  });

  return { nextStates, newIds };
}

/* ===== Reducer ===== */

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'LOAD_SAVE':
      return { ...state, save: { ...action.save } };

    case 'START_RUN': {
      const save = { ...state.save, runs: state.save.runs + 1 };
      const run = startRunState(action.di, save);
      // Auto pick first biome
      const pick = pickBiomeAuto(run);
      let next = run;
      if (!pick.needSelection) {
        next = applyFirstBiome(run);
      }
      const evoPicks = rollE(next);
      return {
        ...state, save, run: next, phase: 'evo', finalMode: false,
        evoPicks, pendingAwk: null, gameResult: null,
      };
    }

    case 'GO_DIFF':
      return { ...state, phase: 'diff' };

    case 'GO_HOW':
      return { ...state, phase: 'how' };

    case 'GO_TREE':
      return { ...state, phase: 'tree' };

    case 'BUY_TREE_NODE': {
      const { nodeId } = action;
      const nd = TREE_DATA.find(x => x.id === nodeId);
      if (!nd) return state;
      if (state.save.tree[nodeId]) return state;
      if (state.save.bones < nd.c) return state;
      const save = {
        ...state.save,
        bones: state.save.bones - nd.c,
        tree: { ...state.save.tree, [nodeId]: 1 },
      };
      return { ...state, save };
    }

    case 'RETURN_TO_TITLE':
      return { ...state, phase: 'title', run: null, finalMode: false, gameResult: null };

    case 'PREPARE_BIOME_SELECT': {
      if (!state.run) return state;
      return { ...state, phase: 'biome' };
    }

    case 'PICK_BIOME': {
      if (!state.run) return state;
      const next = applyBiomeSelection(state.run, action.biome);
      const evoPicks = rollE(next);
      return { ...state, run: next, phase: 'evo', evoPicks };
    }

    case 'SELECT_EVO': {
      if (!state.run) return state;
      // maxEvo ガード: 進化上限に達している場合はバトルへ直行
      if (state.run.maxEvo !== undefined && state.run.evs.length >= state.run.maxEvo) {
        const battleRun = startBattle(state.run, state.finalMode);
        battleRun.log.push({ x: `⚠️ 進化上限（${state.run.maxEvo}回）に達しました`, c: 'rc' });
        return { ...state, run: battleRun, phase: 'battle' };
      }
      const prevMhp = state.run.mhp;
      const { nextRun, allyJoined, allyRevived } = applyEvo(state.run, action.evo);
      // Check awakening
      const awkRule = checkAwakeningRules(nextRun);
      if (awkRule) {
        return {
          ...state, run: nextRun,
          phase: 'awakening', pendingAwk: awkRule,
        };
      }
      // Start battle
      const battleRun = startBattle(nextRun, state.finalMode);
      // 進化効果をバトルログに表示（HP半減等の重要効果を明示）
      if (action.evo.e.half) {
        battleRun.log.push({ x: `💀 ${action.evo.n}発動！ HP ${prevMhp} → ${battleRun.mhp}`, c: 'rc' });
      }
      if (action.evo.e.aM && action.evo.e.aM > 1) {
        battleRun.log.push({ x: `⚡ ATK倍率 ×${battleRun.aM}`, c: 'gc' });
      }
      return { ...state, run: battleRun, phase: 'battle' };
    }

    case 'PROCEED_AFTER_AWK': {
      if (!state.run) return state;
      // Check for more awakenings
      const awkRule = checkAwakeningRules(state.run);
      if (awkRule) {
        return { ...state, pendingAwk: awkRule };
      }
      // Start battle
      const battleRun = startBattle(state.run, state.finalMode);
      return { ...state, run: battleRun, phase: 'battle', pendingAwk: null };
    }

    case 'PROCEED_TO_BATTLE': {
      if (!state.run || !state.pendingAwk) return state;
      const awk = state.pendingAwk;
      const info = awk.tier === 1
        ? AWK_SA[awk.t as CivTypeExt]
        : AWK_FA[awk.t as CivTypeExt];
      const fe = awk.tier === 2 ? awk.t : undefined;
      const nextRun = applyAwkFx(
        state.run, info.fx, awk.id, info.nm, info.cl,
        fe !== undefined ? fe : null,
      );
      // Check for more awakenings
      const nextAwk = checkAwakeningRules(nextRun);
      if (nextAwk) {
        return { ...state, run: nextRun, pendingAwk: nextAwk };
      }
      // Start battle
      const battleRun = startBattle(nextRun, state.finalMode);
      // 血の契約等のHP半減効果がある場合、バトルログに表示
      if (battleRun.aM > 1) {
        battleRun.log.push({ x: `⚡ ATK倍率 ×${battleRun.aM}`, c: 'gc' });
      }
      return { ...state, run: battleRun, phase: 'battle', pendingAwk: null };
    }

    case 'BATTLE_TICK': {
      return { ...state, run: action.nextRun };
    }

    case 'AFTER_BATTLE': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun, biomeCleared } = afterBattle(state.run);
      if (biomeCleared) {
        const dead = deadAllies(nextRun.al);
        if (dead.length > 0) {
          return { ...state, run: nextRun, phase: 'ally_revive', reviveTargets: dead };
        }
        return transitionAfterBiome(state, nextRun);
      }
      // ランダムイベント発生判定（非ボス戦後のみ）
      const evt = rollEvent(nextRun);
      if (evt) {
        return { ...state, run: nextRun, phase: 'event', currentEvent: evt };
      }
      const evoPicks = rollE(nextRun);
      return { ...state, run: nextRun, phase: 'evo', evoPicks };
    }

    case 'BIOME_CLEARED': {
      if (!state.run) return state;
      return transitionAfterBiome(state, state.run);
    }

    case 'GO_FINAL_BOSS': {
      if (!state.run) return state;
      if (state.run.di >= 3 && !state.run.fe) {
        return { ...state, phase: 'over', gameResult: false };
      }
      const { nextRun } = startFinalBoss(state.run);
      return { ...state, run: nextRun, phase: 'battle', finalMode: true };
    }

    case 'FINAL_BOSS_KILLED': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun, gameWon } = handleFinalBossKill(state.run);
      if (gameWon) {
        const boneReward = calcBoneReward(nextRun, true);
        const save = {
          ...state.save,
          bones: state.save.bones + boneReward,
          clears: state.save.clears + 1,
          best: { ...state.save.best, [nextRun.di]: 1 },
        };
        return { ...state, save, run: nextRun, phase: 'over', gameResult: true, finalMode: false };
      }
      // Phase 2
      return { ...state, run: nextRun, phase: 'battle' };
    }

    case 'GAME_OVER': {
      if (!state.run || state.phase !== 'battle') return state;
      const boneReward = calcBoneReward(state.run, action.won);
      const save = { ...state.save, bones: state.save.bones + boneReward };
      if (action.won) {
        save.clears = save.clears + 1;
        save.best = { ...save.best, [state.run.di]: 1 };
      }
      return { ...state, save, phase: 'over', gameResult: action.won, finalMode: false };
    }

    case 'SURRENDER': {
      if (!state.run) return state;
      const next = { ...state.run, bE: Math.floor(state.run.bE / 2) };
      const boneReward = calcBoneReward(next, false);
      const save = { ...state.save, bones: state.save.bones + boneReward };
      return { ...state, save, run: next, phase: 'over', gameResult: false, finalMode: false };
    }

    case 'CHANGE_SPEED':
      return { ...state, battleSpd: action.speed };

    case 'REVIVE_ALLY': {
      if (!state.run) return state;
      const dead = deadAllies(state.run.al);
      const target = dead[action.allyIndex];
      if (!target) return state;
      const cost = action.pct === 100
        ? Math.floor(allyReviveCost(state.run) * 1.8)
        : allyReviveCost(state.run);
      if (state.run.bE < cost) return state;
      const nextAl = state.run.al.map(a => {
        if (a === target) return { ...a, a: 1, hp: Math.floor(a.mhp * (action.pct / 100)) };
        return { ...a };
      });
      const nextRun = { ...state.run, al: nextAl, bE: state.run.bE - cost };
      const stillDead = deadAllies(nextRun.al);
      if (stillDead.length === 0) {
        return transitionAfterBiome(state, nextRun);
      }
      return { ...state, run: nextRun, reviveTargets: stillDead };
    }

    case 'SKIP_REVIVE': {
      if (!state.run) return state;
      return transitionAfterBiome(state, state.run);
    }

    case 'SHOW_EVO': {
      if (!state.run) return state;
      const evoPicks = rollE(state.run);
      return { ...state, phase: 'evo', evoPicks };
    }

    case 'RESET_SAVE':
      return { ...state, save: { ...FRESH_SAVE } };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'USE_SKILL': {
      if (!state.run || state.phase !== 'battle') return state;
      const { nextRun } = applySkill(state.run, action.sid);
      return { ...state, run: nextRun };
    }

    case 'TRIGGER_EVENT': {
      if (!state.run) return state;
      return { ...state, phase: 'event', currentEvent: action.event };
    }

    case 'CHOOSE_EVENT': {
      if (!state.run || state.phase !== 'event') return state;
      // イベント効果の適用（コストの消費。防御的に下限チェック）
      let nextRun = state.run;
      if (action.choice.cost?.type === 'bone') {
        nextRun = { ...nextRun, bE: Math.max(0, nextRun.bE - action.choice.cost.amount) };
      } else if (action.choice.cost?.type === 'hp_damage') {
        nextRun = { ...nextRun, hp: Math.max(1, nextRun.hp - action.choice.cost.amount) };
      }
      nextRun = applyEventChoice(nextRun, action.choice);
      // 進化選択へ遷移
      const evoPicks = rollE(nextRun);
      return { ...state, run: nextRun, phase: 'evo', evoPicks, currentEvent: undefined };
    }

    case 'APPLY_EVENT_RESULT': {
      if (!state.run || state.phase !== 'event') return state;
      // 事前計算済みの結果で進化選択へ遷移
      const evoPicks2 = rollE(action.nextRun);
      return { ...state, run: action.nextRun, phase: 'evo', evoPicks: evoPicks2, currentEvent: undefined };
    }

    case 'LOAD_META': {
      const runStats = MetaStorage.loadRunStats();
      const aggregate = MetaStorage.loadAggregate();
      const achievementStates = MetaStorage.loadAchievements();
      return { ...state, runStats, aggregate, achievementStates };
    }

    case 'RECORD_RUN_END': {
      if (!state.run) return state;
      const result = action.won ? 'victory' as const : 'defeat' as const;
      const boneEarned = calcBoneReward(state.run, action.won);
      const rs = calcRunStats(state.run, result, boneEarned);

      /* 累計統計の更新 */
      const treeRate = TREE_DATA.length > 0
        ? Object.keys(state.save.tree).length / TREE_DATA.length
        : 0;
      const newAgg = { ...updateAggregate(state.aggregate, rs, state.run), treeCompletionRate: treeRate };

      /* 実績チェック */
      const { nextStates, newIds } = checkAllAchievements(state.achievementStates, rs, newAgg);

      const newRunStats = [...state.runStats, rs];
      const save = { ...state.save, bones: state.save.bones + boneEarned };

      return {
        ...state,
        save,
        runStats: newRunStats,
        aggregate: newAgg,
        achievementStates: nextStates,
        newAchievements: newIds,
      };
    }

    case 'SKIP_EVO': {
      if (!state.run) return state;
      const battleRun = startBattle(state.run, state.finalMode);
      return { ...state, run: battleRun, phase: 'battle' };
    }

    case 'START_CHALLENGE': {
      const ch = CHALLENGES.find(c => c.id === action.challengeId);
      if (!ch) return state;
      const save = { ...state.save, runs: state.save.runs + 1 };
      let run = startRunState(action.di, save);
      run = applyChallenge(run, ch);
      run = { ...run, challengeId: ch.id };
      // タイマー付きチャレンジの場合、開始時刻を記録
      if (run.timeLimit) {
        run = { ...run, timerStart: Date.now() };
      }
      // 最初のバイオーム自動選択
      const pick = pickBiomeAuto(run);
      let next = run;
      if (!pick.needSelection) {
        next = applyFirstBiome(run);
      }
      const evoPicks = rollE(next);
      return {
        ...state, save, run: next, phase: 'evo', finalMode: false,
        evoPicks, pendingAwk: null, gameResult: null, newAchievements: [],
      };
    }

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

/* ===== useGameState ===== */

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  return { state, dispatch };
}

/* ===== useBattle ===== */

export function useBattle(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  onEvents?: (events: TickEvent[]) => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    if (state.phase !== 'battle' || state.battleSpd === 0 || !state.run?.en) return;

    timerRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== 'battle' || !s.run?.en) {
        clearTimer();
        return;
      }
      const { nextRun, events } = tick(s.run, s.finalMode);

      // Process events — single pass, no duplicate SFX
      let dead = false;
      let enemyKilled = false;
      let finalBossKilled = false;

      for (const ev of events) {
        if (ev.type === 'player_dead') dead = true;
        if (ev.type === 'enemy_killed') enemyKilled = true;
        if (ev.type === 'final_boss_killed') finalBossKilled = true;
      }
      onEvents?.(events);

      if (dead) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // Show HP=0
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'GAME_OVER', won: false });
        }, 600);
        return;
      }
      if (finalBossKilled) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // Show boss HP=0
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'FINAL_BOSS_KILLED' });
        }, 800);
        return;
      }
      if (enemyKilled) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // Show enemy HP=0
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'AFTER_BATTLE' });
        }, 800);
        return;
      }
      // Normal tick — sync state
      dispatch({ type: 'BATTLE_TICK', nextRun });
    }, state.battleSpd);

    return clearTimer;
    // state.run?._fPhase: 最終ボス Phase 2 遷移時にタイマーを再起動するために必要
  }, [state.phase, state.battleSpd, state.finalMode, state.run?._fPhase, clearTimer, dispatch, onEvents]);

  return { clearTimer };
}

/* ===== useAudio ===== */

export function useAudio() {
  const initialized = useRef(false);

  const init = useCallback(() => {
    if (!initialized.current) {
      AudioEngine.init();
      initialized.current = true;
    }
  }, []);

  const playSfx = useCallback((type: SfxType) => {
    AudioEngine.play(type);
  }, []);

  const playBgm = useCallback((type: BgmType) => {
    BgmEngine.play(type);
  }, []);

  const stopBgm = useCallback(() => {
    BgmEngine.stop();
  }, []);

  const setBgmVolume = useCallback((v: number) => {
    BgmEngine.setVolume(v);
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    AudioEngine.setSfxVolume(v);
  }, []);

  return { init, playSfx, playBgm, stopBgm, setBgmVolume, setSfxVolume };
}

/* ===== useOverlay ===== */

export interface OverlayState {
  visible: boolean;
  icon: string;
  text: string;
}

export function useOverlay() {
  const [overlay, setOverlay] = useState<OverlayState>({ visible: false, icon: '', text: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const showOverlay = useCallback((icon: string, text: string, ms = 1200): Promise<void> => {
    return new Promise(resolve => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resolveRef.current) resolveRef.current();
      resolveRef.current = resolve;
      setOverlay({ visible: true, icon, text });
      timerRef.current = setTimeout(() => {
        setOverlay({ visible: false, icon: '', text: '' });
        resolveRef.current = null;
        resolve();
      }, ms);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (resolveRef.current) resolveRef.current();
    };
  }, []);

  return { overlay, showOverlay };
}

/* ===== usePersistence ===== */

export function usePersistence(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
) {
  const [loaded, setLoaded] = useState(false);
  const prevSaveRef = useRef<string>('');

  // Load on mount
  useEffect(() => {
    const data = Storage.load();
    if (data) {
      dispatch({ type: 'LOAD_SAVE', save: data });
    }
    setLoaded(true);
  }, [dispatch]);

  // Save on changes
  useEffect(() => {
    if (!loaded) return;
    const json = JSON.stringify(state.save);
    if (json !== prevSaveRef.current) {
      prevSaveRef.current = json;
      Storage.save(state.save);
    }
  }, [state.save, loaded]);

  return { loaded };
}

export { gameReducer, initialState };
export type { GameAction };
