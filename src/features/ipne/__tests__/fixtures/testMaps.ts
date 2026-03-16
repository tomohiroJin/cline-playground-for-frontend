/**
 * テスト用マップフィクスチャ
 * 各テストで共通に使うマップパターンを定義
 */
import { aMap } from '../builders';

/**
 * 7x7の標準テストマップ（スタート・ゴール付き）
 * testUtils.ts の createTestMap と同等
 */
export const createStandardTestMap = (width = 7, height = 7) =>
  aMap(width, height).withStart(1, 1).withGoal(width - 2, height - 2).build();

/**
 * 小さい5x5のテストマップ
 */
export const createSmallTestMap = () =>
  aMap(5, 5).withStart(1, 1).withGoal(3, 3).build();

/**
 * 戦闘テスト用の広いマップ（障害物なし）
 */
export const createOpenBattleMap = (size = 10) => aMap(size, size).build();

/**
 * 通路テスト用マップ（中央に通路あり）
 */
export const createCorridorMap = () =>
  aMap(7, 7)
    .withWall(1, 3)
    .withWall(2, 3)
    .withWall(4, 3)
    .withWall(5, 3)
    .build();
