export type BlockType = 'Floor' | 'Wall' | 'Start' | 'Goal';

export type GameMap = BlockType[][];

export type Position = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type GameStatus = 'playing' | 'cleared';
