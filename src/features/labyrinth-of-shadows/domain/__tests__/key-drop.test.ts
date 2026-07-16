import { chooseDropCell } from '../services/key-drop';
import { FIXED_MAZE_9X9 } from '../../__tests__/helpers/fixed-maze';
import type { Item } from '../../types';

describe('chooseDropCell', () => {
  test('敵と最も反対方向の歩けるセルを返す', () => {
    // プレイヤーはセル(1,1)中心。敵は南(+y)側。
    // (1,1)の歩ける隣接は (2,1) と (1,2)。敵から遠い (2,1) を選ぶ。
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8, []);
    expect(cell).toEqual({ x: 2, y: 1 });
  });

  test('歩ける隣接が無ければプレイヤー自身のセルにフォールバックする', () => {
    // 中央だけ通路、四方が壁の 3x3 迷路
    const boxed = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    const cell = chooseDropCell(boxed, 1.5, 1.5, 1.5, 1.5, []);
    expect(cell).toEqual({ x: 1, y: 1 });
  });

  test('返すセルは必ず歩ける（壁を返さない）', () => {
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8, []);
    expect(FIXED_MAZE_9X9[cell.y][cell.x]).toBe(0);
  });

  test('未取得アイテムが載る歩けるセルは避ける', () => {
    // (1,1)の歩ける隣接は (2,1) と (1,2)。本来は敵から遠い (2,1) が選ばれるが、
    // (2,1) に未取得の罠があると避けて (1,2) を選ぶ（罠セルへの理不尽な着地を防ぐ）。
    const items: Item[] = [{ x: 2, y: 1, type: 'trap', got: false }];
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8, items);
    expect(cell).toEqual({ x: 1, y: 2 });
  });

  test('取得済みアイテムのセルは占有とみなさない', () => {
    // (2,1) の鍵が取得済み(got=true)なら重なってよい＝本来の (2,1) を選ぶ。
    const items: Item[] = [{ x: 2, y: 1, type: 'key', got: true }];
    const cell = chooseDropCell(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.8, items);
    expect(cell).toEqual({ x: 2, y: 1 });
  });
});
