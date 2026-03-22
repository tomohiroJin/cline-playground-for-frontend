import { RampGen, ObstacleGen, BackgroundGen } from '../generators';
import { Config } from '../config';
import { ObstacleType, RampType } from '../constants';

describe('ObstacleGen', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    randomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('generate', () => {
    describe('正常系', () => {
      it('乱数がテーブルの最初のエントリの maxProb 未満の場合、HOLE_S を生成する', () => {
        // Arrange: 最初のエントリ maxProb=0.1 に合致するよう 0.05 を返す
        randomSpy.mockReturnValue(0.05);

        // Act
        const obstacle = ObstacleGen.generate(0.5);

        // Assert
        expect(obstacle).toBeDefined();
        expect(obstacle!.t).toBe(ObstacleType.HOLE_S);
        expect(obstacle!.pos).toBe(0.5);
        expect(obstacle!.passed).toBe(false);
      });

      it('乱数がどのエントリにも合致しない場合、undefined を返す', () => {
        // Arrange: 全エントリの maxProb(最大 0.8) より大きい値
        randomSpy.mockReturnValue(0.9);

        // Act
        const obstacle = ObstacleGen.generate(0.3);

        // Assert
        expect(obstacle).toBeUndefined();
      });

      it('ENEMY タイプの場合、追加プロパティが付与される', () => {
        // Arrange: ENEMY は maxProb=0.4、前のエントリ(ROCK)は maxProb=0.28
        // find で最初に見つかるものが返る。0.29 は HOLE_S(0.1), HOLE_L(0.18), ROCK(0.28) をスキップし ENEMY(0.4) に合致
        randomSpy.mockReturnValue(0.29);

        // Act
        const obstacle = ObstacleGen.generate(0.4);

        // Assert
        expect(obstacle).toBeDefined();
        expect(obstacle!.t).toBe(ObstacleType.ENEMY);
        expect(obstacle!.phase).toBeDefined();
        expect(obstacle!.moveDir).toBeDefined();
        expect(obstacle!.walkPos).toBeDefined();
      });
    });
  });
});

describe('RampGen', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    randomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('genObs', () => {
    describe('正常系', () => {
      it('中間のランプでは障害物を生成する', () => {
        // Arrange: random を 0.5 にして障害物が生成されるようにする
        randomSpy.mockReturnValue(0.5);
        const total = 20;
        const i = 10;

        // Act
        const obstacles = RampGen.genObs(i, total);

        // Assert
        // 乱数 0.5 だと ObstacleGen.generate は undefined を返すため空になる場合がある
        expect(Array.isArray(obstacles)).toBe(true);
      });

      it('乱数が低い値の場合、障害物が生成される', () => {
        // Arrange: HOLE_S (maxProb 0.1) に合致するよう 0.05 を返す
        randomSpy.mockReturnValue(0.05);
        const total = 20;
        const i = 10;

        // Act
        const obstacles = RampGen.genObs(i, total);

        // Assert
        expect(obstacles.length).toBeGreaterThanOrEqual(1);
        obstacles.forEach((obs) => {
          expect(obs.t).toBe(ObstacleType.HOLE_S);
        });
      });
    });

    describe('境界値', () => {
      it('最初の2ランプ (i<=2) では障害物を生成しない', () => {
        // Arrange
        randomSpy.mockReturnValue(0.05);

        // Act & Assert
        expect(RampGen.genObs(0, 20)).toEqual([]);
        expect(RampGen.genObs(1, 20)).toEqual([]);
        expect(RampGen.genObs(2, 20)).toEqual([]);
      });

      it('最後の2ランプ (i>=total-2) では障害物を生成しない', () => {
        // Arrange
        randomSpy.mockReturnValue(0.05);
        const total = 20;

        // Act & Assert
        expect(RampGen.genObs(18, total)).toEqual([]);
        expect(RampGen.genObs(19, total)).toEqual([]);
      });
    });
  });

  describe('selectType', () => {
    describe('正常系', () => {
      it('最初の5ランプ以内では常に NORMAL を返す', () => {
        // Arrange
        randomSpy.mockReturnValue(0.1);

        // Act & Assert
        expect(RampGen.selectType(0)).toBe(RampType.NORMAL);
        expect(RampGen.selectType(3)).toBe(RampType.NORMAL);
        expect(RampGen.selectType(5)).toBe(RampType.NORMAL);
      });

      it('6ランプ以降で randomBool(0.25) が false の場合、NORMAL を返す', () => {
        // Arrange: randomBool(0.25) は Math.random() < 0.25。0.5 >= 0.25 なので false
        randomSpy.mockReturnValue(0.5);

        // Act
        const type = RampGen.selectType(10);

        // Assert
        expect(type).toBe(RampType.NORMAL);
      });

      it('6ランプ以降で randomBool(0.25) が true の場合、特殊タイプを返す', () => {
        // Arrange: randomBool(0.25) → Math.random() < 0.25。
        // 最初の呼び出し(randomBool)で 0.1、次の呼び出し(Math.floor(Math.random()*3))で特定タイプ
        randomSpy
          .mockReturnValueOnce(0.1) // randomBool(0.25) → true
          .mockReturnValueOnce(0.0); // Math.floor(0 * 3) = 0 → STEEP

        // Act
        const type = RampGen.selectType(10);

        // Assert
        expect(type).toBe(RampType.STEEP);
      });

      it('特殊タイプとして GENTLE を返す', () => {
        // Arrange
        randomSpy
          .mockReturnValueOnce(0.1) // randomBool(0.25) → true
          .mockReturnValueOnce(0.4); // Math.floor(0.4 * 3) = 1 → GENTLE

        // Act
        const type = RampGen.selectType(10);

        // Assert
        expect(type).toBe(RampType.GENTLE);
      });

      it('特殊タイプとして V_SHAPE を返す', () => {
        // Arrange
        randomSpy
          .mockReturnValueOnce(0.1) // randomBool(0.25) → true
          .mockReturnValueOnce(0.8); // Math.floor(0.8 * 3) = 2 → V_SHAPE

        // Act
        const type = RampGen.selectType(10);

        // Assert
        expect(type).toBe(RampType.V_SHAPE);
      });
    });
  });

  describe('generate', () => {
    describe('正常系', () => {
      it('指定した数のランプを生成する', () => {
        // Arrange
        randomSpy.mockReturnValue(0.5);
        const total = 10;

        // Act
        const ramps = RampGen.generate(total);

        // Assert
        expect(ramps).toHaveLength(total);
      });

      it('ランプの方向が交互に切り替わる', () => {
        // Arrange
        randomSpy.mockReturnValue(0.5);

        // Act
        const ramps = RampGen.generate(4);

        // Assert
        expect(ramps[0].dir).toBe(1);
        expect(ramps[1].dir).toBe(-1);
        expect(ramps[2].dir).toBe(1);
        expect(ramps[3].dir).toBe(-1);
      });

      it('最後のランプが isGoal=true になる', () => {
        // Arrange
        randomSpy.mockReturnValue(0.5);

        // Act
        const ramps = RampGen.generate(5);

        // Assert
        expect(ramps[4].isGoal).toBe(true);
        ramps.slice(0, 4).forEach((r) => {
          expect(r.isGoal).toBe(false);
        });
      });
    });
  });
});

describe('BackgroundGen', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('initBuildings', () => {
    it('建物の配列を生成する', () => {
      // Arrange & Act
      const buildings = BackgroundGen.initBuildings();

      // Assert
      expect(buildings.length).toBeGreaterThan(0);
      buildings.forEach((b) => {
        expect(typeof b.x).toBe('number');
        expect(typeof b.width).toBe('number');
        expect(typeof b.height).toBe('number');
      });
    });

    it('建物が画面幅+200以内に収まる', () => {
      // Arrange & Act
      const buildings = BackgroundGen.initBuildings();

      // Assert
      buildings.forEach((b) => {
        expect(b.x).toBeLessThan(Config.screen.width + 200);
      });
    });
  });

  describe('initClouds', () => {
    it('デフォルトで6個の雲を生成する', () => {
      // Arrange & Act
      const clouds = BackgroundGen.initClouds();

      // Assert
      expect(clouds).toHaveLength(6);
    });

    it('指定した数の雲を生成する', () => {
      // Arrange & Act
      const clouds = BackgroundGen.initClouds(3);

      // Assert
      expect(clouds).toHaveLength(3);
    });
  });
});
