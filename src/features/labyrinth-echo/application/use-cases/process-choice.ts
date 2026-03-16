/**
 * 迷宮の残響 - ProcessChoiceUseCase（選択肢処理ユースケース）
 *
 * 選択解決 → 修正値計算 → 状態更新 → ドレイン → 死亡/脱出判定。
 * 純粋関数として実装し、副作用を含まない。
 * 音声再生・タイマー設定等の副作用は ChoiceFeedback を元に presentation 層が実行する。
 *
 * Phase 6: compat.ts の PlayerLike/DifficultyLike 依存をドメイン型に移行済み
 */
import { invariant } from '../../domain/contracts/invariants';
import type { GameState, LogEntry } from '../../domain/models/game-state';
import type { MetaState } from '../../domain/models/meta-state';
import type { GameEvent, Outcome } from '../../domain/events/game-event';
import type { Player, StatusEffectId } from '../../domain/models/player';
import { isStatusEffectId } from '../../domain/models/player';
import type { DifficultyDef } from '../../domain/models/difficulty';
import type { FxState } from '../../domain/models/unlock';
import {
  applyModifiers, applyChangesToPlayer, computeDrain,
  classifyImpact, checkSecondLife,
} from '../../domain/services/combat-service';
import { computeFx } from '../../domain/services/unlock-service';
import { evalCondCompat } from '../../domain/events/condition';

/** 選択肢処理の入力 */
export interface ProcessChoiceInput {
  readonly gameState: GameState;
  readonly choiceIndex: number;
  readonly event: GameEvent;
  readonly meta: MetaState;
}

/** ステータス変更情報 */
export interface StatChanges {
  readonly hp: number;
  readonly mn: number;
  readonly inf: number;
}

/** ドレイン情報 */
export interface DrainInfo {
  readonly hp: number;
  readonly mn: number;
}

/** 選択肢の処理結果に含まれるフィードバック情報 */
export interface ChoiceFeedback {
  readonly impact: string | null;
  readonly statChanges: StatChanges;
  readonly drain: DrainInfo | null;
  readonly statusAdded: StatusEffectId | null;
  readonly statusRemoved: StatusEffectId | null;
  readonly secondLifeActivated: boolean;
  readonly chainTriggered: boolean;
  readonly resultText: string;
}

/** 選択肢処理の出力 */
export interface ProcessChoiceOutput {
  readonly gameState: GameState;
  readonly updatedMeta: MetaState;
  readonly feedback: ChoiceFeedback;
}

/** アウトカムを解決する（旧 resolveOutcome 互換） */
const resolveOutcome = (
  choice: GameEvent['ch'][number],
  player: Player,
  fx: FxState,
): Outcome => {
  for (const o of choice.o) {
    if (o.c !== 'default' && evalCondCompat(o.c, player, fx)) return o;
  }
  return choice.o.find(o => o.c === 'default') ?? choice.o[0];
};

/** フラグの解析結果 */
interface FlagParseResult {
  readonly statusAdded: StatusEffectId | null;
  readonly statusRemoved: StatusEffectId | null;
  readonly chainTriggered: boolean;
  readonly chainNextId: string | null;
  readonly isEscape: boolean;
  readonly statusFlag: string | null;
}

/** フラグ文字列を解析する（純粋関数） */
const parseFlag = (flag: string | null, currentChainNextId: string | null): FlagParseResult => {
  if (!flag) {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: false, chainNextId: currentChainNextId,
      isEscape: false, statusFlag: null,
    };
  }

  if (flag.startsWith('add:')) {
    const s = flag.slice(4);
    return {
      statusAdded: isStatusEffectId(s) ? s : null, statusRemoved: null,
      chainTriggered: false, chainNextId: currentChainNextId,
      isEscape: false, statusFlag: flag,
    };
  }
  if (flag.startsWith('remove:')) {
    const s = flag.slice(7);
    return {
      statusAdded: null, statusRemoved: isStatusEffectId(s) ? s : null,
      chainTriggered: false, chainNextId: currentChainNextId,
      isEscape: false, statusFlag: flag,
    };
  }
  if (flag.startsWith('chain:')) {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: true, chainNextId: flag.slice(6),
      isEscape: false, statusFlag: null,
    };
  }
  if (flag === 'escape') {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: false, chainNextId: currentChainNextId,
      isEscape: true, statusFlag: null,
    };
  }

  return {
    statusAdded: null, statusRemoved: null,
    chainTriggered: false, chainNextId: currentChainNextId,
    isEscape: false, statusFlag: null,
  };
};

/** プレイヤー更新 + ドレイン + SecondLife を適用する */
const resolvePlayerUpdate = (
  player: Player,
  statChanges: { hp: number; mn: number; inf: number },
  statusFlag: string | null,
  fx: FxState,
  diff: DifficultyDef | null,
  usedSecondLife: boolean,
): {
  player: Player;
  drain: { hp: number; mn: number } | null;
  secondLifeActivated: boolean;
  usedSecondLife: boolean;
} => {
  const afterChoice = applyChangesToPlayer(player, statChanges, statusFlag);
  const drainResult = computeDrain(afterChoice, fx, diff);
  const afterDrain = drainResult.player;

  const isDead = afterDrain.hp <= 0 || afterDrain.mn <= 0;
  if (!isDead) {
    return { player: afterDrain, drain: drainResult.drain, secondLifeActivated: false, usedSecondLife };
  }

  const slResult = checkSecondLife(afterDrain, fx, usedSecondLife);
  return {
    player: slResult.player,
    drain: drainResult.drain,
    secondLifeActivated: slResult.activated,
    usedSecondLife: usedSecondLife || slResult.activated,
  };
};

/** フェーズを決定する */
const determinePhase = (player: Player, isEscape: boolean): GameState['phase'] => {
  if (player.hp <= 0 || player.mn <= 0) return 'game_over';
  if (isEscape) return 'ending';
  return 'result';
};

/** 選択肢処理ユースケース（純粋関数） */
export const processChoice = (input: ProcessChoiceInput): ProcessChoiceOutput => {
  const { gameState, choiceIndex, event, meta } = input;

  invariant(gameState.player !== null, 'processChoice', 'player が存在しません');
  const player = gameState.player;
  const fx = computeFx(meta.unlocked);
  const diff = gameState.difficulty ?? null;

  // アウトカムを解決
  const choice = event.ch[choiceIndex];
  const outcome = resolveOutcome(choice, player, fx);

  // 修正値を計算
  const statChanges = applyModifiers(outcome, fx, diff, player.statuses);

  // フラグを解析
  const flag = outcome.fl ?? null;
  const flagResult = parseFlag(flag, gameState.chainNextId);

  // プレイヤー状態を更新（ドレイン・SecondLife含む）
  const playerUpdate = resolvePlayerUpdate(
    player, statChanges, flagResult.statusFlag,
    fx, diff, gameState.usedSecondLife,
  );

  // フェーズを決定
  const newPhase = determinePhase(playerUpdate.player, flagResult.isEscape);

  // ステータスを型安全に取得
  const updatedStatuses = playerUpdate.player.statuses.filter(isStatusEffectId);

  // ログエントリーを作成
  const logEntry: LogEntry = {
    fl: gameState.floor,
    step: gameState.step,
    ch: choice.t,
    hp: playerUpdate.player.hp,
    mn: playerUpdate.player.mn,
    inf: playerUpdate.player.inf,
    flag: flag ?? undefined,
  };

  return {
    gameState: {
      ...gameState,
      phase: newPhase,
      player: {
        hp: playerUpdate.player.hp,
        maxHp: playerUpdate.player.maxHp,
        mn: playerUpdate.player.mn,
        maxMn: playerUpdate.player.maxMn,
        inf: playerUpdate.player.inf,
        statuses: updatedStatuses,
      },
      usedSecondLife: playerUpdate.usedSecondLife,
      chainNextId: flagResult.chainNextId,
      log: [...gameState.log, logEntry],
    },
    updatedMeta: meta,
    feedback: {
      impact: classifyImpact(statChanges.hp, statChanges.mn),
      statChanges,
      drain: playerUpdate.drain,
      statusAdded: flagResult.statusAdded,
      statusRemoved: flagResult.statusRemoved,
      secondLifeActivated: playerUpdate.secondLifeActivated,
      chainTriggered: flagResult.chainTriggered,
      resultText: outcome.r,
    },
  };
};
