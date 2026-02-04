/**
 * 迷路自動生成（BSPアルゴリズム）
 */
import { GameMap, MazeConfig, Rectangle, Room, Corridor, TileType } from './types';

/** BSP木のノード */
interface BSPNode {
  rect: Rectangle;
  room?: Room;
  left?: BSPNode;
  right?: BSPNode;
}

/** 迷路生成結果 */
export interface MazeResult {
  grid: GameMap;
  rooms: Room[];
}

/**
 * 迷路を自動生成する
 */
export function generateMaze(config: MazeConfig): MazeResult {
  // 初期グリッド（全て壁）
  const grid: GameMap = Array.from({ length: config.height }, () =>
    Array(config.width).fill(TileType.WALL)
  );

  // BSP分割で空間を分割
  const rootRect: Rectangle = {
    x: 1,
    y: 1,
    width: config.width - 2,
    height: config.height - 2,
  };
  const root = splitSpace(rootRect, 0, config.maxDepth, config.minRoomSize);

  // 各リーフノードに部屋を生成
  const rooms: Room[] = [];
  const corridors: Corridor[] = [];
  generateRooms(root, config, rooms);

  // 部屋を接続
  connectRooms(root, config, corridors);

  // グリッドに描画
  drawRooms(grid, rooms);
  drawCorridors(grid, corridors, config.corridorWidth);

  // ループを追加（探索の幅を広げる）
  addLoops(grid, rooms, config.loopCount, config.corridorWidth);

  // 各部屋にtilesを追加（部屋内の床タイル座標リスト）
  for (const room of rooms) {
    room.tiles = [];
    const { x, y, width, height } = room.rect;
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        room.tiles.push({ x: x + dx, y: y + dy });
      }
    }
  }

  return { grid, rooms };
}

/**
 * 空間をBSP分割する
 */
function splitSpace(rect: Rectangle, depth: number, maxDepth: number, minSize: number): BSPNode {
  const node: BSPNode = { rect };

  // 分割終了条件
  if (depth >= maxDepth || !canSplit(rect, minSize)) {
    return node;
  }

  // 分割方向を決定（横長なら縦分割、縦長なら横分割の傾向）
  const horizontal = rect.width > rect.height ? Math.random() > 0.3 : Math.random() > 0.7;

  const { left, right } = split(rect, horizontal, minSize);

  if (left && right) {
    node.left = splitSpace(left, depth + 1, maxDepth, minSize);
    node.right = splitSpace(right, depth + 1, maxDepth, minSize);
  }

  return node;
}

/**
 * 分割可能かチェック
 */
function canSplit(rect: Rectangle, minSize: number): boolean {
  return rect.width >= minSize * 2 + 2 && rect.height >= minSize * 2 + 2;
}

/**
 * 矩形を分割
 */
function split(
  rect: Rectangle,
  horizontal: boolean,
  minSize: number
): { left: Rectangle | null; right: Rectangle | null } {
  if (horizontal) {
    // 横分割（上下に分ける）
    const minY = rect.y + minSize;
    const maxY = rect.y + rect.height - minSize;
    if (minY >= maxY) return { left: null, right: null };

    const splitY = Math.floor(Math.random() * (maxY - minY)) + minY;
    return {
      left: { x: rect.x, y: rect.y, width: rect.width, height: splitY - rect.y },
      right: {
        x: rect.x,
        y: splitY,
        width: rect.width,
        height: rect.y + rect.height - splitY,
      },
    };
  } else {
    // 縦分割（左右に分ける）
    const minX = rect.x + minSize;
    const maxX = rect.x + rect.width - minSize;
    if (minX >= maxX) return { left: null, right: null };

    const splitX = Math.floor(Math.random() * (maxX - minX)) + minX;
    return {
      left: { x: rect.x, y: rect.y, width: splitX - rect.x, height: rect.height },
      right: {
        x: splitX,
        y: rect.y,
        width: rect.x + rect.width - splitX,
        height: rect.height,
      },
    };
  }
}

/**
 * リーフノードに部屋を生成
 */
function generateRooms(node: BSPNode, config: MazeConfig, rooms: Room[]): void {
  if (node.left) {
    generateRooms(node.left, config, rooms);
  }
  if (node.right) {
    generateRooms(node.right, config, rooms);
  }

  // リーフノードの場合、部屋を作成
  if (!node.left && !node.right) {
    const room = createRoom(node.rect, config);
    node.room = room;
    rooms.push(room);
  }
}

/**
 * 矩形内に部屋を作成
 */
function createRoom(rect: Rectangle, config: MazeConfig): Room {
  const { minRoomSize, maxRoomSize } = config;

  const maxW = Math.min(rect.width - 2, maxRoomSize);
  const maxH = Math.min(rect.height - 2, maxRoomSize);
  const minW = Math.min(rect.width - 2, minRoomSize);
  const minH = Math.min(rect.height - 2, minRoomSize);

  const w = Math.floor(Math.random() * (maxW - minW + 1)) + minW;
  const h = Math.floor(Math.random() * (maxH - minH + 1)) + minH;

  const x = rect.x + Math.floor(Math.random() * (rect.width - w));
  const y = rect.y + Math.floor(Math.random() * (rect.height - h));

  const roomRect: Rectangle = { x, y, width: w, height: h };
  const center = {
    x: Math.floor(x + w / 2),
    y: Math.floor(y + h / 2),
  };

  return { rect: roomRect, center };
}

/**
 * 部屋同士を通路で接続
 */
function connectRooms(node: BSPNode, config: MazeConfig, corridors: Corridor[]): void {
  if (node.left) {
    connectRooms(node.left, config, corridors);
  }
  if (node.right) {
    connectRooms(node.right, config, corridors);
  }

  // 左右の子ノードがあれば、それらを接続
  if (node.left && node.right) {
    const leftRoom = getRandomRoom(node.left);
    const rightRoom = getRandomRoom(node.right);

    if (leftRoom && rightRoom) {
      const corridor = createCorridor(leftRoom.center, rightRoom.center);
      corridors.push(corridor);
    }
  }
}

/**
 * ノードからランダムに部屋を取得
 */
function getRandomRoom(node: BSPNode): Room | null {
  if (node.room) {
    return node.room;
  }

  const rooms: Room[] = [];
  collectRooms(node, rooms);

  return rooms.length > 0 ? rooms[Math.floor(Math.random() * rooms.length)] : null;
}

/**
 * ノードから全ての部屋を収集
 */
function collectRooms(node: BSPNode, rooms: Room[]): void {
  if (node.room) {
    rooms.push(node.room);
  }
  if (node.left) {
    collectRooms(node.left, rooms);
  }
  if (node.right) {
    collectRooms(node.right, rooms);
  }
}

/**
 * L字型通路を作成
 */
function createCorridor(start: { x: number; y: number }, end: { x: number; y: number }): Corridor {
  // 横→縦 or 縦→横 をランダムに選択
  const horizontal = Math.random() > 0.5;
  return { start, end, horizontal };
}

/**
 * 部屋をグリッドに描画
 */
function drawRooms(grid: GameMap, rooms: Room[]): void {
  for (const room of rooms) {
    const { x, y, width, height } = room.rect;
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const gx = x + dx;
        const gy = y + dy;
        if (gy >= 0 && gy < grid.length && gx >= 0 && gx < grid[0].length) {
          grid[gy][gx] = TileType.FLOOR;
        }
      }
    }
  }
}

/**
 * 通路をグリッドに描画
 */
function drawCorridors(grid: GameMap, corridors: Corridor[], width: number): void {
  for (const corridor of corridors) {
    const { start, end, horizontal } = corridor;

    if (horizontal) {
      // 横→縦
      drawHorizontalLine(grid, start.x, end.x, start.y, width);
      drawVerticalLine(grid, end.x, start.y, end.y, width);
    } else {
      // 縦→横
      drawVerticalLine(grid, start.x, start.y, end.y, width);
      drawHorizontalLine(grid, start.x, end.x, end.y, width);
    }
  }
}

/**
 * 水平線を描画
 */
function drawHorizontalLine(grid: GameMap, x1: number, x2: number, y: number, width: number): void {
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  const offset = Math.floor(width / 2);

  for (let x = startX; x <= endX; x++) {
    for (let dy = -offset; dy <= offset; dy++) {
      const gy = y + dy;
      if (gy >= 0 && gy < grid.length && x >= 0 && x < grid[0].length) {
        grid[gy][x] = TileType.FLOOR;
      }
    }
  }
}

/**
 * 垂直線を描画
 */
function drawVerticalLine(grid: GameMap, x: number, y1: number, y2: number, width: number): void {
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);
  const offset = Math.floor(width / 2);

  for (let y = startY; y <= endY; y++) {
    for (let dx = -offset; dx <= offset; dx++) {
      const gx = x + dx;
      if (y >= 0 && y < grid.length && gx >= 0 && gx < grid[0].length) {
        grid[y][gx] = TileType.FLOOR;
      }
    }
  }
}

/**
 * ループを追加（ランダムに部屋を接続）
 */
function addLoops(grid: GameMap, rooms: Room[], loopCount: number, corridorWidth: number): void {
  for (let i = 0; i < loopCount; i++) {
    if (rooms.length < 2) break;

    const room1 = rooms[Math.floor(Math.random() * rooms.length)];
    const room2 = rooms[Math.floor(Math.random() * rooms.length)];

    if (room1 !== room2) {
      const corridor = createCorridor(room1.center, room2.center);
      drawCorridors(grid, [corridor], corridorWidth);
    }
  }
}
