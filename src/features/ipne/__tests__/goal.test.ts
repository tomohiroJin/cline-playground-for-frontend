import { isGoal, findGoalPosition, findStartPosition, canGoal } from '../domain/services/goalService';
import { aMap, aPlayer } from './builders';

describe('goal', () => {
  const testMap = aMap(5, 5).withStart(1, 1).withGoal(3, 3).build();

  describe('isGoal', () => {
    test('ゴール位置でtrueを返すこと', () => {
      expect(isGoal(testMap, 3, 3)).toBe(true);
    });

    test('ゴール以外の位置でfalseを返すこと', () => {
      expect(isGoal(testMap, 1, 1)).toBe(false);
      expect(isGoal(testMap, 2, 2)).toBe(false);
    });
  });

  describe('findGoalPosition', () => {
    test('ゴール位置を正しく取得できること', () => {
      const pos = findGoalPosition(testMap);
      expect(pos).toEqual({ x: 3, y: 3 });
    });

    test('ゴールがないマップではundefinedを返すこと', () => {
      const noGoalMap = aMap(3, 3).build();
      const pos = findGoalPosition(noGoalMap);
      expect(pos).toBeUndefined();
    });
  });

  describe('findStartPosition', () => {
    test('スタート位置を正しく取得できること', () => {
      const pos = findStartPosition(testMap);
      expect(pos).toEqual({ x: 1, y: 1 });
    });

    test('スタートがないマップではundefinedを返すこと', () => {
      const noStartMap = aMap(3, 3).build();
      const pos = findStartPosition(noStartMap);
      expect(pos).toBeUndefined();
    });
  });

  describe('isGoal — 境界値', () => {
    test('マップ範囲外でfalseを返すこと', () => {
      expect(isGoal(testMap, -1, 0)).toBe(false);
      expect(isGoal(testMap, 0, -1)).toBe(false);
      expect(isGoal(testMap, 10, 0)).toBe(false);
      expect(isGoal(testMap, 0, 10)).toBe(false);
    });
  });

  describe('canGoal', () => {
    test('鍵を持っている場合はtrueを返すこと', () => {
      const player = aPlayer().withKey().build();
      expect(canGoal(player)).toBe(true);
    });

    test('鍵を持っていない場合はfalseを返すこと', () => {
      const player = aPlayer().build();
      expect(canGoal(player)).toBe(false);
    });
  });
});
