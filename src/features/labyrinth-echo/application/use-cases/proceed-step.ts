/**
 * 迷宮の残響 - ProceedStepUseCase（ステップ進行ユースケース）
 *
 * 次イベント選出 → フロア遷移判定 → ボス判定。
 * RandomPort を注入パラメータで受け取り、決定論的テストを可能にする。
 */
import type { GameState } from '../../domain/models/game-state';
import type { MetaState } from '../../domain/models/meta-state';
import type { GameEvent } from '../../domain/events/game-event';
import type { RandomPort } from '../ports/random-port';
import { pickEvent, findChainEvent } from '../../domain/events/event-selector';
import { computeFx } from '../../domain/services/unlock-service';
import { CFG } from '../../domain/constants/config';

/** ステップ進行の入力 */
export interface ProceedStepInput {
  readonly gameState: GameState;
  readonly events: readonly GameEvent[];
  readonly meta: MetaState;
  readonly rng: RandomPort;
}

/** ステップ遷移の種別 */
export type StepTransition =
  | { readonly type: 'next_event'; readonly event: GameEvent }
  | { readonly type: 'floor_change'; readonly newFloor: number }
  | { readonly type: 'boss_encounter' }
  | { readonly type: 'chain_event'; readonly event: GameEvent };

/** ステップ進行の出力 */
export interface ProceedStepOutput {
  readonly gameState: GameState;
  readonly transition: StepTransition;
}

/**
 * チェインイベントの解決を試みる
 * @returns チェインイベントが見つかった場合は出力、なければ null
 */
const resolveChainEvent = (
  gameState: GameState,
  events: readonly GameEvent[],
): ProceedStepOutput | null => {
  if (!gameState.chainNextId) return null;

  const chainEvent = findChainEvent(events, gameState.chainNextId);
  if (!chainEvent) return null;

  return {
    gameState: {
      ...gameState,
      phase: 'event',
      chainNextId: null,
      usedEventIds: [...gameState.usedEventIds, chainEvent.id],
    },
    transition: { type: 'chain_event', event: chainEvent },
  };
};

/**
 * フロア遷移またはボス遭遇を判定する
 * @returns 遷移が必要な場合は出力、不要なら null
 */
const resolveFloorTransition = (
  gameState: GameState,
): ProceedStepOutput | null => {
  if (gameState.step < CFG.EVENTS_PER_FLOOR) return null;

  // 最終フロア → ボス遭遇
  if (gameState.floor >= CFG.MAX_FLOOR) {
    return {
      gameState: { ...gameState, phase: 'event' },
      transition: { type: 'boss_encounter' },
    };
  }

  // 次のフロアへ遷移
  const newFloor = gameState.floor + 1;
  return {
    gameState: {
      ...gameState,
      phase: 'explore',
      floor: newFloor,
      step: 0,
      usedEventIds: [],
    },
    transition: { type: 'floor_change', newFloor },
  };
};

/**
 * 通常のイベント選出（枯渇時のフォールバック含む）
 */
const selectNextEvent = (
  gameState: GameState,
  events: readonly GameEvent[],
  meta: MetaState,
  rng: RandomPort,
): ProceedStepOutput => {
  const fx = computeFx(meta.unlocked);
  const selectedEvent = pickEvent(events, gameState.floor, gameState.usedEventIds, meta, fx, rng);

  // イベントが見つかった場合
  if (selectedEvent) {
    return {
      gameState: {
        ...gameState,
        phase: 'event',
        step: gameState.step + 1,
        usedEventIds: [...gameState.usedEventIds, selectedEvent.id],
      },
      transition: { type: 'next_event', event: selectedEvent },
    };
  }

  // イベント枯渇時のフォールバック
  // 最終フロアでイベント枯渇 → ボス遭遇（無限ループ防止）
  if (gameState.floor >= CFG.MAX_FLOOR) {
    return {
      gameState: { ...gameState, phase: 'event' },
      transition: { type: 'boss_encounter' },
    };
  }

  // それ以外 → 次のフロアへ遷移
  const newFloor = gameState.floor + 1;
  return {
    gameState: {
      ...gameState,
      phase: 'explore',
      floor: newFloor,
      step: 0,
      usedEventIds: [],
    },
    transition: { type: 'floor_change', newFloor },
  };
};

/** ステップ進行ユースケース（純粋関数） */
export const proceedStep = (input: ProceedStepInput): ProceedStepOutput => {
  const { gameState, events, meta, rng } = input;

  // 1. チェインイベントの処理（優先）
  const chainResult = resolveChainEvent(gameState, events);
  if (chainResult) return chainResult;

  // 2. フロア遷移・ボス判定
  const floorResult = resolveFloorTransition(gameState);
  if (floorResult) return floorResult;

  // 3. 通常のイベント選出
  return selectNextEvent(gameState, events, meta, rng);
};
