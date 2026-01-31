import { Position, GameMap, Direction, GameStatus } from './types';

export const isValidMove = (pos: Position, map: GameMap): boolean => {
  if (pos.y < 0 || pos.y >= map.length) return false;
  if (pos.x < 0 || pos.x >= map[0].length) return false;

  const cell = map[pos.y][pos.x];
  return cell !== 'Wall';
};

export const getNextPosition = (current: Position, dir: Direction): Position => {
  const next = { ...current };
  switch (dir) {
    case 'up':
      next.y -= 1;
      break;
    case 'down':
      next.y += 1;
      break;
    case 'left':
      next.x -= 1;
      break;
    case 'right':
      next.x += 1;
      break;
  }
  return next;
};

export const checkGameStatus = (pos: Position, map: GameMap): GameStatus => {
  // Boundary check just in case, though usually called after move
  if (pos.y < 0 || pos.y >= map.length) return 'playing';
  if (pos.x < 0 || pos.x >= map[0].length) return 'playing';

  const cell = map[pos.y][pos.x];
  if (cell === 'Goal') {
    return 'cleared';
  }
  return 'playing';
};
