/**
 * 迷宮の残響 - useGameActions フック
 *
 * GameInner から handleChoice / proceed / handleGameOver を抽出し、
 * ゲームアクションのロジックを集約する。
 * 副作用（オーディオ・ビジュアルFX）のトリガーも管理する。
 */
import { useCallback, useRef } from 'react';
import { CFG } from '../../domain/constants/config';
import { UNLOCKS } from '../../domain/constants/unlock-defs';
import { determineEnding } from '../../domain/services/ending-service';
import { isTrueRouteUnlocked, determineTrueEnding } from '../../domain/services/finale-service';
import { incrementEchoDepth, selectSafetyNetFragment } from '../../domain/services/echo-service';
import { pickEvent, findChainEvent } from '../../events/event-utils';
import { processChoice as legacyProcessChoice } from '../../events/event-utils';
import { getRandomSource } from '../get-random-source';
import type { Player } from '../../domain/models/player';
import type { FxState } from '../../domain/models/unlock';
import type { MetaState } from '../../domain/models/meta-state';
import type { EndingDef } from '../../domain/models/ending';
import type { FinaleDecision } from '../../domain/models/finale';
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

/** 残響断片フラグのプレフィックス（ログ表示から除外するために参照） */
const FRAG_PREFIX = 'frag:';

/** 残響の亡霊撃破フラグのプレフィックス */
const REVENANT_PREFIX = 'revenant:';

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

/** commitVictory が必要とする副作用依存のサブセット */
interface VictoryDeps {
  readonly dispatch: React.Dispatch<GameAction>;
  readonly updateMeta: GameActionsDeps['updateMeta'];
  readonly sfx: GameActionsDeps['sfx'];
  readonly safeTimeout: GameActionsDeps['safeTimeout'];
  readonly audioSfx: AudioSfxApi;
}

/**
 * victory コミット処理（通常脱出・終章共通）
 *
 * SET_VICTORY ディスパッチ＋メタ更新を行う。
 * 通常 END と真 END の両方から呼び出される共通処理。
 */
const commitVictory = (
  ending: EndingDef,
  drained: Player,
  state: GameReducerState,
  meta: MetaState,
  deps: VictoryDeps,
): void => {
  const { dispatch, updateMeta, sfx, safeTimeout, audioSfx } = deps;
  const isNew = !meta.endings?.includes(ending.id);
  const diffId = state.diff?.id;
  const isNewDiff = diffId ? !meta.clearedDifficulties?.includes(diffId) : false;
  safeTimeout(() => sfx(audioSfx.victory), 500);
  safeTimeout(() => {
    dispatch({ type: 'SET_VICTORY', ending, isNewEnding: isNew, isNewDiffClear: isNewDiff });
    updateMeta(m => {
      const newDepth = incrementEchoDepth(m.echoDepth);
      const safety = selectSafetyNetFragment(newDepth, m.fragments);
      const fragments = safety && !m.fragments.includes(safety.id)
        ? [...m.fragments, safety.id]
        : m.fragments;
      return {
        escapes: m.escapes + 1,
        // 基礎KP + エンディングボーナス + 圧ボーナス（圧×基礎KP×0.25） + 撃破亡霊数
        kp: m.kp + (state.diff?.rewards.kpOnWin ?? 4) + ending.bonusKp
            + Math.round((state.diff?.rewards.kpOnWin ?? 4) * state.pressure * 0.25) + state.revenantsThisRun,
        bestFloor: Math.max(m.bestFloor, state.floor),
        endings: m.endings.includes(ending.id) ? m.endings : [...m.endings, ending.id],
        clearedDifficulties: !diffId || m.clearedDifficulties.includes(diffId)
          ? m.clearedDifficulties
          : [...m.clearedDifficulties, diffId],
        lastRun: {
          cause: "escape", floor: state.floor, endingId: ending.id,
          hp: drained.hp, mn: drained.mn, inf: drained.inf,
        },
        echoDepth: newDepth,
        fragments,
        maxPressureCleared: Math.max(m.maxPressureCleared, state.pressure),
      };
    });
  }, 2500);
};

/**
 * 脱出時の分岐処理
 *
 * 真ルート解禁済みなら OFFER_TRUE_ROUTE を発行してコミットを保留する。
 * offer 表示の唯一の入口でもあるため、毎周ここでガードをリセットする。
 * 未解禁なら通常通り commitVictory を呼び出す。
 */
const handleEscapeOutcome = (
  drained: Player,
  state: GameReducerState,
  meta: MetaState,
  dispatch: React.Dispatch<GameAction>,
  updateMeta: GameActionsDeps['updateMeta'],
  sfx: GameActionsDeps['sfx'],
  safeTimeout: GameActionsDeps['safeTimeout'],
  audioSfx: AudioSfxApi,
  resetFinaleGuard: () => void,
): void => {
  // 真ルート解禁済みなら終章オファーへ（victory コミットを保留）
  // offer に入る瞬間にガードをリセットして、finaleEscape・finaleDecide の両経路を有効化する
  if (isTrueRouteUnlocked(meta)) {
    resetFinaleGuard();
    dispatch({ type: 'OFFER_TRUE_ROUTE' });
    return;
  }
  commitVictory(
    determineEnding(drained, [...state.log], state.diff),
    drained, state, meta,
    { dispatch, updateMeta, sfx, safeTimeout, audioSfx },
  );
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
    const nextEvent = pickEvent({ events, floor: state.floor, usedIds: nextUsedIds, meta, fx, rng: getRandomSource(), pressure: state.pressure });
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
const useHandleChoice = (
  deps: GameActionsDeps,
  handleGameOver: (cause: string) => void,
  resetFinaleGuard: () => void,
) => {
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

    // 残響の亡霊の撃破（fl:"revenant:<predId>"）— dispatch 前に判定
    const isRevenantDefeat = outcome.fl?.startsWith(REVENANT_PREFIX) ?? false;

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
        hp: mods.hp, mn: mods.mn, inf: mods.inf,
        // frag: / revenant: の内部IDはログパネルに表示しない
        flag: playerFlag && !playerFlag.startsWith(FRAG_PREFIX) && !playerFlag.startsWith(REVENANT_PREFIX) ? playerFlag : undefined,
      },
      chainNext: chainId,
      usedSecondLife: state.usedSecondLife || secondLife.activated,
      revenantDefeated: isRevenantDefeat,
    });
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // 残響断片の収集（fl:"frag:<id>"）
    if (outcome.fl?.startsWith(FRAG_PREFIX)) {
      const fragId = outcome.fl.slice(FRAG_PREFIX.length);
      updateMeta(m => ({ fragments: m.fragments.includes(fragId) ? m.fragments : [...m.fragments, fragId] }));
    }

    // 亡霊撃破の永続化（fl:"revenant:<predId>"）
    if (isRevenantDefeat) {
      const predId = outcome.fl!.slice(REVENANT_PREFIX.length);
      updateMeta(m => ({ revenantsDefeated: m.revenantsDefeated.includes(predId) ? m.revenantsDefeated : [...m.revenantsDefeated, predId] }));
    }

    // 脱出判定（handleEscapeOutcome 内で真ルート解禁時はガードもリセットされる）
    if (outcome.fl === "escape") {
      handleEscapeOutcome(secondLife.player, state, meta, dispatch, updateMeta, sfx, safeTimeout, audioSfx, resetFinaleGuard);
      return;
    }

    // 死亡判定
    scheduleDeathIfNeeded(secondLife.player, safeTimeout, handleGameOver);
  }, [
    state, meta, fx, sfx, audioSfx, safeTimeout,
    doShake, flash, dispatch, updateMeta,
    handleGameOver, resetFinaleGuard,
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

    // 通常のイベント選出（圧を伝播して亡霊ゲートを機能させる）
    const nextEvent = pickEvent({ events, floor: state.floor, usedIds: nextUsedIds, meta, fx, rng: getRandomSource(), pressure: state.pressure });
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
  /** 終章オファー「脱出する」→ 通常 END でコミット */
  readonly finaleEscape: () => void;
  /** 終章オファー「さらに深く」（finaleStep=0）または終章ビート前進（finaleStep>0） */
  readonly finaleAdvance: () => void;
  /** 終章最終ビートの決断 → 真 END でコミット */
  readonly finaleDecide: (decision: FinaleDecision) => void;
}

/** ゲームアクションフック */
export const useGameActions = (deps: GameActionsDeps): GameActionsResult => {
  const { state, meta, dispatch, updateMeta, sfx, safeTimeout, audioSfx } = deps;
  const handleGameOver = useHandleGameOver(deps);

  // 終章の二重コミットを防ぐガード
  // useRef はレンダー間で同一参照を保つため deps に含める必要がない
  // handleChoice（offer 入口）でリセットするため、useHandleChoice より先に定義する
  const finaleCommittedRef = useRef(false);
  // offer 入口（handleEscapeOutcome）から呼び出せる安定した参照
  const resetFinaleGuard = useCallback(() => { finaleCommittedRef.current = false; }, []);

  const handleChoice = useHandleChoice(deps, handleGameOver, resetFinaleGuard);
  const proceed = useProceed(deps, handleGameOver);
  const doUnlock = useDoUnlock(deps);

  // 終章オファーで「脱出する」を選択した場合：通常 END を確定してコミット
  const finaleEscape = useCallback(() => {
    // 二重コミット防止：既にコミット済みなら無視する
    if (finaleCommittedRef.current) return;
    finaleCommittedRef.current = true;
    if (!state.player) return;
    commitVictory(
      determineEnding(state.player, [...state.log], state.diff),
      state.player, state, meta,
      { dispatch, updateMeta, sfx, safeTimeout, audioSfx },
    );
  }, [state, meta, dispatch, updateMeta, sfx, safeTimeout, audioSfx]);

  // 終章オファーで「さらに深く」→ ENTER_FINALE、ビート中は ADVANCE_FINALE
  const finaleAdvance = useCallback(() => {
    if (state.finaleStep === 0) {
      // 「さらに深く」経路でも念のためガードをリセット（offer 入口リセットの保険）
      finaleCommittedRef.current = false;
      dispatch({ type: 'ENTER_FINALE' });
    } else {
      dispatch({ type: 'ADVANCE_FINALE' });
    }
  }, [state.finaleStep, dispatch]);

  // 終章最終ビートで決断 → 真 END を確定してコミット
  const finaleDecide = useCallback((decision: FinaleDecision) => {
    // 二重コミット防止：既にコミット済みなら無視する
    if (finaleCommittedRef.current) return;
    finaleCommittedRef.current = true;
    if (!state.player) return;
    commitVictory(
      determineTrueEnding(decision, state.pressure, state.legacyId),
      state.player, state, meta,
      { dispatch, updateMeta, sfx, safeTimeout, audioSfx },
    );
  }, [state, meta, dispatch, updateMeta, sfx, safeTimeout, audioSfx]);

  return { handleChoice, proceed, handleGameOver, doUnlock, finaleEscape, finaleAdvance, finaleDecide };
};
