import { getNextPosition, isValidMove, checkGameStatus } from './logic';
import { FIXED_MAP } from './constants';
import { GameMap, Position } from './types';

// Helper to create a small map for testing
const MOCK_MAP: GameMap = [
  ['Wall', 'Wall', 'Wall'],
  ['Wall', 'Floor', 'Goal'],
  ['Wall', 'Wall', 'Wall'],
];

describe('IPNE MVP0 ロジック', () => {
  describe('移動 (Movement)', () => {
    test('指定された方向に座標が移動すること', () => {
      const start: Position = { x: 1, y: 1 };
      expect(getNextPosition(start, 'up')).toEqual({ x: 1, y: 0 });
      expect(getNextPosition(start, 'down')).toEqual({ x: 1, y: 2 });
      expect(getNextPosition(start, 'left')).toEqual({ x: 0, y: 1 });
      expect(getNextPosition(start, 'right')).toEqual({ x: 2, y: 1 });
    });

    test('方向指定がない場合は移動しないこと', () => {
      const start: Position = { x: 1, y: 1 };
      expect(getNextPosition(start, 'none')).toEqual({ x: 1, y: 1 });
    });
  });

  describe('衝突判定 (Collision)', () => {
    test('壁には移動できないこと', () => {
      // (0,0) is Wall in MOCK_MAP
      expect(isValidMove({ x: 0, y: 0 }, MOCK_MAP)).toBe(false);
    });

    test('床には移動できること', () => {
      // (1,1) is Floor in MOCK_MAP
      expect(isValidMove({ x: 1, y: 1 }, MOCK_MAP)).toBe(true);
    });

    test('ゴールへは移動できること', () => {
      // (2,1) is Goal in MOCK_MAP
      expect(isValidMove({ x: 2, y: 1 }, MOCK_MAP)).toBe(true);
    });

    test('マップ外へは移動できないこと', () => {
      expect(isValidMove({ x: -1, y: 0 }, MOCK_MAP)).toBe(false);
      expect(isValidMove({ x: 0, y: -1 }, MOCK_MAP)).toBe(false);
      expect(isValidMove({ x: 3, y: 0 }, MOCK_MAP)).toBe(false); // Width is 3
    });
  });

  describe('ゴール判定 (Goal)', () => {
    test('ゴール座標でなければ "playing" であること', () => {
      expect(checkGameStatus({ x: 1, y: 1 }, MOCK_MAP)).toBe('playing');
    });

    test('ゴール座標ならば "cleared" になること', () => {
      expect(checkGameStatus({ x: 2, y: 1 }, MOCK_MAP)).toBe('cleared');
    });
  });

  describe('マップ生成 (Map Generation)', () => {
    test('規定サイズ（20x20）のマップが生成されること', () => {
      // FIXED_MAP should match constants
      expect(FIXED_MAP.length).toBe(20);
      expect(FIXED_MAP[0].length).toBe(20);
    });

    test('開始地点が１つだけ存在すること', () => {
      let startCount = 0;
      FIXED_MAP.forEach(row =>
        row.forEach(cell => {
          if (cell === 'Start') startCount++;
        })
      );
      expect(startCount).toBe(1);
    });

    test('ゴールが１つだけ存在すること', () => {
      let goalCount = 0;
      FIXED_MAP.forEach(row =>
        row.forEach(cell => {
          if (cell === 'Goal') goalCount++;
        })
      );
      expect(goalCount).toBe(1);
    });
  });
});
