/**
 * 迷宮の残響 - StartRunUseCase（ラン開始ユースケース）
 *
 * 難易度選択 → FX集約 → プレイヤー生成 → 状態初期化 → メタ更新。
 * 純粋関数として実装し、副作用を持たない。
 */
import type { DifficultyDef } from '../../domain/models/difficulty';
import type { MetaState } from '../../domain/models/meta-state';
import type { GameState } from '../../domain/models/game-state';
import type { Player } from '../../domain/models/player';
import { computeFx, createNewPlayer } from '../../domain/services/unlock-service';

/** ラン開始の入力 */
export interface StartRunInput {
  readonly difficulty: DifficultyDef;
  readonly meta: MetaState;
}

/** ラン開始の出力 */
export interface StartRunOutput {
  readonly gameState: GameState;
  readonly updatedMeta: MetaState;
}

/** ラン開始ユースケース（純粋関数） */
export const startRun = (input: StartRunInput): StartRunOutput => {
  const { difficulty, meta } = input;

  // FX効果を集約
  const fx = computeFx(meta.unlocked);

  // プレイヤーを生成（ドメインサービスに委譲）
  const playerLike = createNewPlayer(difficulty.modifiers, fx);
  const player: Player = {
    hp: playerLike.hp,
    maxHp: playerLike.maxHp,
    mn: playerLike.mn,
    maxMn: playerLike.maxMn,
    inf: playerLike.inf,
    statuses: [],
  };

  // GameState を初期化
  const gameState: GameState = {
    phase: 'explore',
    player,
    difficulty,
    floor: 1,
    step: 0,
    usedEventIds: [],
    log: [],
    chainNextId: null,
    usedSecondLife: false,
  };

  // メタデータを更新（runsインクリメント）
  const updatedMeta: MetaState = {
    ...meta,
    runs: meta.runs + 1,
  };

  return { gameState, updatedMeta };
};
