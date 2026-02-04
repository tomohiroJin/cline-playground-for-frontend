/**
 * 職業システムのテスト
 */
import {
  CLASS_CONFIGS,
  getClassConfig,
  canSeeTrap,
  canSeeSpecialWall,
  getTrapAlpha,
  getWallAlpha,
} from '../class';
import { PlayerClass, TrapState, WallState, WallType } from '../types';

describe('class', () => {
  describe('CLASS_CONFIGS', () => {
    test('戦士の設定が正しいこと', () => {
      const config = CLASS_CONFIGS[PlayerClass.WARRIOR];
      expect(config.name).toBe('戦士');
      expect(config.trapVisibility).toBe('none');
      expect(config.wallVisibility).toBe('none');
    });

    test('盗賊の設定が正しいこと', () => {
      const config = CLASS_CONFIGS[PlayerClass.THIEF];
      expect(config.name).toBe('盗賊');
      expect(config.trapVisibility).toBe('faint');
      expect(config.wallVisibility).toBe('faint');
    });
  });

  describe('getClassConfig', () => {
    test('職業に応じた設定を返すこと', () => {
      expect(getClassConfig(PlayerClass.WARRIOR).name).toBe('戦士');
      expect(getClassConfig(PlayerClass.THIEF).name).toBe('盗賊');
    });
  });

  describe('canSeeTrap', () => {
    test('戦士は未発見罠が見えないこと', () => {
      expect(canSeeTrap(PlayerClass.WARRIOR, TrapState.HIDDEN)).toBe(false);
    });

    test('盗賊は未発見罠が見えること（半透明）', () => {
      expect(canSeeTrap(PlayerClass.THIEF, TrapState.HIDDEN)).toBe(true);
    });

    test('両職業で発見済み罠が見えること', () => {
      expect(canSeeTrap(PlayerClass.WARRIOR, TrapState.REVEALED)).toBe(true);
      expect(canSeeTrap(PlayerClass.THIEF, TrapState.REVEALED)).toBe(true);
    });

    test('両職業で発動済み罠が見えること', () => {
      expect(canSeeTrap(PlayerClass.WARRIOR, TrapState.TRIGGERED)).toBe(true);
      expect(canSeeTrap(PlayerClass.THIEF, TrapState.TRIGGERED)).toBe(true);
    });
  });

  describe('canSeeSpecialWall', () => {
    test('戦士は未発見の破壊可能壁が見えないこと', () => {
      expect(canSeeSpecialWall(PlayerClass.WARRIOR, WallType.BREAKABLE, WallState.INTACT)).toBe(false);
    });

    test('戦士は未発見のすり抜け可能壁が見えないこと', () => {
      expect(canSeeSpecialWall(PlayerClass.WARRIOR, WallType.PASSABLE, WallState.INTACT)).toBe(false);
    });

    test('戦士は未発見の透明壁が見えないこと', () => {
      expect(canSeeSpecialWall(PlayerClass.WARRIOR, WallType.INVISIBLE, WallState.INTACT)).toBe(false);
    });

    test('盗賊は未発見の破壊可能壁が見えること', () => {
      expect(canSeeSpecialWall(PlayerClass.THIEF, WallType.BREAKABLE, WallState.INTACT)).toBe(true);
    });

    test('盗賊は未発見のすり抜け可能壁が見えること', () => {
      expect(canSeeSpecialWall(PlayerClass.THIEF, WallType.PASSABLE, WallState.INTACT)).toBe(true);
    });

    test('盗賊は未発見の透明壁が見えること', () => {
      expect(canSeeSpecialWall(PlayerClass.THIEF, WallType.INVISIBLE, WallState.INTACT)).toBe(true);
    });

    test('両職業で発見済み特殊壁が見えること', () => {
      expect(canSeeSpecialWall(PlayerClass.WARRIOR, WallType.BREAKABLE, WallState.REVEALED)).toBe(true);
      expect(canSeeSpecialWall(PlayerClass.THIEF, WallType.BREAKABLE, WallState.REVEALED)).toBe(true);
    });

    test('通常壁は両職業で常に見えること', () => {
      expect(canSeeSpecialWall(PlayerClass.WARRIOR, WallType.NORMAL, WallState.INTACT)).toBe(true);
      expect(canSeeSpecialWall(PlayerClass.THIEF, WallType.NORMAL, WallState.INTACT)).toBe(true);
    });
  });

  describe('getTrapAlpha', () => {
    test('戦士の未発見罠のアルファ値は0であること', () => {
      expect(getTrapAlpha(PlayerClass.WARRIOR, TrapState.HIDDEN)).toBe(0);
    });

    test('盗賊の未発見罠のアルファ値は0.3であること', () => {
      expect(getTrapAlpha(PlayerClass.THIEF, TrapState.HIDDEN)).toBe(0.3);
    });

    test('発見済み罠のアルファ値は1であること', () => {
      expect(getTrapAlpha(PlayerClass.WARRIOR, TrapState.REVEALED)).toBe(1);
      expect(getTrapAlpha(PlayerClass.THIEF, TrapState.REVEALED)).toBe(1);
    });
  });

  describe('getWallAlpha', () => {
    test('戦士の未発見特殊壁のアルファ値は0であること', () => {
      expect(getWallAlpha(PlayerClass.WARRIOR, WallType.BREAKABLE, WallState.INTACT)).toBe(0);
      expect(getWallAlpha(PlayerClass.WARRIOR, WallType.INVISIBLE, WallState.INTACT)).toBe(0);
    });

    test('盗賊の未発見特殊壁のアルファ値は0.3であること', () => {
      expect(getWallAlpha(PlayerClass.THIEF, WallType.BREAKABLE, WallState.INTACT)).toBe(0.3);
      expect(getWallAlpha(PlayerClass.THIEF, WallType.INVISIBLE, WallState.INTACT)).toBe(0.3);
    });

    test('発見済み特殊壁のアルファ値は1であること', () => {
      expect(getWallAlpha(PlayerClass.WARRIOR, WallType.BREAKABLE, WallState.REVEALED)).toBe(1);
      expect(getWallAlpha(PlayerClass.THIEF, WallType.BREAKABLE, WallState.REVEALED)).toBe(1);
    });

    test('通常壁のアルファ値は常に1であること', () => {
      expect(getWallAlpha(PlayerClass.WARRIOR, WallType.NORMAL, WallState.INTACT)).toBe(1);
      expect(getWallAlpha(PlayerClass.THIEF, WallType.NORMAL, WallState.INTACT)).toBe(1);
    });
  });
});
