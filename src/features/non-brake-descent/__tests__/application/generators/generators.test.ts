/**
 * application/generators のテスト
 *
 * 既存の generators.test.ts と同等のテストを application 層のモジュールに対して実施する。
 */
import { Config } from '../../../config';
import { ObstacleType, RampType } from '../../../constants';
import { RampGen } from '../../../application/generators/ramp-generator';
import { ObstacleGen } from '../../../application/generators/obstacle-generator';
import { BackgroundGen } from '../../../application/generators/background-generator';

describe('ObstacleGen', () => {
  it('確率テーブルが定義されている', () => {
    // Assert
    expect(ObstacleGen.table.length).toBeGreaterThan(0);
  });

  it('generate が Obstacle または undefined を返す', () => {
    // Act
    const result = ObstacleGen.generate(0.5);

    // Assert
    if (result !== undefined) {
      expect(result).toHaveProperty('t');
      expect(result).toHaveProperty('pos', 0.5);
      expect(result).toHaveProperty('passed', false);
    }
  });
});

describe('RampGen', () => {
  it('指定数のランプを生成する', () => {
    // Act
    const ramps = RampGen.generate(10);

    // Assert
    expect(ramps).toHaveLength(10);
  });

  it('最初と最後のランプには障害物がない', () => {
    // Act
    const ramps = RampGen.generate(20);

    // Assert
    expect(ramps[0].obs).toHaveLength(0);
    expect(ramps[1].obs).toHaveLength(0);
    expect(ramps[2].obs).toHaveLength(0);
    expect(ramps[18].obs).toHaveLength(0);
    expect(ramps[19].obs).toHaveLength(0);
  });

  it('ランプの方向が交互になる', () => {
    // Act
    const ramps = RampGen.generate(6);

    // Assert
    expect(ramps[0].dir).toBe(1);
    expect(ramps[1].dir).toBe(-1);
    expect(ramps[2].dir).toBe(1);
    expect(ramps[3].dir).toBe(-1);
  });

  it('最後のランプが isGoal=true になる', () => {
    // Act
    const ramps = RampGen.generate(10);

    // Assert
    expect(ramps[9].isGoal).toBe(true);
    expect(ramps[0].isGoal).toBe(false);
  });

  it('selectType が有効なランプタイプを返す', () => {
    // Act & Assert
    const validTypes = [RampType.NORMAL, RampType.STEEP, RampType.GENTLE, RampType.V_SHAPE];
    for (let i = 0; i < 20; i++) {
      const type = RampGen.selectType(i);
      expect(validTypes).toContain(type);
    }
  });

  it('序盤のランプは必ず NORMAL タイプになる', () => {
    // Act & Assert
    for (let i = 0; i <= 5; i++) {
      expect(RampGen.selectType(i)).toBe(RampType.NORMAL);
    }
  });
});

describe('BackgroundGen', () => {
  it('initBuildings がビル配列を生成する', () => {
    // Act
    const buildings = BackgroundGen.initBuildings();

    // Assert
    expect(buildings.length).toBeGreaterThan(0);
    for (const building of buildings) {
      expect(building).toHaveProperty('x');
      expect(building).toHaveProperty('width');
      expect(building).toHaveProperty('height');
    }
  });

  it('initClouds が指定数の雲を生成する', () => {
    // Act
    const clouds = BackgroundGen.initClouds(4);

    // Assert
    expect(clouds).toHaveLength(4);
    for (const cloud of clouds) {
      expect(cloud).toHaveProperty('x');
      expect(cloud).toHaveProperty('y');
      expect(cloud).toHaveProperty('size');
      expect(cloud).toHaveProperty('speed');
    }
  });

  it('initClouds のデフォルト数は6', () => {
    // Act
    const clouds = BackgroundGen.initClouds();

    // Assert
    expect(clouds).toHaveLength(6);
  });
});
