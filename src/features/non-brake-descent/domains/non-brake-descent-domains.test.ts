import { MathUtils } from './math-utils';
import { SpeedDomain } from './speed-domain';
import { CollisionDomain } from './collision-domain';
import { ScoringDomain } from './scoring-domain';
import { Config } from '../config';
import { SpeedRank } from '../constants';

describe('Non-Brake Descent domains', () => {
  describe('MathUtils', () => {
    describe('clamp', () => {
      describe('正常系', () => {
        it('値が最大値を超える場合に最大値にクランプされる', () => {
          // Arrange
          const value = 5;
          const min = 0;
          const max = 3;

          // Act
          const result = MathUtils.clamp(value, min, max);

          // Assert
          expect(result).toBe(3);
        });

        it('値が最小値を下回る場合に最小値にクランプされる', () => {
          // Arrange
          const value = -2;
          const min = 0;
          const max = 3;

          // Act
          const result = MathUtils.clamp(value, min, max);

          // Assert
          expect(result).toBe(0);
        });

        it('値が範囲内の場合にそのまま返される', () => {
          // Arrange
          const value = 2;
          const min = 0;
          const max = 3;

          // Act
          const result = MathUtils.clamp(value, min, max);

          // Assert
          expect(result).toBe(2);
        });
      });

      describe('境界値', () => {
        it('値が最小値ちょうどの場合にその値が返される', () => {
          // Arrange
          const value = 0;
          const min = 0;
          const max = 10;

          // Act
          const result = MathUtils.clamp(value, min, max);

          // Assert
          expect(result).toBe(0);
        });

        it('値が最大値ちょうどの場合にその値が返される', () => {
          // Arrange
          const value = 10;
          const min = 0;
          const max = 10;

          // Act
          const result = MathUtils.clamp(value, min, max);

          // Assert
          expect(result).toBe(10);
        });
      });
    });

    describe('lerp', () => {
      describe('正常系', () => {
        it('t=0.5 の場合に中間値が返される', () => {
          // Arrange
          const a = 0;
          const b = 10;
          const t = 0.5;

          // Act
          const result = MathUtils.lerp(a, b, t);

          // Assert
          expect(result).toBe(5);
        });
      });

      describe('境界値', () => {
        it('t=0 の場合に開始値が返される', () => {
          // Arrange
          const a = 0;
          const b = 10;
          const t = 0;

          // Act
          const result = MathUtils.lerp(a, b, t);

          // Assert
          expect(result).toBe(0);
        });

        it('t=1 の場合に終了値が返される', () => {
          // Arrange
          const a = 0;
          const b = 10;
          const t = 1;

          // Act
          const result = MathUtils.lerp(a, b, t);

          // Assert
          expect(result).toBe(10);
        });
      });
    });

    describe('normalize', () => {
      describe('正常系', () => {
        it('範囲の中間値を正規化すると0.5が返される', () => {
          // Arrange
          const value = 5;
          const min = 0;
          const max = 10;

          // Act
          const result = MathUtils.normalize(value, min, max);

          // Assert
          expect(result).toBe(0.5);
        });
      });

      describe('境界値', () => {
        it('min と max が同じ場合に0が返される', () => {
          // Arrange
          const value = 5;
          const min = 5;
          const max = 5;

          // Act
          const result = MathUtils.normalize(value, min, max);

          // Assert
          expect(result).toBe(0);
        });

        it('値が min ちょうどの場合に0が返される', () => {
          // Arrange
          const value = 0;
          const min = 0;
          const max = 10;

          // Act
          const result = MathUtils.normalize(value, min, max);

          // Assert
          expect(result).toBe(0);
        });

        it('値が max ちょうどの場合に1が返される', () => {
          // Arrange
          const value = 10;
          const min = 0;
          const max = 10;

          // Act
          const result = MathUtils.normalize(value, min, max);

          // Assert
          expect(result).toBe(1);
        });
      });
    });
  });

  describe('SpeedDomain', () => {
    describe('getRank', () => {
      describe('正常系', () => {
        it('速度が低い場合に LOW ランクが返される', () => {
          // Arrange
          const speed = 5;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.LOW);
        });

        it('速度が中程度の場合に MID ランクが返される', () => {
          // Arrange
          const speed = 8;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.MID);
        });

        it('速度が高い場合に HIGH ランクが返される', () => {
          // Arrange
          const speed = 12;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.HIGH);
        });
      });

      describe('境界値', () => {
        it('速度が6の場合に MID ランクが返される', () => {
          // Arrange
          const speed = 6;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.MID);
        });

        it('速度が10の場合に HIGH ランクが返される', () => {
          // Arrange
          const speed = 10;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.HIGH);
        });

        it('速度が5.99の場合に LOW ランクが返される', () => {
          // Arrange
          const speed = 5.99;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.LOW);
        });

        it('速度が9.99の場合に MID ランクが返される', () => {
          // Arrange
          const speed = 9.99;

          // Act
          const result = SpeedDomain.getRank(speed);

          // Assert
          expect(result).toBe(SpeedRank.MID);
        });
      });
    });

    describe('getBonus', () => {
      describe('正常系', () => {
        it('MID ランクの速度でスピードボーナスが返される', () => {
          // Arrange
          const speed = 9;

          // Act
          const result = SpeedDomain.getBonus(speed);

          // Assert
          expect(result).toBe(Config.score.speedBonusMid);
        });

        it('HIGH ランクの速度でスピードボーナスが返される', () => {
          // Arrange
          const speed = 12;

          // Act
          const result = SpeedDomain.getBonus(speed);

          // Assert
          expect(result).toBe(Config.score.speedBonusHigh);
        });
      });

      describe('境界値', () => {
        it('LOW ランクの速度でボーナスが0になる', () => {
          // Arrange
          const speed = 5;

          // Act
          const result = SpeedDomain.getBonus(speed);

          // Assert
          expect(result).toBe(0);
        });
      });
    });

    describe('accelerate', () => {
      describe('正常系', () => {
        it('加速時に速度が加速率分増加する', () => {
          // Arrange
          const speed = 5;
          const isAccelerating = true;

          // Act
          const result = SpeedDomain.accelerate(speed, isAccelerating);

          // Assert
          expect(result).toBeCloseTo(speed + Config.speed.accelRate);
        });

        it('減速時に速度が減速率分減少する', () => {
          // Arrange
          const speed = 5;
          const isAccelerating = false;

          // Act
          const result = SpeedDomain.accelerate(speed, isAccelerating);

          // Assert
          expect(result).toBeCloseTo(speed - Config.speed.decelRate);
        });
      });
    });
  });

  describe('CollisionDomain', () => {
    describe('check', () => {
      describe('正常系', () => {
        it('地上で距離が近い場合に地上衝突が検出される', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 60;
          const isJumping = false;
          const jumpY = 0;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.ground).toBe(true);
          expect(result.hit).toBe(true);
          expect(result.air).toBe(false);
        });

        it('地上でニアミス距離の場合にニアミスが検出される', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 80;
          const isJumping = false;
          const jumpY = 0;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.nearMiss).toBe(true);
          expect(result.hit).toBe(false);
        });

        it('十分に離れている場合に衝突もニアミスも検出されない', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 200;
          const isJumping = false;
          const jumpY = 0;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.ground).toBe(false);
          expect(result.air).toBe(false);
          expect(result.hit).toBe(false);
          expect(result.nearMiss).toBe(false);
        });
      });

      describe('境界値', () => {
        it('ジャンプ中かつ距離が近くジャンプ高度が閾値を超える場合に空中衝突が検出される', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 60;
          const isJumping = true;
          // airYThreshold は -18 なので、jumpY > -18（つまり -17 以上）で空中衝突
          const jumpY = Config.collision.airYThreshold + 1;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.air).toBe(true);
          expect(result.hit).toBe(true);
          expect(result.ground).toBe(false);
        });

        it('ジャンプ中かつ距離が近いがジャンプ高度が閾値以下の場合に空中衝突が検出されない', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 60;
          const isJumping = true;
          const jumpY = Config.collision.airYThreshold;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.air).toBe(false);
          expect(result.ground).toBe(false);
          expect(result.hit).toBe(false);
        });

        it('ジャンプ中は地上衝突が発生しない', () => {
          // Arrange
          const playerX = 50;
          const obstacleX = 55;
          const isJumping = true;
          // ジャンプ高度が低い（閾値以下）場合
          const jumpY = Config.collision.airYThreshold;

          // Act
          const result = CollisionDomain.check(playerX, obstacleX, isJumping, jumpY);

          // Assert
          expect(result.ground).toBe(false);
        });
      });
    });
  });

  describe('ScoringDomain', () => {
    describe('calcRampScore', () => {
      describe('正常系', () => {
        it('コンボが2以上の場合にベーススコアとコンボボーナスが計算される', () => {
          // Arrange
          const speed = 10;
          const combo = 3;

          // Act
          const result = ScoringDomain.calcRampScore(speed, combo);

          // Assert
          // speed=10 は HIGH ランク、multiplier=3、base = 100 * 3 = 300
          // bonus = floor(300 * (3-1) * 0.5) = floor(300) = 300
          expect(result.base).toBe(300);
          expect(result.bonus).toBe(300);
        });
      });

      describe('境界値', () => {
        it('コンボが0の場合にボーナスが0になる', () => {
          // Arrange
          const speed = 10;
          const combo = 0;

          // Act
          const result = ScoringDomain.calcRampScore(speed, combo);

          // Assert
          expect(result.base).toBe(300);
          expect(result.bonus).toBe(0);
        });

        it('コンボが1の場合にボーナスが0になる', () => {
          // Arrange
          const speed = 10;
          const combo = 1;

          // Act
          const result = ScoringDomain.calcRampScore(speed, combo);

          // Assert
          expect(result.base).toBe(300);
          expect(result.bonus).toBe(0);
        });

        it('コンボが2の場合にボーナスが発生する', () => {
          // Arrange
          const speed = 10;
          const combo = 2;

          // Act
          const result = ScoringDomain.calcRampScore(speed, combo);

          // Assert
          // bonus = floor(300 * (2-1) * 0.5) = floor(150) = 150
          expect(result.base).toBe(300);
          expect(result.bonus).toBe(150);
        });
      });
    });

    describe('calcFinal', () => {
      describe('正常系', () => {
        it('スコア・スピードボーナス・タイムボーナスの合計が返される', () => {
          // Arrange
          const score = 1000;
          const speedBonus = 200;
          const timeBonus = 50;

          // Act
          const result = ScoringDomain.calcFinal(score, speedBonus, timeBonus);

          // Assert
          expect(result).toBe(1250);
        });
      });
    });
  });
});
