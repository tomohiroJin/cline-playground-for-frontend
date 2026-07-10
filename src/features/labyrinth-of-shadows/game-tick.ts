import type { GameState } from './types';
import { GameLogic } from './game-logic';
import { AudioService } from './audio';

/** プレイヤー入力（1フレーム分） */
export interface TickInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly forward: boolean;
  readonly backward: boolean;
  readonly hide: boolean;
  readonly sprint: boolean;
}

/** ティックの結果状態 */
export type TickStatus = 'playing' | 'timeout' | 'victory' | 'gameover';

/** ティック結果 */
export interface TickResult {
  readonly status: TickStatus;
  readonly closestEnemy: number;
  readonly moved: boolean;
}

/**
 * 1フレーム分のゲームロジックを進める純粋関数。
 * 描画・React に依存せず、旧描画ループ実装から抽出したロジック部と同一挙動を保つ（パリティ）。
 * マウスルックによる角度変更は呼び出し側で g.player.angle に適用済みである前提。
 */
export function advanceGame(g: GameState, dt: number, input: TickInput): TickResult {
  g.gTime += dt;
  g.time -= dt;
  if (g.invince > 0) g.invince -= dt;
  if (g.msgTimer > 0) g.msgTimer -= dt;
  if (g.speedBoost > 0) g.speedBoost -= dt;

  if (g.time <= 0) {
    return { status: 'timeout', closestEnemy: Infinity, moved: false };
  }

  GameLogic.updateHiding(g, input.hide, dt);
  GameLogic.updateSprinting(g, input.sprint, dt);
  const moved = GameLogic.updatePlayer(
    g,
    { left: input.left, right: input.right, forward: input.forward, backward: input.backward },
    dt
  );
  GameLogic.updateFootstep(g, moved, dt);
  GameLogic.updateItems(g);

  const exitResult = GameLogic.checkExit(g);
  if (exitResult === 'victory') {
    return { status: 'victory', closestEnemy: Infinity, moved };
  }

  const closestEnemy = GameLogic.updateEnemies(g, dt);
  if (g.lives <= 0) {
    return { status: 'gameover', closestEnemy, moved };
  }

  GameLogic.updateSounds(g, closestEnemy, dt);
  AudioService.updateBGM(Math.max(0, 1 - closestEnemy / 8));

  return { status: 'playing', closestEnemy, moved };
}
