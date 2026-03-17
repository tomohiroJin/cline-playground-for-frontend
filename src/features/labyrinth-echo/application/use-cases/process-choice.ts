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
import { CFG } from '../../domain/constants/config';
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
  // アウトカムが存在することを事前条件として確認
  invariant(choice.o.length > 0, 'resolveOutcome', 'アウトカムが空です');
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

/**
 * フラグ文字列を解析する（純粋関数）
 *
 * chain: フラグの場合のみ新しい chainNextId を設定する。
 * それ以外のフラグ（add:, remove:, escape, null 等）では
 * chainNextId を null にクリアし、チェインを終了させる。
 * これにより chainOnly イベント消化後のループを防止する。
 */
const parseFlag = (flag: string | null): FlagParseResult => {
  if (!flag) {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: false, chainNextId: null,
      isEscape: false, statusFlag: null,
    };
  }

  if (flag.startsWith(CFG.STATUS_FLAG_ADD_PREFIX)) {
    const s = flag.slice(CFG.STATUS_FLAG_ADD_PREFIX.length);
    return {
      statusAdded: isStatusEffectId(s) ? s : null, statusRemoved: null,
      chainTriggered: false, chainNextId: null,
      isEscape: false, statusFlag: flag,
    };
  }
  if (flag.startsWith(CFG.STATUS_FLAG_REMOVE_PREFIX)) {
    const s = flag.slice(CFG.STATUS_FLAG_REMOVE_PREFIX.length);
    return {
      statusAdded: null, statusRemoved: isStatusEffectId(s) ? s : null,
      chainTriggered: false, chainNextId: null,
      isEscape: false, statusFlag: flag,
    };
  }
  if (flag.startsWith(CFG.STATUS_FLAG_CHAIN_PREFIX)) {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: true, chainNextId: flag.slice(CFG.STATUS_FLAG_CHAIN_PREFIX.length),
      isEscape: false, statusFlag: null,
    };
  }
  if (flag === 'escape') {
    return {
      statusAdded: null, statusRemoved: null,
      chainTriggered: false, chainNextId: null,
      isEscape: true, statusFlag: null,
    };
  }

  return {
    statusAdded: null, statusRemoved: null,
    chainTriggered: false, chainNextId: null,
    isEscape: false, statusFlag: null,
  };
};

/** プレイヤー更新コンテキスト */
interface PlayerUpdateContext {
  readonly player: Player;
  readonly statChanges: { hp: number; mn: number; inf: number };
  readonly statusFlag: string | null;
  readonly fx: FxState;
  readonly diff: DifficultyDef | null;
  readonly usedSecondLife: boolean;
}

/** プレイヤー更新 + ドレイン + SecondLife を適用する */
const resolvePlayerUpdate = (ctx: PlayerUpdateContext): {
  player: Player;
  drain: { hp: number; mn: number } | null;
  secondLifeActivated: boolean;
  usedSecondLife: boolean;
} => {
  const { player, statChanges, statusFlag, fx, diff, usedSecondLife } = ctx;
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

  // choiceIndex の境界チェック
  invariant(
    choiceIndex >= 0 && choiceIndex < event.ch.length,
    'processChoice',
    `choiceIndex ${choiceIndex} は範囲外です (0..${event.ch.length - 1})`,
  );

  // アウトカムを解決
  const choice = event.ch[choiceIndex];
  const outcome = resolveOutcome(choice, player, fx);

  // 修正値を計算
  const statChanges = applyModifiers(outcome, fx, diff, player.statuses);

  // フラグを解析
  const flag = outcome.fl ?? null;
  const flagResult = parseFlag(flag);

  // プレイヤー状態を更新（ドレイン・SecondLife含む）
  const playerUpdate = resolvePlayerUpdate({
    player,
    statChanges,
    statusFlag: flagResult.statusFlag,
    fx,
    diff,
    usedSecondLife: gameState.usedSecondLife,
  });

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
