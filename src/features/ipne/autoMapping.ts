/**
 * 自動マッピング機能
 * プレイヤーの移動に応じて探索状態を更新し、マップを描画する
 */
import { ExplorationState, ExplorationStateValue, Position, GameMap, TileType } from './types';

/**
 * 探索状態を初期化（全て未探索）
 */
export function initExploration(width: number, height: number): ExplorationStateValue[][] {
  return Array.from({ length: height }, () => Array(width).fill(ExplorationState.UNEXPLORED));
}

/**
 * 探索状態を更新
 * - プレイヤー位置を「通過済み」に
 * - 隣接8マスを「可視」に（ただし壁は除外）
 */
export function updateExploration(
  exploration: ExplorationStateValue[][],
  player: Position,
  map: GameMap
): ExplorationStateValue[][] {
  // 新しい配列を作成（イミュータブル）
  const updated = exploration.map(row => [...row]);

  const { x, y } = player;
  const height = exploration.length;
  const width = exploration[0].length;

  // プレイヤー位置を通過済みに
  if (y >= 0 && y < height && x >= 0 && x < width) {
    updated[y][x] = ExplorationState.EXPLORED;
  }

  // 隣接8マスを可視に（壁は除外）
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue; // 中心（プレイヤー位置）はスキップ

      const nx = x + dx;
      const ny = y + dy;

      if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
        // 壁タイルは可視にしない
        if (map[ny][nx] === TileType.WALL) {
          continue;
        }

        // 未探索の場合のみ可視にする（通過済みは上書きしない）
        if (updated[ny][nx] === ExplorationState.UNEXPLORED) {
          updated[ny][nx] = ExplorationState.VISIBLE;
        }
      }
    }
  }

  return updated;
}

/**
 * ゴールが発見されているか判定
 */
export function isGoalDiscovered(
  exploration: ExplorationStateValue[][],
  goalPos: Position
): boolean {
  const { x, y } = goalPos;
  const height = exploration.length;
  const width = exploration[0].length;

  if (y < 0 || y >= height || x < 0 || x >= width) {
    return false;
  }

  const state = exploration[y][x];
  return state === ExplorationState.EXPLORED || state === ExplorationState.VISIBLE;
}

/**
 * 自動マップをCanvas上に描画
 */
export function drawAutoMap(
  ctx: CanvasRenderingContext2D,
  map: GameMap,
  exploration: ExplorationStateValue[][],
  player: Position,
  goalPos: Position,
  isFullScreen: boolean
): void {
  // Canvas要素のチェック
  if (!ctx || !ctx.canvas) {
    return;
  }

  const mapWidth = map[0].length;
  const mapHeight = map.length;

  // 描画領域の設定
  let mapX: number, mapY: number, mapSize: number, tileSize: number;

  if (isFullScreen) {
    // 全画面モード（画面中央、80%サイズ）
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    mapSize = Math.min(canvasWidth, canvasHeight) * 0.8;
    mapX = (canvasWidth - mapSize) / 2;
    mapY = (canvasHeight - mapSize) / 2;
  } else {
    // 小窓モード（右上、200x200px）
    mapSize = 200;
    mapX = ctx.canvas.width - mapSize - 10;
    mapY = 10;
  }

  tileSize = mapSize / Math.max(mapWidth, mapHeight);

  // 半透明背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(mapX, mapY, mapSize, mapSize);

  // 枠線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);

  // 探索エリアを描画（可視・通過済み）
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const state = exploration[y][x];
      const px = mapX + x * tileSize;
      const py = mapY + y * tileSize;
      const centerX = px + tileSize / 2;
      const centerY = py + tileSize / 2;

      if (state === ExplorationState.EXPLORED) {
        // 通過済み: 十字線（濃い青）
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.lineWidth = 1;
        const crossSize = tileSize * 0.3;

        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY);
        ctx.lineTo(centerX + crossSize, centerY);
        ctx.moveTo(centerX, centerY - crossSize);
        ctx.lineTo(centerX, centerY + crossSize);
        ctx.stroke();
      } else if (state === ExplorationState.VISIBLE) {
        // 可視: 小さな点（淡い青）
        ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, tileSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ゴール位置（発見後のみ）
  if (isGoalDiscovered(exploration, goalPos)) {
    const goalX = mapX + goalPos.x * tileSize;
    const goalY = mapY + goalPos.y * tileSize;

    ctx.fillStyle = '#10b981';
    ctx.fillRect(goalX, goalY, tileSize, tileSize);
  }

  // プレイヤー位置（円形マーカー）
  const playerX = mapX + player.x * tileSize + tileSize / 2;
  const playerY = mapY + player.y * tileSize + tileSize / 2;

  ctx.fillStyle = '#667eea';
  ctx.beginPath();
  ctx.arc(playerX, playerY, tileSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
}
