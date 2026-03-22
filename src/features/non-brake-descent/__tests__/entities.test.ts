import { EntityFactory } from '../entities';
import { Config } from '../config';
import { ObstacleType, RampType } from '../constants';

describe('EntityFactory', () => {
  // Math.random をモックして決定的なテストにする
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('createPlayer', () => {
    it('デフォルト値でプレイヤーを生成する', () => {
      // Arrange & Act
      const player = EntityFactory.createPlayer();

      // Assert
      expect(player).toEqual({
        x: 60,
        y: 0,
        ramp: 0,
        vx: 0,
        vy: 0,
        jumping: false,
        jumpCD: 0,
        onGround: true,
      });
    });
  });

  describe('createParticle', () => {
    it('指定した位置と色でパーティクルを生成する', () => {
      // Arrange
      const x = 100;
      const y = 200;
      const color = '#ff0000';

      // Act
      const particle = EntityFactory.createParticle(x, y, color);

      // Assert
      expect(particle.x).toBe(x);
      expect(particle.y).toBe(y);
      expect(particle.color).toBe(color);
      expect(particle.life).toBe(Config.particle.lifetime);
      expect(typeof particle.vx).toBe('number');
      expect(typeof particle.vy).toBe('number');
    });

    it('カスタムライフタイムを指定できる', () => {
      // Arrange & Act
      const particle = EntityFactory.createParticle(0, 0, '#fff', 50);

      // Assert
      expect(particle.life).toBe(50);
    });
  });

  describe('createParticles', () => {
    it('デフォルトの個数でパーティクル配列を生成する', () => {
      // Arrange & Act
      const particles = EntityFactory.createParticles(10, 20, '#fff');

      // Assert
      expect(particles).toHaveLength(Config.particle.defaultCount);
      particles.forEach((p) => {
        expect(p.x).toBe(10);
        expect(p.y).toBe(20);
        expect(p.color).toBe('#fff');
      });
    });

    it('指定した個数でパーティクル配列を生成する', () => {
      // Arrange & Act
      const particles = EntityFactory.createParticles(0, 0, '#000', 3);

      // Assert
      expect(particles).toHaveLength(3);
    });
  });

  describe('createJetParticle', () => {
    it('ジェットパーティクルを生成する', () => {
      // Arrange
      const x = 100;
      const y = 200;
      const dir = 1;

      // Act
      const particle = EntityFactory.createJetParticle(x, y, dir);

      // Assert
      expect(particle.y).toBe(y + 5);
      expect(typeof particle.x).toBe('number');
      expect(typeof particle.vx).toBe('number');
      expect(typeof particle.vy).toBe('number');
      expect(typeof particle.life).toBe('number');
      // 色は '#ff6600' または '#ffaa00' のいずれか
      expect(['#ff6600', '#ffaa00']).toContain(particle.color);
    });
  });

  describe('createScorePopup', () => {
    it('スコアポップアップを生成する', () => {
      // Arrange & Act
      const popup = EntityFactory.createScorePopup(50, 100, '+500');

      // Assert
      expect(popup).toEqual({
        x: 50,
        y: 100,
        text: '+500',
        color: '#fff',
        life: 60,
        vy: -2,
      });
    });

    it('カスタムカラーを指定できる', () => {
      // Arrange & Act
      const popup = EntityFactory.createScorePopup(0, 0, '+100', '#ff0000');

      // Assert
      expect(popup.color).toBe('#ff0000');
    });
  });

  describe('createNearMissEffect', () => {
    it('ニアミスエフェクトを生成する', () => {
      // Arrange & Act
      const effect = EntityFactory.createNearMissEffect(30, 40);

      // Assert
      expect(effect).toEqual({ x: 30, y: 40, life: 30, scale: 1 });
    });
  });

  describe('createObstacle', () => {
    it('指定した種類と位置で障害物を生成する', () => {
      // Arrange & Act
      const obstacle = EntityFactory.createObstacle(ObstacleType.ROCK, 0.5);

      // Assert
      expect(obstacle).toEqual({
        t: ObstacleType.ROCK,
        pos: 0.5,
        passed: false,
      });
    });

    it('追加プロパティを付与できる', () => {
      // Arrange & Act
      const obstacle = EntityFactory.createObstacle(ObstacleType.ENEMY, 0.3, {
        phase: 1.0,
        moveDir: -1,
      });

      // Assert
      expect(obstacle.t).toBe(ObstacleType.ENEMY);
      expect(obstacle.phase).toBe(1.0);
      expect(obstacle.moveDir).toBe(-1);
    });
  });

  describe('createRamp', () => {
    it('ランプを正しく生成する', () => {
      // Arrange
      const obs = [
        EntityFactory.createObstacle(ObstacleType.ROCK, 0.5),
      ];

      // Act
      const ramp = EntityFactory.createRamp(1, obs, RampType.NORMAL, false);

      // Assert
      expect(ramp).toEqual({
        dir: 1,
        obs,
        type: RampType.NORMAL,
        isGoal: false,
      });
    });

    it('ゴールランプを生成できる', () => {
      // Arrange & Act
      const ramp = EntityFactory.createRamp(-1, [], RampType.STEEP, true);

      // Assert
      expect(ramp.isGoal).toBe(true);
      expect(ramp.dir).toBe(-1);
      expect(ramp.type).toBe(RampType.STEEP);
    });
  });

  describe('createCloud', () => {
    it('雲を生成する', () => {
      // Arrange & Act
      const cloud = EntityFactory.createCloud();

      // Assert
      expect(typeof cloud.x).toBe('number');
      expect(typeof cloud.y).toBe('number');
      expect(typeof cloud.size).toBe('number');
      expect(typeof cloud.speed).toBe('number');
      expect(typeof cloud.opacity).toBe('number');
    });

    it('x が画面幅以上の位置に生成される', () => {
      // Arrange & Act
      const cloud = EntityFactory.createCloud();

      // Assert
      expect(cloud.x).toBeGreaterThanOrEqual(Config.screen.width);
    });
  });

  describe('createBuilding', () => {
    it('建物を生成する', () => {
      // Arrange & Act
      const building = EntityFactory.createBuilding(50);

      // Assert
      expect(building.x).toBe(50);
      expect(typeof building.width).toBe('number');
      expect(typeof building.height).toBe('number');
      expect(typeof building.windows).toBe('number');
      expect(typeof building.color).toBe('string');
      expect(Array.isArray(building.windowLit)).toBe(true);
    });

    it('windowLit が windows x cols の二次元配列になる', () => {
      // Arrange & Act
      const building = EntityFactory.createBuilding(0);

      // Assert
      expect(building.windowLit.length).toBe(building.windows);
      const cols = Math.floor(building.width / 12);
      building.windowLit.forEach((row) => {
        expect(row.length).toBe(cols);
        row.forEach((lit) => {
          expect(typeof lit).toBe('boolean');
        });
      });
    });
  });
});
