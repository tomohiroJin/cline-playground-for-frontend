import type { Entity, Item, Enemy } from './types';

// ==================== MINIMAP DATA ====================
export interface MinimapData {
  maze: number[][];
  player: Entity;
  exit: Entity;
  items: Item[];
  enemies: Enemy[];
  keys: number;
  reqKeys: number;
  explored: Record<string, boolean>;
  time: number;
}

const CELL = 4;

// ==================== MINIMAP RENDERER ====================
export const MinimapRenderer = {
  render(ctx: CanvasRenderingContext2D, data: MinimapData) {
    const { maze, player, exit, items, enemies, keys, reqKeys, explored, time } = data;
    const size = maze.length;
    const w = size * CELL;
    const h = size * CELL;

    ctx.clearRect(0, 0, w, h);

    // 迷路グリッド描画
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isExplored = explored[`${x},${y}`];
        const isWall = maze[y][x] === 1;
        ctx.globalAlpha = isExplored ? 1 : 0.25;
        ctx.fillStyle = isWall ? '#333' : isExplored ? '#1a1a2e' : '#0a0a15';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    ctx.globalAlpha = 1;

    // アイテム描画
    for (const item of items) {
      if (item.got || !explored[`${item.x},${item.y}`]) continue;
      ctx.beginPath();
      ctx.arc(item.x * CELL + CELL / 2, item.y * CELL + CELL / 2, CELL / 2, 0, Math.PI * 2);
      ctx.fillStyle = item.type === 'key' ? '#ffdd00' : item.type === 'trap' ? '#ff8844' : '#88ffcc';
      ctx.fill();
    }

    // 出口描画
    ctx.fillStyle = keys >= reqKeys ? '#44ff88' : '#666';
    ctx.fillRect(exit.x * CELL - CELL / 2, exit.y * CELL - CELL / 2, CELL + 2, CELL + 2);

    // 敵描画（パルスアニメーション付き）
    const pulse = 0.5 + Math.sin(time * 6) * 0.5;
    for (const e of enemies) {
      if (!e.active) continue;
      ctx.beginPath();
      ctx.arc(e.x * CELL, e.y * CELL, CELL / 2 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 68, ${0.7 + pulse * 0.3})`;
      ctx.fill();
    }

    // プレイヤー描画
    ctx.beginPath();
    ctx.arc(player.x * CELL, player.y * CELL, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  },
};
