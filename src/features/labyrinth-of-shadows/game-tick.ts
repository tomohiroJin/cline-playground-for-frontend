import type { GameState } from './types';
import { GameLogic } from './game-logic';
import { AudioService } from './audio';
import { tryThrowStone, updateStoneProjectiles } from './domain/services/stone';
import { tryUseSpeedCharge } from './domain/services/speed';
import { GAME_BALANCE } from './domain/constants';

/** プレイヤー入力（1フレーム分） */
export interface TickInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly forward: boolean;
  readonly backward: boolean;
  readonly hide: boolean;
  readonly sprint: boolean;
  readonly throwStone: boolean;
  /** 横移動（省略時は false。left/right はマウス・矢印キーによる旋回専用） */
  readonly strafeLeft?: boolean;
  readonly strafeRight?: boolean;
  /** 加速チャージの発動入力（Eキー/タッチボタン。省略時は false） */
  readonly useSpeed?: boolean;
}

/** ティックの結果状態 */
export type TickStatus = 'playing' | 'timeout' | 'victory' | 'gameover';

/** 敵の状態変化アラート（索敵UIマーカーの元データ） */
export interface EnemyAlert {
  readonly kind: 'spotted' | 'searching';
  readonly x: number;
  readonly y: number;
}

/** ティック結果 */
export interface TickResult {
  readonly status: TickStatus;
  readonly closestEnemy: number;
  readonly moved: boolean;
  readonly alerts: readonly EnemyAlert[];
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
    return { status: 'timeout', closestEnemy: Infinity, moved: false, alerts: [] };
  }

  GameLogic.updateHiding(g, input.hide, dt);
  GameLogic.updateSprinting(g, input.sprint, dt);
  const moved = GameLogic.updatePlayer(
    g,
    {
      left: input.left,
      right: input.right,
      forward: input.forward,
      backward: input.backward,
      strafeLeft: input.strafeLeft,
      strafeRight: input.strafeRight,
    },
    dt
  );
  GameLogic.updateFootstep(g, moved, dt);
  const trapNoise = GameLogic.updateItems(g);

  // 石: 投擲入力 → 飛行更新 → 着地音（音源はこのフレームの敵更新に渡す）
  if (input.throwStone && tryThrowStone(g)) {
    AudioService.play('stoneThrow', 0.3);
  }
  const stoneNoise = updateStoneProjectiles(g, dt);
  if (stoneNoise) AudioService.play('stoneLand', 0.35);
  // 同一フレームに両方発生したら音の大きい罠を優先する
  const noise = trapNoise ?? stoneNoise;

  // 加速チャージ: 発動は任意タイミング（chase 中でも使える切り札）
  if (input.useSpeed && tryUseSpeedCharge(g)) {
    g.msg = '⚡ 加速発動！ 10秒間スピードアップ！';
    g.msgTimer = GAME_BALANCE.timing.MESSAGE_DURATION;
    AudioService.play('speed', 0.4);
  }

  const exitResult = GameLogic.checkExit(g);
  if (exitResult === 'victory') {
    return { status: 'victory', closestEnemy: Infinity, moved, alerts: [] };
  }

  const enemyResult = GameLogic.updateEnemies(g, dt, noise);
  if (g.lives <= 0) {
    return { status: 'gameover', closestEnemy: enemyResult.closest, moved, alerts: enemyResult.alerts };
  }

  GameLogic.updateSounds(g, enemyResult.closest, dt, enemyResult.nearest);
  AudioService.updateBGM(Math.max(0, 1 - enemyResult.closest / 8));

  return { status: 'playing', closestEnemy: enemyResult.closest, moved, alerts: enemyResult.alerts };
}
