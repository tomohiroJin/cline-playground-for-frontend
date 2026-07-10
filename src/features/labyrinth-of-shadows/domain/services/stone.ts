/**
 * 石投げのドメインロジック
 * 投擲・飛行・着地（音源の発生）を扱う。敵の反応は enemy-strategy 側の noise 処理が担う
 */
import type { GameState } from '../../types';
import { MazeService } from '../../maze-service';
import { GAME_BALANCE } from '../constants';

const { SPEED, THROW_RANGE } = GAME_BALANCE.stone;

/** 石を投げる。所持数がない・隠れ中は投げられない */
export const tryThrowStone = (g: GameState): boolean => {
  if (g.stones <= 0 || g.hiding) return false;
  g.stones--;
  g.stoneProjectiles.push({
    x: g.player.x,
    y: g.player.y,
    dirX: Math.cos(g.player.angle),
    dirY: Math.sin(g.player.angle),
    traveled: 0,
  });
  return true;
};

/**
 * 飛行中の石を進める。壁衝突または最大飛距離で着地し、着地点を音源として返す。
 * 同一フレームに複数着地しても音源は1つで十分（最後の着地点を返す）
 */
export const updateStoneProjectiles = (
  g: GameState,
  dt: number
): { x: number; y: number } | undefined => {
  let noise: { x: number; y: number } | undefined;
  g.stoneProjectiles = g.stoneProjectiles.filter(p => {
    const step = SPEED * dt;
    const nx = p.x + p.dirX * step;
    const ny = p.y + p.dirY * step;
    p.traveled += step;
    if (!MazeService.isWalkable(g.maze, nx, ny) || p.traveled >= THROW_RANGE) {
      noise = { x: p.x, y: p.y }; // 壁にめり込まず手前で着地
      return false;
    }
    p.x = nx;
    p.y = ny;
    return true;
  });
  return noise;
};
