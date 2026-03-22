/**
 * ドメインサービスのテスト
 *
 * カバレッジが不足している GeometryDomain, DangerDomain, ScoringDomain,
 * ComboDomain, SpeedDomain のテストを追加する。
 */
import { Config } from '../../../config';
import { ObstacleType, RampType } from '../../../constants';
import { GeometryDomain, getRampHeight } from '../../../domain/services/geometry-service';
import { DangerDomain } from '../../../domain/services/danger-service';
import { ScoringDomain } from '../../../domain/services/scoring-service';
import { ComboDomain } from '../../../domain/services/combo-service';
import { SpeedDomain } from '../../../domain/services/speed-service';
import type { Ramp, Obstacle } from '../../../types';

describe('GeometryDomain', () => {
  const width = Config.screen.width;
  const height = Config.ramp.height;

  describe('getRampGeometry', () => {
    it('NORMAL タイプ dir=1 のジオメトリを正しく計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.NORMAL, isGoal: false };

      // Act
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);

      // Assert
      expect(geo.lx).toBe(20);
      expect(geo.rx).toBe(width - 30);
      expect(geo.ty).toBe(height * 0.1);
      expect(geo.by).toBe(height * 0.55);
    });

    it('NORMAL タイプ dir=-1 のジオメトリを正しく計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: -1, obs: [], type: RampType.NORMAL, isGoal: false };

      // Act
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);

      // Assert
      expect(geo.lx).toBe(30);
      expect(geo.rx).toBe(width - 20);
      expect(geo.ty).toBe(height * 0.55);
      expect(geo.by).toBe(height * 0.1);
    });

    it('STEEP タイプのジオメトリを正しく計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.STEEP, isGoal: false };

      // Act
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);

      // Assert
      expect(geo.ty).toBe(0);
      expect(geo.by).toBe(height * 0.75);
    });

    it('GENTLE タイプのジオメトリを正しく計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.GENTLE, isGoal: false };

      // Act
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);

      // Assert
      expect(geo.ty).toBe(height * 0.25);
      expect(geo.by).toBe(height * 0.45);
    });

    it('V_SHAPE タイプのジオメトリを正しく計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.V_SHAPE, isGoal: false };

      // Act
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);

      // Assert
      expect(geo.ty).toBe(height * 0.15);
      expect(geo.by).toBe(height * 0.15);
      expect(geo.midY).toBe(height * 0.55);
    });
  });

  describe('getSlopeY', () => {
    it('NORMAL タイプで中間位置の Y 座標を計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.NORMAL, isGoal: false };
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);
      const midX = (geo.lx + geo.rx) / 2;

      // Act
      const y = GeometryDomain.getSlopeY(midX, geo, ramp.type);

      // Assert: 線形補間の中間値
      const expected = (geo.ty + geo.by) / 2;
      expect(y).toBeCloseTo(expected);
    });

    it('V_SHAPE タイプで前半の Y 座標を計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.V_SHAPE, isGoal: false };
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);
      // t = 0.25（前半の中間）
      const x = geo.lx + (geo.rx - geo.lx) * 0.25;

      // Act
      const y = GeometryDomain.getSlopeY(x, geo, ramp.type);

      // Assert: ty と midY の中間値
      expect(y).toBeCloseTo((geo.ty + geo.midY!) / 2);
    });

    it('V_SHAPE タイプで後半の Y 座標を計算する', () => {
      // Arrange
      const ramp: Ramp = { dir: 1, obs: [], type: RampType.V_SHAPE, isGoal: false };
      const geo = GeometryDomain.getRampGeometry(ramp, width, height);
      // t = 0.75（後半の中間）
      const x = geo.lx + (geo.rx - geo.lx) * 0.75;

      // Act
      const y = GeometryDomain.getSlopeY(x, geo, ramp.type);

      // Assert: midY と by の中間値
      expect(y).toBeCloseTo((geo.midY! + geo.by) / 2);
    });
  });

  describe('getObstacleX', () => {
    it('dir=1 で障害物の X 座標を計算する', () => {
      // Arrange
      const obs = { pos: 0.5 };
      const ramp = { dir: 1 as const };

      // Act
      const x = GeometryDomain.getObstacleX(obs, ramp, width);

      // Assert
      expect(x).toBe(40 + 0.5 * (width - 80));
    });

    it('dir=-1 で障害物の X 座標を反転計算する', () => {
      // Arrange
      const obs = { pos: 0.5 };
      const ramp = { dir: -1 as const };

      // Act
      const x = GeometryDomain.getObstacleX(obs, ramp, width);

      // Assert
      expect(x).toBe(width - 40 - 0.5 * (width - 80));
    });
  });

  describe('getRampColor', () => {
    it('インデックス 0 で最初の色を返す', () => {
      // Act
      const color = GeometryDomain.getRampColor(0);

      // Assert
      expect(color.bg).toBe('#1a2244');
    });

    it('インデックスがラップアラウンドする', () => {
      // Act: 色の配列が 6 色、15ランプごとにインデックス変化
      const color0 = GeometryDomain.getRampColor(0);
      const color90 = GeometryDomain.getRampColor(90);

      // Assert: Math.floor(90/15) % 6 = 0 → 同じ色
      expect(color90.bg).toBe(color0.bg);
    });
  });

  describe('isInViewport', () => {
    it('画面内のランプを表示対象と判定する', () => {
      // Act & Assert
      expect(GeometryDomain.isInViewport(0, height, Config.screen.height)).toBe(true);
    });

    it('画面外上方のランプを非表示と判定する', () => {
      // Act & Assert
      expect(GeometryDomain.isInViewport(-height - 21, height, Config.screen.height)).toBe(false);
    });

    it('画面外下方のランプを非表示と判定する', () => {
      // Act & Assert
      expect(GeometryDomain.isInViewport(Config.screen.height + 21, height, Config.screen.height)).toBe(false);
    });
  });
});

describe('getRampHeight', () => {
  it('Config のランプ高さを返す', () => {
    // Act & Assert
    expect(getRampHeight()).toBe(Config.ramp.height);
  });
});

describe('DangerDomain', () => {
  describe('calcLevel', () => {
    it('前方に障害物がある場合に危険度を返す', () => {
      // Arrange: dir=1 で前方（右側）に近い岩を配置
      const obs: Obstacle[] = [
        { t: ObstacleType.ROCK, pos: 0.5, passed: false },
      ];
      const width = Config.screen.width;
      const px = 40 + 0.5 * (width - 80) - 50; // 障害物の50px手前
      const speed = Config.speed.max;

      // Act
      const level = DangerDomain.calcLevel(obs, px, 1, speed, width);

      // Assert
      expect(level).toBeGreaterThan(0);
      expect(level).toBeLessThanOrEqual(1);
    });

    it('障害物がスコアアイテムの場合は危険度 0 を返す', () => {
      // Arrange
      const obs: Obstacle[] = [
        { t: ObstacleType.SCORE, pos: 0.5, passed: false },
      ];
      const width = Config.screen.width;
      const px = 40 + 0.5 * (width - 80) - 50;

      // Act
      const level = DangerDomain.calcLevel(obs, px, 1, 10, width);

      // Assert
      expect(level).toBe(0);
    });

    it('障害物が後方にある場合は危険度 0 を返す', () => {
      // Arrange: dir=1 で後方（左側）に障害物
      const obs: Obstacle[] = [
        { t: ObstacleType.ROCK, pos: 0.1, passed: false },
      ];
      const width = Config.screen.width;
      const px = width - 40; // 画面右端

      // Act
      const level = DangerDomain.calcLevel(obs, px, 1, 10, width);

      // Assert
      expect(level).toBe(0);
    });

    it('障害物が TAKEN の場合は危険度 0 を返す', () => {
      // Arrange
      const obs: Obstacle[] = [
        { t: ObstacleType.TAKEN, pos: 0.5, passed: false },
      ];
      const width = Config.screen.width;
      const px = 40 + 0.5 * (width - 80) - 50;

      // Act
      const level = DangerDomain.calcLevel(obs, px, 1, 10, width);

      // Assert
      expect(level).toBe(0);
    });

    it('障害物がない場合は危険度 0 を返す', () => {
      // Act
      const level = DangerDomain.calcLevel([], 100, 1, 10, Config.screen.width);

      // Assert
      expect(level).toBe(0);
    });
  });
});

describe('ScoringDomain', () => {
  describe('getRankData', () => {
    it('高スコアで S ランクを返す', () => {
      // Act
      const rank = ScoringDomain.getRankData(50000);

      // Assert
      expect(rank.rank).toBe('S');
    });

    it('低スコアで D ランクを返す', () => {
      // Act
      const rank = ScoringDomain.getRankData(0);

      // Assert
      expect(rank.rank).toBe('D');
    });

    it('中間スコアで B ランクを返す', () => {
      // Act
      const rank = ScoringDomain.getRankData(15000);

      // Assert
      expect(rank.rank).toBe('B');
    });
  });

  describe('calcTimeBonus', () => {
    it('経過時間が短い場合に高いタイムボーナスを返す', () => {
      // Act
      const bonus = ScoringDomain.calcTimeBonus(100);

      // Assert: (300 - 100) * 10 = 2000
      expect(bonus).toBe(2000);
    });

    it('経過時間が最大値を超える場合は 0 を返す', () => {
      // Act
      const bonus = ScoringDomain.calcTimeBonus(400);

      // Assert
      expect(bonus).toBe(0);
    });

    it('カスタム最大値を指定できる', () => {
      // Act
      const bonus = ScoringDomain.calcTimeBonus(50, 100);

      // Assert: (100 - 50) * 10 = 500
      expect(bonus).toBe(500);
    });
  });
});

describe('ComboDomain', () => {
  describe('shouldActivate', () => {
    it('速度が閾値以上の場合に true を返す', () => {
      // Act & Assert
      expect(ComboDomain.shouldActivate(8)).toBe(true);
    });

    it('速度が閾値未満の場合に false を返す', () => {
      // Act & Assert
      expect(ComboDomain.shouldActivate(7)).toBe(false);
    });

    it('カスタム閾値を指定できる', () => {
      // Act & Assert
      expect(ComboDomain.shouldActivate(5, 5)).toBe(true);
      expect(ComboDomain.shouldActivate(4, 5)).toBe(false);
    });
  });

  describe('increment', () => {
    it('タイマーが残っている場合にコンボを加算する', () => {
      // Act
      const result = ComboDomain.increment(2, 50);

      // Assert
      expect(result.combo).toBe(3);
      expect(result.timer).toBe(Config.combo.timeout);
    });

    it('タイマーが 0 の場合にコンボを 1 にリセットする', () => {
      // Act
      const result = ComboDomain.increment(5, 0);

      // Assert
      expect(result.combo).toBe(1);
    });

    it('最大コンボ数を超えない', () => {
      // Act
      const result = ComboDomain.increment(Config.combo.maxMultiplier, 50);

      // Assert
      expect(result.combo).toBe(Config.combo.maxMultiplier);
    });
  });

  describe('reset', () => {
    it('コンボとタイマーを 0 にリセットする', () => {
      // Act
      const result = ComboDomain.reset();

      // Assert
      expect(result.combo).toBe(0);
      expect(result.timer).toBe(0);
    });
  });

  describe('tick', () => {
    it('タイマーを 1 減少させる', () => {
      // Act & Assert
      expect(ComboDomain.tick(10)).toBe(9);
    });

    it('タイマーが 0 以下にならない', () => {
      // Act & Assert
      expect(ComboDomain.tick(0)).toBe(0);
    });
  });
});

describe('SpeedDomain', () => {
  describe('getColor', () => {
    it('LOW ランクで緑色を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getColor(5)).toBe('#00ff88');
    });

    it('MID ランクで黄色を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getColor(8)).toBe('#ffcc00');
    });

    it('HIGH ランクで赤色を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getColor(12)).toBe('#ff3344');
    });
  });

  describe('getMultiplier', () => {
    it('LOW ランクで倍率 1 を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getMultiplier(5)).toBe(1);
    });

    it('MID ランクで倍率 2 を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getMultiplier(8)).toBe(2);
    });

    it('HIGH ランクで倍率 3 を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getMultiplier(12)).toBe(3);
    });
  });

  describe('getNormalized', () => {
    it('最小速度で 0 を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getNormalized(Config.speed.min)).toBe(0);
    });

    it('最大速度で 1 を返す', () => {
      // Act & Assert
      expect(SpeedDomain.getNormalized(Config.speed.max)).toBe(1);
    });
  });
});
