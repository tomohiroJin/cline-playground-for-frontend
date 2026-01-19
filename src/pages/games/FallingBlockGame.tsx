import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type PowerType = 'triple' | 'pierce' | 'bomb' | 'slow' | 'downshot';
type SkillType = 'laser' | 'blast' | 'clear';
type GameStatus = 'idle' | 'playing' | 'clear' | 'over' | 'ending';
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface TimingConfig {
  base: number;
  min: number;
  decay: number;
  stageMult: number;
}

interface Config {
  grid: { width: number; height: number; cellSize: number };
  timing: {
    spawn: TimingConfig;
    fall: TimingConfig;
    bullet: { speed: number; cooldown: number };
  };
  score: { block: number; line: number };
  stages: number[];
  powerUp: {
    chance: number;
    duration: Record<string, number>;
  };
  skill: { chargeRate: number; maxCharge: number };
  dangerLine: number;
  demo: { idleTimeout: number; slideInterval: number };
  spawn: { safeZone: number; maxAttempts: number };
}

interface PowerTypeInfo {
  color: string;
  icon: string;
  name: string;
  desc: string;
}

interface SkillInfo {
  icon: string;
  name: string;
  desc: string;
  color: string;
  key: string;
}

interface Cell {
  x: number;
  y: number;
}

interface BlockData {
  id: string;
  x: number;
  y: number;
  shape: number[][];
  color: string;
  power: PowerType | null;
}

interface BulletData {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  pierce: boolean;
}

interface GameState {
  grid: (string | null)[][];
  blocks: BlockData[];
  bullets: BulletData[];
  score: number;
  stage: number;
  lines: number;
  linesNeeded: number;
  playerY: number;
  time: number;
}

interface ExplosionData {
  id: string;
  x: number;
  y: number;
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

interface Powers {
  triple: boolean;
  pierce: boolean;
  slow: boolean;
  downshot: boolean;
}

interface CollisionTarget {
  type: 'grid' | 'block';
  blockId?: string;
  x: number;
  y: number;
  power?: PowerType | null;
}

interface BulletProcessResult {
  bullets: BulletData[];
  blocks: BlockData[];
  grid: (string | null)[][];
  score: number;
  hitCount: number;
  pendingBombs: { x: number; y: number }[];
}

interface DemoSlide {
  title: string;
  content: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG: Config = {
  grid: { width: 12, height: 18, cellSize: 30 },
  timing: {
    spawn: { base: 2500, min: 800, decay: 30, stageMult: 200 },
    fall: { base: 450, min: 150, decay: 5, stageMult: 30 },
    bullet: { speed: 30, cooldown: 180 },
  },
  score: { block: 10, line: 100 },
  stages: [1, 2, 4, 8],
  powerUp: {
    chance: 0.15,
    duration: { triple: 8000, pierce: 6000, slow: 5000, downshot: 7000 },
  },
  skill: { chargeRate: 500, maxCharge: 100 },
  dangerLine: 2,
  demo: { idleTimeout: 8000, slideInterval: 5000 },
  spawn: { safeZone: 4, maxAttempts: 20 },
};

const BLOCK_COLORS: string[] = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const BLOCK_SHAPES: number[][][] = [
  [[1, 1]],
  [[1], [1]],
  [
    [1, 1],
    [1, 1],
  ],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [
    [1, 1],
    [0, 1],
  ],
  [
    [1, 0],
    [1, 1],
  ],
];

const POWER_TYPES: Record<PowerType, PowerTypeInfo> = {
  triple: { color: '#FF69B4', icon: '🔱', name: '3-Way Shot', desc: '3方向に弾を発射' },
  pierce: { color: '#00FF00', icon: '🔫', name: '貫通弾', desc: 'ブロックを貫通' },
  bomb: { color: '#FF4500', icon: '💣', name: '爆弾', desc: '周囲3x3を爆破' },
  slow: { color: '#87CEEB', icon: '⏱️', name: 'スロー', desc: '落下速度ダウン' },
  downshot: { color: '#9932CC', icon: '⬇️', name: '下方射撃', desc: '下にも弾を発射' },
};

const SKILLS: Record<SkillType, SkillInfo> = {
  laser: { icon: '⚡', name: '縦レーザー', desc: '縦一列を全消去', color: '#FFD700', key: '1' },
  blast: {
    icon: '💥',
    name: '全画面爆破',
    desc: '落下中ブロック全破壊',
    color: '#FF6347',
    key: '2',
  },
  clear: { icon: '✨', name: 'ライン消去', desc: '最下段を消去', color: '#00CED1', key: '3' },
};

const DEMO_SLIDES: DemoSlide[] = [
  {
    title: '🎮 遊び方',
    content: ['← → キーで移動', 'スペースキーで発射', 'ブロックを撃って破壊！'],
  },
  {
    title: '🎯 クリア条件',
    content: [
      'ラインを揃えて消そう！',
      ...CONFIG.stages.map((n, i) => `Stage ${i + 1}: ${n}ライン`),
    ],
  },
  {
    title: '⚡ パワーアップ',
    content: Object.values(POWER_TYPES).map(p => `${p.icon} ${p.name}: ${p.desc}`),
  },
  {
    title: '🌟 必殺技',
    content: [
      'ゲージ100%で発動可能！',
      ...Object.values(SKILLS).map(s => `${s.key}キー: ${s.icon}${s.name}`),
    ],
  },
  {
    title: '💡 コツ',
    content: [
      '光るブロックでパワーアップ！',
      'ピンチ時は必殺技で打開！',
      '赤線を超えるとゲームオーバー',
    ],
  },
];

// ============================================================================
// UTILITIES
// ============================================================================
const uid = (): string => Math.random().toString(36).slice(2);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (val: number, min: number, max: number): number => Math.max(min, Math.min(max, val));
const calcTiming = (
  { base, min, decay, stageMult }: TimingConfig,
  time: number,
  stage: number
): number => Math.max(min, base - time * decay - stage * stageMult);

// ============================================================================
// AUDIO SYSTEM
// ============================================================================
const Audio = (() => {
  let ctx: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {}
    }
    return ctx;
  };

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.2
  ): void => {
    const c = getContext();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch {}
  };

  const sequence = (
    notes: number[],
    interval: number,
    type: OscillatorType = 'sine',
    vol: number = 0.2
  ): void => {
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.1, type, vol), i * interval));
  };

  return {
    shoot: () => playTone(880, 0.08),
    hit: () => playTone(220, 0.08),
    land: () => playTone(120, 0.06, 'triangle'),
    line: () => sequence([523, 659, 784], 50),
    power: () => sequence([440, 660, 880], 30),
    bomb: () => playTone(80, 0.2, 'sawtooth', 0.3),
    over: () => sequence([400, 300, 200], 100, 'sawtooth'),
    win: () => sequence([523, 659, 784, 1047], 80),
    skill: () => sequence([880, 1100, 1320, 1760], 40, 'sine', 0.3),
    charge: () => playTone(660, 0.15, 'sine', 0.15),
  };
})();

// ============================================================================
// GRID MODULE
// ============================================================================
const Grid = {
  create: (w: number, h: number): (string | null)[][] =>
    Array.from({ length: h }, () => Array(w).fill(null)),

  clone: (grid: (string | null)[][]): (string | null)[][] => grid.map(row => [...row]),

  findHighestRow: (grid: (string | null)[][]): number => {
    const idx = grid.findIndex(row => row.some(c => c !== null));
    return idx < 0 ? grid.length : idx;
  },

  clearRow: (grid: (string | null)[][], rowIndex: number): (string | null)[][] => {
    const newGrid = Grid.clone(grid);
    newGrid.splice(rowIndex, 1);
    newGrid.unshift(Array(grid[0].length).fill(null));
    return newGrid;
  },

  clearFullLines: (grid: (string | null)[][]): { grid: (string | null)[][]; cleared: number } => {
    const remaining = grid.filter(row => !row.every(c => c !== null));
    const cleared = grid.length - remaining.length;
    const empty = Array.from({ length: cleared }, () => Array(grid[0].length).fill(null));
    return { grid: [...empty, ...remaining], cleared };
  },

  setCell: (
    grid: (string | null)[][],
    x: number,
    y: number,
    value: string | null
  ): (string | null)[][] => {
    if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
      const newGrid = Grid.clone(grid);
      newGrid[y][x] = value;
      return newGrid;
    }
    return grid;
  },

  clearColumn: (
    grid: (string | null)[][],
    colX: number
  ): { grid: (string | null)[][]; score: number } => {
    const newGrid = Grid.clone(grid);
    let score = 0;
    for (let y = 0; y < newGrid.length; y++) {
      if (newGrid[y][colX]) {
        newGrid[y][colX] = null;
        score += CONFIG.score.block;
      }
    }
    return { grid: newGrid, score };
  },
};

// ============================================================================
// BLOCK MODULE
// ============================================================================
const Block = {
  getCells: (block: BlockData): Cell[] => {
    const cells: Cell[] = [];
    block.shape.forEach((row, dy) =>
      row.forEach((val, dx) => {
        if (val) cells.push({ x: block.x + dx, y: block.y + dy });
      })
    );
    return cells;
  },

  getFutureCells: (block: BlockData, extraRows: number = CONFIG.spawn.safeZone): Cell[] => {
    const cells: Cell[] = [];
    for (let futureY = block.y; futureY <= block.y + extraRows; futureY++) {
      block.shape.forEach((row, dy) =>
        row.forEach((val, dx) => {
          if (val) cells.push({ x: block.x + dx, y: futureY + dy });
        })
      );
    }
    return cells;
  },

  toSingleCells: (block: BlockData): BlockData[] =>
    Block.getCells(block).map((cell, i) => ({
      id: uid(),
      x: cell.x,
      y: cell.y,
      shape: [[1]],
      color: block.color,
      power: i === 0 ? block.power : null,
    })),

  create: (gridWidth: number, existingBlocks: BlockData[] = []): BlockData => {
    const shape = pick(BLOCK_SHAPES);
    const power =
      Math.random() < CONFIG.powerUp.chance ? pick(Object.keys(POWER_TYPES) as PowerType[]) : null;
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;

    const occupiedCells = new Set<string>();
    existingBlocks.forEach(existing => {
      Block.getFutureCells(existing, CONFIG.spawn.safeZone).forEach(cell => {
        occupiedCells.add(`${cell.x},${cell.y}`);
      });
    });

    const possibleX = Array.from({ length: gridWidth - shapeWidth + 1 }, (_, i) => i);
    for (let i = possibleX.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleX[i], possibleX[j]] = [possibleX[j], possibleX[i]];
    }

    const possibleY = [-shapeHeight - 3, -shapeHeight - 2, -shapeHeight - 1, -shapeHeight];

    for (const startY of possibleY) {
      for (const x of possibleX) {
        const block: BlockData = {
          id: uid(),
          x,
          y: startY,
          shape,
          color: pick(BLOCK_COLORS),
          power,
        };

        const newBlockFutureCells = Block.getFutureCells(block, CONFIG.spawn.safeZone);
        const hasOverlap = newBlockFutureCells.some(cell =>
          occupiedCells.has(`${cell.x},${cell.y}`)
        );

        if (!hasOverlap) {
          return block;
        }
      }
    }

    let bestX = Math.floor(gridWidth / 2);
    let maxDistance = -1;

    for (let x = 0; x <= gridWidth - shapeWidth; x++) {
      let minDistToExisting = Infinity;
      existingBlocks.forEach(existing => {
        const dist = Math.abs(x - existing.x);
        minDistToExisting = Math.min(minDistToExisting, dist);
      });
      if (minDistToExisting > maxDistance) {
        maxDistance = minDistToExisting;
        bestX = x;
      }
    }

    return {
      id: uid(),
      x: bestX,
      y: -shapeHeight - 4,
      shape,
      color: pick(BLOCK_COLORS),
      power,
    };
  },

  canMoveTo: (
    block: BlockData,
    targetY: number,
    grid: (string | null)[][],
    height: number,
    others: BlockData[]
  ): boolean =>
    Block.getCells({ ...block, y: targetY }).every(
      ({ x, y }) =>
        y < height &&
        !(y >= 0 && grid[y]?.[x]) &&
        !others.some(o => o.id !== block.id && Block.getCells(o).some(c => c.x === x && c.y === y))
    ),

  placeOnGrid: (blocks: BlockData[], grid: (string | null)[][]): (string | null)[][] =>
    blocks.reduce((g, block) => {
      let newGrid = g;
      Block.getCells(block).forEach(({ x, y }) => {
        newGrid = Grid.setCell(newGrid, x, y, block.color);
      });
      return newGrid;
    }, grid),
};

// ============================================================================
// BULLET MODULE
// ============================================================================
const Bullet = {
  create: (
    x: number,
    y: number,
    dx: number = 0,
    dy: number = -1,
    pierce: boolean = false
  ): BulletData => ({ id: uid(), x, y, dx, dy, pierce }),

  createSpread: (x: number, y: number, pierce: boolean): BulletData[] => [
    Bullet.create(x, y, 0, -1, pierce),
    Bullet.create(x, y, -1, -1, pierce),
    Bullet.create(x, y, 1, -1, pierce),
  ],

  createWithDownshot: (
    x: number,
    y: number,
    pierce: boolean,
    _gridHeight: number
  ): BulletData[] => [Bullet.create(x, y, 0, -1, pierce), Bullet.create(x, y + 1, 0, 1, pierce)],

  createSpreadWithDownshot: (
    x: number,
    y: number,
    pierce: boolean,
    _gridHeight: number
  ): BulletData[] => [
    Bullet.create(x, y, 0, -1, pierce),
    Bullet.create(x, y, -1, -1, pierce),
    Bullet.create(x, y, 1, -1, pierce),
    Bullet.create(x, y + 1, 0, 1, pierce),
  ],

  move: (bullet: BulletData): BulletData => ({
    ...bullet,
    x: bullet.x + bullet.dx,
    y: bullet.y + bullet.dy,
  }),

  isValid: (bullet: BulletData, width: number, height: number): boolean =>
    bullet.y >= 0 && bullet.y < height && bullet.x >= 0 && bullet.x < width,
};

// ============================================================================
// COLLISION MODULE
// ============================================================================
const Collision = {
  buildMap: (blocks: BlockData[], grid: (string | null)[][]): Map<string, CollisionTarget> => {
    const map = new Map<string, CollisionTarget>();

    grid.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) map.set(`${x},${y}`, { type: 'grid', x, y });
      })
    );

    blocks.forEach(block =>
      Block.getCells(block).forEach((cell, i) => {
        if (cell.y >= 0) {
          map.set(`${cell.x},${cell.y}`, {
            type: 'block',
            blockId: block.id,
            x: cell.x,
            y: cell.y,
            power: i === 0 ? block.power : null,
          });
        }
      })
    );

    return map;
  },

  getArea3x3: (cx: number, cy: number, width: number, height: number): Cell[] => {
    const cells: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx,
          y = cy + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  },
};

// ============================================================================
// GAME LOGIC MODULE
// ============================================================================
const GameLogic = {
  processBullets: (
    bullets: BulletData[],
    blocks: BlockData[],
    grid: (string | null)[][],
    width: number,
    height: number,
    onPowerUp: (type: PowerType, x: number, y: number) => void
  ): BulletProcessResult => {
    const result: BulletProcessResult = {
      bullets: [],
      blocks: [...blocks],
      grid: Grid.clone(grid),
      score: 0,
      hitCount: 0,
      pendingBombs: [],
    };

    bullets.forEach(bullet => {
      const moved = Bullet.move(bullet);
      if (!Bullet.isValid(moved, width, height)) return;

      const map = Collision.buildMap(result.blocks, result.grid);
      const positions = [`${bullet.x},${bullet.y}`, `${moved.x},${moved.y}`];
      let hit = false;

      for (const pos of positions) {
        const target = map.get(pos);
        if (!target) continue;

        hit = true;
        result.score += CONFIG.score.block;
        result.hitCount++;

        if (target.power) {
          if (target.power === 'bomb') {
            result.pendingBombs.push({ x: target.x, y: target.y });
          } else {
            onPowerUp(target.power, target.x, target.y);
          }
        }

        if (target.type === 'block' && target.blockId) {
          const idx = result.blocks.findIndex(b => b.id === target.blockId);
          if (idx >= 0) {
            const cells = Block.toSingleCells(result.blocks[idx]).filter(
              c => !(c.x === target.x && c.y === target.y)
            );
            result.blocks.splice(idx, 1, ...cells);
          }
        } else {
          result.grid[target.y][target.x] = null;
        }

        if (!bullet.pierce) break;
        hit = false;
      }

      if (!hit) result.bullets.push(moved);
    });

    return result;
  },

  applyExplosion: (
    cx: number,
    cy: number,
    blocks: BlockData[],
    grid: (string | null)[][],
    width: number,
    height: number
  ) => {
    const area = Collision.getArea3x3(cx, cy, width, height);
    let newBlocks = [...blocks];
    let newGrid = Grid.clone(grid);
    let score = 0;

    area.forEach(({ x, y }) => {
      if (newGrid[y]?.[x]) {
        newGrid[y][x] = null;
        score += CONFIG.score.block;
      }

      for (let i = newBlocks.length - 1; i >= 0; i--) {
        const block = newBlocks[i];
        if (Block.getCells(block).some(c => c.x === x && c.y === y)) {
          const remaining = Block.toSingleCells(block).filter(c => !(c.x === x && c.y === y));
          newBlocks.splice(i, 1, ...remaining);
          score += CONFIG.score.block;
        }
      }
    });

    return { blocks: newBlocks, grid: newGrid, score };
  },

  applyLaserColumn: (
    colX: number,
    blocks: BlockData[],
    grid: (string | null)[][],
    _height: number
  ) => {
    const { grid: clearedGrid, score: gridScore } = Grid.clearColumn(grid, colX);
    let newBlocks = [...blocks];
    let score = gridScore;

    for (let i = newBlocks.length - 1; i >= 0; i--) {
      const block = newBlocks[i];
      const hitCells = Block.getCells(block).filter(c => c.x === colX);

      if (hitCells.length > 0) {
        const remaining = Block.toSingleCells(block).filter(c => c.x !== colX);
        newBlocks.splice(i, 1, ...remaining);
        score += hitCells.length * CONFIG.score.block;
      }
    }

    return { blocks: newBlocks, grid: clearedGrid, score };
  },

  applyBlastAll: (blocks: BlockData[]) => ({
    blocks: [] as BlockData[],
    score: blocks.reduce((s, b) => s + Block.getCells(b).length * CONFIG.score.block, 0),
  }),

  applyClearBottom: (grid: (string | null)[][]) => {
    const bottomRow = grid.length - 1;
    if (!grid[bottomRow].some(c => c !== null)) {
      return { grid, score: 0, cleared: false };
    }
    const score = grid[bottomRow].filter(c => c !== null).length * CONFIG.score.block;
    return { grid: Grid.clearRow(grid, bottomRow), score, cleared: true };
  },

  processBlockFalling: (blocks: BlockData[], grid: (string | null)[][], height: number) => {
    const sorted = [...blocks].sort((a, b) => b.y + b.shape.length - (a.y + a.shape.length));
    const falling: BlockData[] = [];
    const landing: BlockData[] = [];

    sorted.forEach(block => {
      const nextY = block.y + 1;
      const canMove = Block.canMoveTo(block, nextY, grid, height, [...landing, ...falling]);

      if (canMove) {
        falling.push({ ...block, y: nextY });
      } else {
        landing.push(block);
      }
    });

    return { falling, landing };
  },

  calculatePlayerY: (grid: (string | null)[][]): number =>
    Math.max(CONFIG.dangerLine, Grid.findHighestRow(grid) - 1),

  isGameOver: (grid: (string | null)[][]): boolean => {
    for (let y = 0; y <= CONFIG.dangerLine; y++) {
      if (grid[y]?.some(cell => cell !== null)) return true;
    }
    return false;
  },

  canSpawnBlock: (existingBlocks: BlockData[], _gridWidth: number): boolean => {
    const blocksNearTop = existingBlocks.filter(block => {
      const cells = Block.getCells(block);
      return cells.some(cell => cell.y < 2);
    });
    return blocksNearTop.length < 3;
  },

  getSpawnInterval: (time: number, stage: number): number =>
    calcTiming(CONFIG.timing.spawn, time, stage),
  getFallSpeed: (time: number, stage: number, slow: boolean): number =>
    calcTiming(CONFIG.timing.fall, time, stage) * (slow ? 2 : 1),
};

// ============================================================================
// STAGE MODULE
// ============================================================================
const Stage = {
  create: (num: number, score: number, width: number, height: number): GameState => ({
    grid: Grid.create(width, height),
    blocks: [],
    bullets: [],
    score,
    stage: num,
    lines: 0,
    linesNeeded: CONFIG.stages[num - 1],
    playerY: height - 2,
    time: 0,
  }),

  isFinal: (stage: number): boolean => stage >= CONFIG.stages.length,
};

// ============================================================================
// UI COMPONENTS
// ============================================================================
interface CellProps {
  x: number;
  y: number;
  color: string;
  size: number;
  power?: PowerType | null;
}

const CellComponent: React.FC<CellProps> = ({ x, y, color, size, power }) => {
  const p = power ? POWER_TYPES[power] : null;
  return (
    <div
      className="absolute border border-gray-600 rounded-sm flex items-center justify-center text-xs"
      style={{
        left: x * size,
        top: y * size,
        width: size - 1,
        height: size - 1,
        backgroundColor: p?.color || color,
        boxShadow: p ? `0 0 8px ${p.color}` : undefined,
      }}
    >
      {p?.icon}
    </div>
  );
};

interface BulletViewProps {
  bullet: BulletData;
  size: number;
}

const BulletView: React.FC<BulletViewProps> = ({ bullet, size }) => {
  const isDownshot = bullet.dy > 0;
  return (
    <div
      className="absolute rounded-full"
      style={{
        left: bullet.x * size + size / 2 - 3,
        top: bullet.y * size + size / 2 - 5,
        width: 6,
        height: bullet.pierce ? 14 : 10,
        backgroundColor: isDownshot ? '#9932CC' : bullet.pierce ? '#0F0' : '#facc15',
        boxShadow: `0 0 6px ${isDownshot ? '#9932CC' : bullet.pierce ? '#0F0' : '#facc15'}`,
        transform: isDownshot ? 'rotate(180deg)' : 'none',
      }}
    />
  );
};

interface PlayerShipProps {
  x: number;
  y: number;
  size: number;
}

const PlayerShip: React.FC<PlayerShipProps> = ({ x, y, size }) => (
  <div
    className="absolute z-10"
    style={{ left: x * size, top: y * size, width: size, height: size }}
  >
    <svg viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 4px cyan)' }}>
      <polygon points="20,4 36,36 20,28 4,36" fill="#0FF" stroke="#FFF" strokeWidth="2" />
    </svg>
  </div>
);

interface EffectProps {
  visible: boolean;
  style: React.CSSProperties;
  className?: string;
}

const Effect: React.FC<EffectProps> = ({ visible, style, className = '' }) =>
  visible ? <div className={`absolute ${className}`} style={style} /> : null;

interface LaserEffectProps {
  x: number;
  size: number;
  height: number;
}

const LaserEffect: React.FC<LaserEffectProps> = ({ x, size, height }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setTimeout(() => setVisible(false), 300);
  }, []);
  return (
    <Effect
      visible={visible}
      className="animate-pulse"
      style={{
        left: x * size,
        top: 0,
        width: size,
        height: height * size,
        backgroundColor: 'rgba(255, 215, 0, 0.7)',
        boxShadow: '0 0 20px #FFD700',
      }}
    />
  );
};

interface ExplosionEffectProps {
  x: number;
  y: number;
  size: number;
}

const ExplosionEffect: React.FC<ExplosionEffectProps> = ({ x, y, size }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setTimeout(() => setVisible(false), 250);
  }, []);
  return (
    <Effect
      visible={visible}
      className="rounded-full animate-ping"
      style={{
        left: (x - 1) * size,
        top: (y - 1) * size,
        width: size * 3,
        height: size * 3,
        backgroundColor: 'rgba(255, 100, 0, 0.5)',
      }}
    />
  );
};

interface BlastEffectProps {
  visible: boolean;
}

const BlastEffect: React.FC<BlastEffectProps> = ({ visible }) => (
  <Effect
    visible={visible}
    className="inset-0 animate-ping"
    style={{ backgroundColor: 'rgba(255, 99, 71, 0.5)' }}
  />
);

interface SkillGaugeProps {
  charge: number;
  onUseSkill: (skill: SkillType) => void;
}

const SkillGauge: React.FC<SkillGaugeProps> = ({ charge, onUseSkill }) => {
  const isFull = charge >= CONFIG.skill.maxCharge;
  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <div className="flex items-center gap-2">
        <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-500">
          <div
            className={`h-full transition-all duration-300 ${isFull ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'}`}
            style={{ width: `${charge}%` }}
          />
        </div>
        <span className="text-sm text-white font-bold">{Math.floor(charge)}%</span>
      </div>
      {isFull && (
        <div className="flex gap-2">
          {(Object.entries(SKILLS) as [SkillType, SkillInfo][]).map(([key, skill]) => (
            <button
              key={key}
              onClick={() => onUseSkill(key)}
              className="px-4 py-3 rounded-lg text-base font-bold animate-bounce hover:scale-110 active:scale-95 transition-transform select-none touch-manipulation min-w-[70px]"
              style={{ backgroundColor: skill.color }}
              title={`${skill.name}: ${skill.desc}`}
            >
              <span className="text-xl">{skill.icon}</span>
              <span className="text-xs ml-1">{skill.key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface PowerUpIndicatorProps {
  powers: Powers;
}

const PowerUpIndicator: React.FC<PowerUpIndicatorProps> = ({ powers }) => {
  const active = (Object.entries(powers) as [PowerType, boolean][]).filter(
    ([k, v]) => v && k !== 'bomb'
  );
  if (!active.length) return null;
  return (
    <div className="flex gap-1 mb-1">
      {active.map(([k]) => (
        <span
          key={k}
          className="px-1 rounded text-xs font-bold animate-pulse"
          style={{ backgroundColor: POWER_TYPES[k].color }}
        >
          {POWER_TYPES[k].icon}
        </span>
      ))}
    </div>
  );
};

interface StatusBarProps {
  stage: number;
  lines: number;
  linesNeeded: number;
  score: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ stage, lines, linesNeeded, score }) => (
  <div className="flex gap-2 mb-1 text-white text-xs font-bold">
    <span className="bg-purple-600 px-2 py-0.5 rounded">ST{stage}</span>
    <span className="bg-green-600 px-2 py-0.5 rounded">
      {lines}/{linesNeeded}
    </span>
    <span className="bg-blue-600 px-2 py-0.5 rounded">{score}</span>
  </div>
);

interface OverlayProps {
  children: ReactNode;
}

const Overlay: React.FC<OverlayProps> = ({ children }) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
    <div className="p-4 rounded-lg text-center">{children}</div>
  </div>
);

interface ButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, variant = 'primary', children }) => {
  const styles = {
    primary: 'bg-green-600 hover:bg-green-500',
    secondary: 'bg-gray-600 hover:bg-gray-500',
  };
  return (
    <button
      onClick={onClick}
      className={`${styles[variant]} text-white px-4 py-1.5 rounded font-bold`}
    >
      {children}
    </button>
  );
};

interface ControlButtonProps {
  onClick: () => void;
  variant?: 'fire' | 'default';
  children: ReactNode;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, variant, children }) => (
  <button
    onClick={onClick}
    className={`text-white rounded-xl font-bold active:scale-95 select-none touch-manipulation ${
      variant === 'fire'
        ? 'bg-red-600 active:bg-red-700 px-8 py-4 text-2xl min-w-[100px]'
        : 'bg-gray-700 active:bg-gray-600 px-6 py-4 text-3xl min-w-[70px]'
    }`}
  >
    {children}
  </button>
);

const Fireworks: React.FC = () => {
  const [particles, setParticles] = useState<ParticleData[]>([]);

  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFEAA7', '#FFD700'];
    const init = Array(5)
      .fill(0)
      .flatMap(() => {
        const cx = 30 + Math.random() * 40;
        const cy = 25 + Math.random() * 20;
        return Array(12)
          .fill(0)
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 1.5 + Math.random();
            return {
              id: uid(),
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: pick(colors),
              life: 1,
            };
          });
      });

    setParticles(init);
    const interval = setInterval(() => {
      setParticles(p =>
        p
          .map(pt => ({
            ...pt,
            x: pt.x + pt.vx * 0.4,
            y: pt.y + pt.vy * 0.4,
            vy: pt.vy + 0.06,
            life: pt.life - 0.02,
          }))
          .filter(pt => pt.life > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 5,
            height: 5,
            backgroundColor: p.color,
            opacity: p.life,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// SCREEN COMPONENTS
// ============================================================================
interface DemoScreenProps {
  onDismiss: () => void;
}

const DemoScreen: React.FC<DemoScreenProps> = ({ onDismiss }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex(i => (i + 1) % DEMO_SLIDES.length),
      CONFIG.demo.slideInterval
    );
    return () => clearInterval(id);
  }, []);

  const slide = DEMO_SLIDES[index];

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 cursor-pointer"
      onClick={onDismiss}
      onMouseMove={onDismiss}
      onTouchStart={onDismiss}
    >
      <div className="text-center p-6 max-w-sm">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 animate-pulse">{slide.title}</h2>
        <div className="space-y-2">
          {slide.content.map((line, i) => (
            <p key={i} className="text-white text-sm">
              {line}
            </p>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {DEMO_SLIDES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-cyan-400' : 'bg-gray-600'}`}
            />
          ))}
        </div>
        <p className="text-gray-500 text-xs mt-4 animate-bounce">タップまたはマウス移動で戻る</p>
      </div>
    </div>
  );
};

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => (
  <Overlay>
    <h2 className="text-lg text-cyan-400 font-bold mb-2">落ち物シューティング</h2>
    <p className="text-gray-300 text-xs mb-2">← → Space</p>
    <Button onClick={onStart}>Start</Button>
  </Overlay>
);

interface ClearScreenProps {
  stage: number;
  onNext: () => void;
}

const ClearScreen: React.FC<ClearScreenProps> = ({ stage, onNext }) => (
  <Overlay>
    <h2 className="text-lg text-green-400 font-bold mb-2">🎉 Stage {stage} Clear!</h2>
    <Button onClick={onNext}>Next</Button>
  </Overlay>
);

interface GameOverScreenProps {
  score: number;
  onRetry: () => void;
  onTitle: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRetry, onTitle }) => (
  <Overlay>
    <h2 className="text-lg text-red-500 font-bold mb-2">Game Over</h2>
    <p className="text-white text-sm mb-3">Score: {score}</p>
    <div className="flex gap-2 justify-center">
      <Button onClick={onRetry}>Retry</Button>
      <Button onClick={onTitle} variant="secondary">
        Title
      </Button>
    </div>
  </Overlay>
);

interface EndingScreenProps {
  score: number;
  onRetry: () => void;
  onTitle: () => void;
}

const EndingScreen: React.FC<EndingScreenProps> = ({ score, onRetry, onTitle }) => (
  <Overlay>
    <Fireworks />
    <h2 className="text-xl text-yellow-400 font-bold mb-2">🎊 Clear! 🎊</h2>
    <p className="text-cyan-300 text-lg mb-3">Score: {score}</p>
    <div className="flex gap-2 justify-center">
      <Button onClick={onRetry}>Again</Button>
      <Button onClick={onTitle} variant="secondary">
        Title
      </Button>
    </div>
  </Overlay>
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================
const useInterval = (callback: () => void, delay: number, enabled: boolean): void => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay, enabled]);
};

interface KeyboardHandlers {
  left: () => void;
  right: () => void;
  fire: () => void;
  skill1: () => void;
  skill2: () => void;
  skill3: () => void;
}

const useKeyboard = (enabled: boolean, handlers: KeyboardHandlers): void => {
  useEffect(() => {
    if (!enabled) return;

    const keyMap: Record<string, () => void> = {
      ArrowLeft: handlers.left,
      ArrowRight: handlers.right,
      ' ': handlers.fire,
      ArrowUp: handlers.fire,
      '1': handlers.skill1,
      '2': handlers.skill2,
      '3': handlers.skill3,
    };

    const handle = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [enabled, handlers]);
};

const useIdleTimer = (timeout: number, onIdle: () => void, enabled: boolean): (() => void) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) timerRef.current = setTimeout(onIdle, timeout);
  }, [timeout, onIdle, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    reset();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, reset]);

  return reset;
};

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================
const FallingBlockGame: React.FC = () => {
  const { width: W, height: H, cellSize: SZ } = CONFIG.grid;

  // State
  const stateRef = useRef<GameState>(Stage.create(1, 0, W, H));
  const spawnTimeRef = useRef<number>(0);
  const prevScoreRef = useRef<number>(0);

  const [, forceUpdate] = useState<number>(0);
  const [playerX, setPlayerX] = useState<number>(Math.floor(W / 2));
  const [status, setStatus] = useState<GameStatus>('idle');
  const [canFire, setCanFire] = useState<boolean>(true);
  const [powers, setPowers] = useState<Powers>({
    triple: false,
    pierce: false,
    slow: false,
    downshot: false,
  });
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [laserX, setLaserX] = useState<number | null>(null);
  const [showBlast, setShowBlast] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [skillCharge, setSkillCharge] = useState<number>(0);

  const state = stateRef.current;
  const isPlaying = status === 'playing';
  const isIdle = status === 'idle';

  // Helpers
  const updateState = useCallback((changes: Partial<GameState>) => {
    Object.assign(stateRef.current, changes);
    forceUpdate(n => n + 1);
  }, []);

  const playSound = useCallback(
    (sound: () => void) => {
      if (soundEnabled) sound();
    },
    [soundEnabled]
  );

  // Skill charge effect
  useEffect(() => {
    if (!isPlaying) return;
    const scoreDiff = state.score - prevScoreRef.current;
    if (scoreDiff > 0) {
      const chargeGain = (scoreDiff / CONFIG.skill.chargeRate) * 100;
      setSkillCharge(c => {
        const newCharge = Math.min(CONFIG.skill.maxCharge, c + chargeGain);
        if (c < 100 && newCharge >= 100) playSound(Audio.charge);
        return newCharge;
      });
    }
    prevScoreRef.current = state.score;
  }, [state.score, isPlaying, playSound]);

  // Power-up handlers
  const handlePowerExpire = useCallback((type: PowerType) => {
    setPowers(p => ({ ...p, [type]: false }));
  }, []);

  const handlePowerUp = useCallback(
    (type: PowerType, x: number, y: number) => {
      if (type === 'bomb') {
        playSound(Audio.bomb);
        setExplosions(e => [...e, { id: uid(), x, y }]);
        setTimeout(() => {
          const st = stateRef.current;
          const result = GameLogic.applyExplosion(x, y, st.blocks, st.grid, W, H);
          updateState({
            blocks: result.blocks,
            grid: result.grid,
            score: st.score + result.score,
          });
        }, 0);
      } else {
        playSound(Audio.power);
        setPowers(p => ({ ...p, [type]: true }));
        setTimeout(() => handlePowerExpire(type), CONFIG.powerUp.duration[type]);
      }
    },
    [playSound, updateState, handlePowerExpire, W, H]
  );

  // Skill handler
  const useSkill = useCallback(
    (skillType: SkillType) => {
      if (skillCharge < CONFIG.skill.maxCharge) return;

      playSound(Audio.skill);
      setSkillCharge(0);

      const st = stateRef.current;

      switch (skillType) {
        case 'laser': {
          setLaserX(playerX);
          setTimeout(() => setLaserX(null), 300);
          const result = GameLogic.applyLaserColumn(playerX, st.blocks, st.grid, H);
          updateState({ blocks: result.blocks, grid: result.grid, score: st.score + result.score });
          break;
        }
        case 'blast': {
          setShowBlast(true);
          setTimeout(() => setShowBlast(false), 400);
          const result = GameLogic.applyBlastAll(st.blocks);
          updateState({ blocks: result.blocks, score: st.score + result.score });
          break;
        }
        case 'clear': {
          const result = GameLogic.applyClearBottom(st.grid);
          if (result.cleared) {
            const newPlayerY = GameLogic.calculatePlayerY(result.grid);
            updateState({ grid: result.grid, score: st.score + result.score, playerY: newPlayerY });
          }
          break;
        }
      }
    },
    [skillCharge, playerX, playSound, updateState, H]
  );

  // Game flow handlers
  const startStage = useCallback(
    (num: number, score: number = 0) => {
      stateRef.current = Stage.create(num, score, W, H);
      prevScoreRef.current = score;
      setPlayerX(Math.floor(W / 2));
      setCanFire(true);
      setPowers({ triple: false, pierce: false, slow: false, downshot: false });
      setExplosions([]);
      setLaserX(null);
      setShowBlast(false);
      spawnTimeRef.current = 0;
      setStatus('playing');
      setShowDemo(false);
      forceUpdate(n => n + 1);
    },
    [W, H]
  );

  const goToTitle = useCallback(() => {
    stateRef.current = Stage.create(1, 0, W, H);
    prevScoreRef.current = 0;
    setPlayerX(Math.floor(W / 2));
    setPowers({ triple: false, pierce: false, slow: false, downshot: false });
    setExplosions([]);
    setSkillCharge(0);
    setStatus('idle');
    forceUpdate(n => n + 1);
  }, [W, H]);

  const resetGame = useCallback(() => {
    setSkillCharge(0);
    startStage(1, 0);
  }, [startStage]);

  const nextStage = useCallback(() => {
    playSound(Audio.win);
    startStage(state.stage + 1, state.score);
  }, [startStage, state.stage, state.score, playSound]);

  // Controls
  const moveLeft = useCallback(() => setPlayerX(x => clamp(x - 1, 0, W - 1)), [W]);
  const moveRight = useCallback(() => setPlayerX(x => clamp(x + 1, 0, W - 1)), [W]);

  const fire = useCallback(() => {
    if (!canFire) return;
    playSound(Audio.shoot);
    const y = stateRef.current.playerY - 1;

    let newBullets: BulletData[];
    if (powers.triple && powers.downshot) {
      newBullets = Bullet.createSpreadWithDownshot(playerX, y, powers.pierce, H);
    } else if (powers.triple) {
      newBullets = Bullet.createSpread(playerX, y, powers.pierce);
    } else if (powers.downshot) {
      newBullets = Bullet.createWithDownshot(playerX, y, powers.pierce, H);
    } else {
      newBullets = [Bullet.create(playerX, y, 0, -1, powers.pierce)];
    }

    updateState({ bullets: [...stateRef.current.bullets, ...newBullets] });
    setCanFire(false);
    setTimeout(() => setCanFire(true), CONFIG.timing.bullet.cooldown);
  }, [canFire, playerX, powers, playSound, updateState, H]);

  // Hooks
  useIdleTimer(CONFIG.demo.idleTimeout, () => setShowDemo(true), isIdle && !showDemo);

  useKeyboard(isPlaying, {
    left: moveLeft,
    right: moveRight,
    fire,
    skill1: () => useSkill('laser'),
    skill2: () => useSkill('blast'),
    skill3: () => useSkill('clear'),
  });

  // Game loops
  useInterval(() => updateState({ time: state.time + 1 }), 1000, isPlaying);

  useInterval(
    () => {
      const now = Date.now();
      const spawnInterval = GameLogic.getSpawnInterval(state.time, state.stage);

      if (now - spawnTimeRef.current > spawnInterval) {
        if (GameLogic.canSpawnBlock(state.blocks, W)) {
          updateState({ blocks: [...state.blocks, Block.create(W, state.blocks)] });
          spawnTimeRef.current = now;
        }
      }
    },
    100,
    isPlaying
  );

  useInterval(
    () => {
      if (!state.bullets.length) return;

      const result = GameLogic.processBullets(
        state.bullets,
        state.blocks,
        state.grid,
        W,
        H,
        handlePowerUp
      );

      if (result.hitCount > 0) playSound(Audio.hit);

      updateState({
        bullets: result.bullets,
        blocks: result.blocks,
        grid: result.grid,
        score: state.score + result.score,
      });

      result.pendingBombs.forEach(({ x, y }) => handlePowerUp('bomb', x, y));
    },
    CONFIG.timing.bullet.speed,
    isPlaying
  );

  useInterval(
    () => {
      if (!state.blocks.length) return;

      const { falling, landing } = GameLogic.processBlockFalling(state.blocks, state.grid, H);

      if (!landing.length) {
        updateState({ blocks: falling });
        return;
      }

      playSound(Audio.land);

      const gridWithLanded = Block.placeOnGrid(landing, state.grid);
      const { grid: clearedGrid, cleared } = Grid.clearFullLines(gridWithLanded);

      if (cleared > 0) playSound(Audio.line);

      const newLines = state.lines + cleared;
      const newPlayerY = GameLogic.calculatePlayerY(clearedGrid);
      const lineScore = cleared * CONFIG.score.line * state.stage;

      updateState({
        blocks: falling,
        grid: clearedGrid,
        playerY: newPlayerY,
        score: state.score + lineScore,
        lines: newLines,
      });

      if (newLines >= state.linesNeeded) {
        setStatus(Stage.isFinal(state.stage) ? 'ending' : 'clear');
        return;
      }

      if (GameLogic.isGameOver(clearedGrid)) {
        playSound(Audio.over);
        setStatus('over');
      }
    },
    GameLogic.getFallSpeed(state.time, state.stage, powers.slow),
    isPlaying
  );

  // Render
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 p-2">
      {showDemo && <DemoScreen onDismiss={() => setShowDemo(false)} />}

      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-lg font-bold text-white">落ち物シューティング</h1>
        <button
          onClick={() => setSoundEnabled(s => !s)}
          className="px-2 py-0.5 bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={() => setShowDemo(true)}
          className="px-2 py-0.5 bg-gray-700 rounded text-sm hover:bg-gray-600"
        >
          ❓
        </button>
      </div>

      <SkillGauge charge={skillCharge} onUseSkill={useSkill} />
      <PowerUpIndicator powers={powers} />
      <StatusBar
        stage={state.stage}
        lines={state.lines}
        linesNeeded={state.linesNeeded}
        score={state.score}
      />

      <div className="relative">
        {status === 'idle' && <StartScreen onStart={resetGame} />}
        {status === 'clear' && <ClearScreen stage={state.stage} onNext={nextStage} />}
        {status === 'over' && (
          <GameOverScreen score={state.score} onRetry={resetGame} onTitle={goToTitle} />
        )}
        {status === 'ending' && (
          <EndingScreen score={state.score} onRetry={resetGame} onTitle={goToTitle} />
        )}

        <div
          className="relative bg-gray-800 border-4 border-indigo-500 rounded-lg overflow-hidden"
          style={{ width: W * SZ, height: H * SZ }}
        >
          {state.grid.map((row, y) =>
            row.map(
              (color, x) =>
                color && <CellComponent key={`g${x}${y}`} x={x} y={y} color={color} size={SZ} />
            )
          )}

          {state.blocks.map(block =>
            Block.getCells(block).map(
              (cell, i) =>
                cell.y >= 0 && (
                  <CellComponent
                    key={`b${block.id}${i}`}
                    x={cell.x}
                    y={cell.y}
                    color={block.color}
                    size={SZ}
                    power={i === 0 ? block.power : null}
                  />
                )
            )
          )}

          {state.bullets.map(b => (
            <BulletView key={b.id} bullet={b} size={SZ} />
          ))}
          {explosions.map(e => (
            <ExplosionEffect key={e.id} x={e.x} y={e.y} size={SZ} />
          ))}
          {laserX !== null && <LaserEffect x={laserX} size={SZ} height={H} />}
          <BlastEffect visible={showBlast} />
          <PlayerShip x={playerX} y={state.playerY} size={SZ} />

          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-red-500 opacity-50"
            style={{ top: SZ * CONFIG.dangerLine }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-4 justify-center">
        <ControlButton onClick={moveLeft}>←</ControlButton>
        <ControlButton onClick={fire} variant="fire">
          🎯
        </ControlButton>
        <ControlButton onClick={moveRight}>→</ControlButton>
      </div>
    </div>
  );
};
export default FallingBlockGame;
