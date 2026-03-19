/**
 * 迷宮の残響 - useGameActions フック
 *
 * GameInner から handleChoice / proceed / handleGameOver を抽出し、
 * ゲームアクションのロジックを集約する。
 * 副作用（オーディオ・ビジュアルFX）のトリガーも管理する。
 */
import { useCallback } from 'react';
import { CFG } from '../../domain/constants/config';
import { UNLOCKS } from '../../domain/constants/unlock-defs';
import { determineEnding } from '../../domain/services/ending-service';
import { pickEvent, findChainEvent } from '../../events/event-utils';
import { processChoice as legacyProcessChoice } from '../../events/event-utils';
import { getRandomSource } from '../get-random-source';
import type { Player } from '../../domain/models/player';
import type { FxState } from '../../domain/models/unlock';
import type { MetaState } from '../../domain/models/meta-state';
import type { GameEvent } from '../../events/event-utils';
import type { GameReducerState, GameAction } from './use-game-orchestrator';

/** AudioEngine の最小インターフェース（テスト可能にするため） */
interface AudioSfxApi {
  readonly choice: () => void;
  readonly hit: () => void;
  readonly bigHit: () => void;
  readonly heal: () => void;
  readonly status: () => void;
  readonly clear: () => void;
  readonly drain: () => void;
  readonly over: () => void;
  readonly floor: () => void;
  readonly ambient: (floor: number) => void;
  readonly victory: () => void;
  readonly levelUp: () => void;
}

/** useGameActions の依存パラメータ */
export interface GameActionsDeps {
  readonly state: GameReducerState;
  readonly dispatch: React.Dispatch<GameAction>;
  readonly fx: FxState;
  readonly meta: MetaState;
  readonly events: GameEvent[];
  readonly sfx: (fn: () => void) => void;
  readonly safeTimeout: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  readonly doShake: () => void;
  readonly flash: (type: string, ms: number) => void;
  readonly updateMeta: (updater: (m: MetaState) => Partial<MetaState>) => void;
  readonly audioSfx: AudioSfxApi;
}

// ── ビジュアル・オーディオフィードバックのヘルパー ──

/** FXトリガー用の依存 */
interface FxTriggers {
  readonly sfx: GameActionsDeps['sfx'];
  readonly audioSfx: AudioSfxApi;
  readonly doShake: () => void;
  readonly flash: GameActionsDeps['flash'];
  readonly safeTimeout: GameActionsDeps['safeTimeout'];
}

/** インパクト種別に応じたビジュアル・オーディオ効果をトリガーする */
const applyVisualFeedback = (
  impact: string | null,
  playerFlag: string | null,
  drain: { hp: number; mn: number } | null,
  triggers: FxTriggers,
): void => {
  const { sfx, audioSfx, doShake, flash, safeTimeout } = triggers;
  if (impact === "bigDmg" || impact === "dmg") {
    doShake();
    flash("dmg", 400);
    sfx(impact === "bigDmg" ? audioSfx.bigHit : audioSfx.hit);
  } else if (impact === "heal") {
    flash("heal", 500);
    sfx(audioSfx.heal);
  }
  if (playerFlag?.startsWith("add:")) safeTimeout(() => sfx(audioSfx.status), 200);
  if (playerFlag?.startsWith("remove:")) safeTimeout(() => sfx(audioSfx.clear), 200);
  if (drain) safeTimeout(() => sfx(audioSfx.drain), 400);
};

/** 脱出時のメタ更新とビクトリー演出を処理する */
const handleEscapeOutcome = (
  drained: Player,
  state: GameReducerState,
  meta: MetaState,
  dispatch: React.Dispatch<GameAction>,
  updateMeta: GameActionsDeps['updateMeta'],
  sfx: GameActionsDeps['sfx'],
  safeTimeout: GameActionsDeps['safeTimeout'],
  audioSfx: AudioSfxApi,
): void => {
  const end = determineEnding(drained, [...state.log], state.diff);
  const isNew = !meta.endings?.includes(end.id);
  const diffId = state.diff?.id;
  const isNewDiff = diffId ? !meta.clearedDifficulties?.includes(diffId) : false;
  safeTimeout(() => sfx(audioSfx.victory), 500);
  safeTimeout(() => {
    dispatch({ type: 'SET_VICTORY', ending: end, isNewEnding: isNew, isNewDiffClear: isNewDiff });
    updateMeta(m => ({
      escapes: m.escapes + 1,
      kp: m.kp + (state.diff?.rewards.kpOnWin ?? 4) + end.bonusKp,
      bestFloor: Math.max(m.bestFloor, state.floor),
      endings: m.endings.includes(end.id) ? m.endings : [...m.endings, end.id],
      clearedDifficulties: !diffId || m.clearedDifficulties.includes(diffId)
        ? m.clearedDifficulties
        : [...m.clearedDifficulties, diffId],
      lastRun: {
        cause: "escape", floor: state.floor, endingId: end.id,
        hp: drained.hp, mn: drained.mn, inf: drained.inf,
      },
    }));
  }, 2500);
};

// ── SecondLife 復活判定 ──

/** SecondLife 復活のチェック結果 */
interface SecondLifeCheckResult {
  readonly player: Player;
  readonly activated: boolean;
}

/** SecondLife 復活を判定する（純粋関数） */
const checkSecondLifeActivation = (
  player: Player,
  fx: FxState,
  usedSecondLife: boolean,
): SecondLifeCheckResult => {
  const isDead = player.hp <= 0 || player.mn <= 0;
  if (!isDead || !fx.secondLife || usedSecondLife) {
    return { player, activated: false };
  }
  return {
    player: {
      ...player,
      hp: Math.max(player.hp, Math.ceil(player.maxHp / 2)),
      mn: Math.max(player.mn, Math.ceil(player.maxMn / 2)),
    },
    activated: true,
  };
};

/** 死亡判定を実行し、該当する場合はゲームオーバーを遅延発火する */
const scheduleDeathIfNeeded = (
  player: Player,
  safeTimeout: GameActionsDeps['safeTimeout'],
  handleGameOver: (cause: string) => void,
): void => {
  if (player.hp <= 0 || player.mn <= 0) {
    const deathCause = player.hp <= 0 ? "体力消耗" : "精神崩壊";
    safeTimeout(() => handleGameOver(deathCause), 2500);
  }
};

// ── ボス再戦ロジックのヘルパー ──

/** 最終フロア超過時のボス再戦・イベント選出を処理する */
const resolveBossRetry = (
  nextStep: number,
  nextUsedIds: string[],
  state: GameReducerState,
  events: GameEvent[],
  meta: MetaState,
  fx: FxState,
  dispatch: React.Dispatch<GameAction>,
  handleGameOver: (cause: string) => void,
): void => {
  const boss = events.find(e => e.id === CFG.BOSS_EVENT_ID);

  // 初回ボス遭遇
  if (boss && !nextUsedIds.includes(CFG.BOSS_EVENT_ID)) {
    dispatch({ type: 'ADVANCE_STEP', event: boss, step: nextStep, usedIds: nextUsedIds });
    return;
  }

  const bossCount = nextUsedIds.filter(id => id === CFG.BOSS_EVENT_ID).length;
  const lastBossIdx = nextUsedIds.lastIndexOf(CFG.BOSS_EVENT_ID);
  const postBoss = nextUsedIds.length - lastBossIdx - 1;

  // ボス再戦前に通常イベントを挟む
  if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
    const nextEvent = pickEvent({ events, floor: state.floor, usedIds: nextUsedIds, meta, fx, rng: getRandomSource() });
    if (nextEvent) {
      dispatch({ type: 'ADVANCE_STEP', event: nextEvent, step: nextStep, usedIds: nextUsedIds });
      return;
    }
  }

  // ボス再戦
  if (bossCount < CFG.MAX_BOSS_RETRIES && boss) {
    dispatch({ type: 'ADVANCE_STEP', event: boss, step: nextStep, usedIds: nextUsedIds });
    return;
  }

  // リトライ上限 → ゲームオーバー
  handleGameOver("精神崩壊");
};

// ── フック実装 ──

/** ゲームオーバー処理 */
const useHandleGameOver = (deps: GameActionsDeps) => {
  const { sfx, dispatch, updateMeta, state, audioSfx } = deps;

  return useCallback((cause: string) => {
    sfx(audioSfx.over);
    dispatch({ type: 'SET_GAME_OVER' });
    updateMeta(m => ({
      kp: m.kp + (state.diff?.rewards.kpOnDeath ?? 2),
      bestFloor: Math.max(m.bestFloor, state.floor),
      totalDeaths: (m.totalDeaths ?? 0) + 1,
      lastRun: {
        cause,
        floor: state.floor,
        endingId: null,
        hp: state.player?.hp ?? 0,
        mn: state.player?.mn ?? 0,
        inf: state.player?.inf ?? 0,
      },
    }));
  }, [sfx, audioSfx, dispatch, updateMeta, state.diff, state.floor, state.player]);
};

/** 選択肢処理 */
const useHandleChoice = (deps: GameActionsDeps, handleGameOver: (cause: string) => void) => {
  const { state, dispatch, fx, sfx, safeTimeout, doShake, flash, updateMeta, meta, audioSfx } = deps;

  return useCallback((idx: number) => {
    if (!state.event || !state.player) return;
    sfx(audioSfx.choice);

    const {
      choice, outcome, mods, chainId, playerFlag,
      drained: rawDrained, drain, impact,
    } = legacyProcessChoice({ event: state.event, choiceIdx: idx, player: state.player, fx, diff: state.diff });

    // SecondLife 復活判定
    const secondLife = checkSecondLifeActivation(rawDrained, fx, state.usedSecondLife);
    if (secondLife.activated) {
      flash("heal", 800);
      sfx(audioSfx.heal);
    }

    // ビジュアル・オーディオフィードバック
    applyVisualFeedback(impact, playerFlag, drain, { sfx, audioSfx, doShake, flash, safeTimeout });

    // リデューサーに結果を送信
    dispatch({
      type: 'APPLY_CHOICE',
      player: secondLife.player,
      resTxt: secondLife.activated
        ? outcome.r + "\n\n──「二度目の命」が発動した。致命の闇から引き戻される。"
        : outcome.r,
      resChg: { hp: mods.hp, mn: mods.mn, inf: mods.inf, fl: outcome.fl },
      drainInfo: drain,
      logEntry: {
        fl: state.floor, step: state.step + 1, ch: choice.t,
        hp: mods.hp, mn: mods.mn, inf: mods.inf, flag: playerFlag ?? undefined,
      },
      chainNext: chainId,
      usedSecondLife: state.usedSecondLife || secondLife.activated,
    });
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // 脱出判定
    if (outcome.fl === "escape") {
      handleEscapeOutcome(secondLife.player, state, meta, dispatch, updateMeta, sfx, safeTimeout, audioSfx);
      return;
    }

    // 死亡判定
    scheduleDeathIfNeeded(secondLife.player, safeTimeout, handleGameOver);
  }, [
    state, meta, fx, sfx, audioSfx, safeTimeout,
    doShake, flash, dispatch, updateMeta,
    handleGameOver,
  ]);
};

/** 結果画面から次へ進む処理 */
const useProceed = (deps: GameActionsDeps, handleGameOver: (cause: string) => void) => {
  const { state, dispatch, sfx, meta, fx, events, audioSfx } = deps;

  return useCallback(() => {
    if (!state.event) return;
    const nextStep = state.step + 1;
    const nextUsedIds = [...state.usedIds, state.event.id];

    // チェインイベント優先
    if (state.chainNext) {
      const chainEvent = findChainEvent(events, state.chainNext);
      if (chainEvent) {
        dispatch({ type: 'ADVANCE_STEP', event: chainEvent, step: nextStep, usedIds: nextUsedIds });
        return;
      }
    }

    // フロア遷移判定
    const isShort = state.resChg?.fl === "shortcut";
    const nextFloor = isShort
      ? Math.min(state.floor + 2, CFG.MAX_FLOOR)
      : (nextStep >= CFG.EVENTS_PER_FLOOR ? state.floor + 1 : state.floor);

    if (nextFloor > state.floor && nextFloor <= CFG.MAX_FLOOR) {
      sfx(audioSfx.levelUp);
      dispatch({ type: 'CHANGE_FLOOR', floor: nextFloor });
      return;
    }

    // ボス再戦ロジック（最終フロア超過時）
    if (nextFloor > CFG.MAX_FLOOR) {
      resolveBossRetry(nextStep, nextUsedIds, state, events, meta, fx, dispatch, handleGameOver);
      return;
    }

    // 通常のイベント選出
    const nextEvent = pickEvent({ events, floor: state.floor, usedIds: nextUsedIds, meta, fx, rng: getRandomSource() });
    if (nextEvent) {
      dispatch({ type: 'ADVANCE_STEP', event: nextEvent, step: nextStep, usedIds: nextUsedIds });
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[proceed] No events left for floor ${state.floor}`);
      }
      handleGameOver("精神崩壊");
    }
  }, [
    state, sfx, audioSfx, meta, fx, events, dispatch, handleGameOver,
  ]);
};

/** アンロック購入処理 */
const useDoUnlock = (deps: GameActionsDeps) => {
  const { meta, sfx, safeTimeout, dispatch, updateMeta, audioSfx } = deps;

  return useCallback((uid: string) => {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def || meta.unlocked.includes(uid) || meta.kp < def.cost) return;
    sfx(audioSfx.heal);
    dispatch({ type: 'SET_LAST_BOUGHT', id: uid });
    safeTimeout(() => dispatch({ type: 'SET_LAST_BOUGHT', id: null }), 600);
    updateMeta(m => ({ unlocked: [...m.unlocked, uid], kp: m.kp - def.cost }));
  }, [meta, sfx, audioSfx, safeTimeout, dispatch, updateMeta]);
};

/** useGameActions の戻り値 */
export interface GameActionsResult {
  readonly handleChoice: (idx: number) => void;
  readonly proceed: () => void;
  readonly handleGameOver: (cause: string) => void;
  readonly doUnlock: (uid: string) => void;
}

/** ゲームアクションフック */
export const useGameActions = (deps: GameActionsDeps): GameActionsResult => {
  const handleGameOver = useHandleGameOver(deps);
  const handleChoice = useHandleChoice(deps, handleGameOver);
  const proceed = useProceed(deps, handleGameOver);
  const doUnlock = useDoUnlock(deps);

  return { handleChoice, proceed, handleGameOver, doUnlock };
};
