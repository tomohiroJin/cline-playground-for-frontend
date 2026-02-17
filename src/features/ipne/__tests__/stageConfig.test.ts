import { STAGE_CONFIGS, getStageConfig, getNextStage, isFinalStage, TOTAL_STAGES } from '../stageConfig';

describe('stageConfig', () => {
  describe('STAGE_CONFIGS', () => {
    test('5ステージ分のエントリが存在すること', () => {
      expect(Object.keys(STAGE_CONFIGS)).toHaveLength(5);
    });

    test('各ステージに必須フィールドが含まれていること', () => {
      const requiredFields = [
        'stage',
        'name',
        'maze',
        'enemies',
        'scaling',
        'gimmicks',
        'maxLevel',
        'bossType',
      ];

      for (let stage = 1; stage <= 5; stage++) {
        const config = STAGE_CONFIGS[stage as 1 | 2 | 3 | 4 | 5];
        for (const field of requiredFields) {
          expect(config).toHaveProperty(field);
        }
      }
    });

    test('ステージ1: 迷路80x80、敵25体、bossType=boss、maxLevel=3', () => {
      const config = STAGE_CONFIGS[1];
      expect(config.maze.width).toBe(80);
      expect(config.maze.height).toBe(80);
      // 敵の合計数を検証（10+6+5+4+0=25）
      const totalEnemies =
        config.enemies.patrol +
        config.enemies.charge +
        config.enemies.ranged +
        config.enemies.specimen +
        config.enemies.miniBoss;
      expect(totalEnemies).toBe(25);
      expect(config.bossType).toBe('boss');
      expect(config.maxLevel).toBe(3);
    });

    test('ステージ2: 迷路85x85、敵31体、bossType=boss、maxLevel=6', () => {
      const config = STAGE_CONFIGS[2];
      expect(config.maze.width).toBe(85);
      expect(config.maze.height).toBe(85);
      // 敵の合計数を検証（12+8+6+5+0=31）
      const totalEnemies =
        config.enemies.patrol +
        config.enemies.charge +
        config.enemies.ranged +
        config.enemies.specimen +
        config.enemies.miniBoss;
      expect(totalEnemies).toBe(31);
      expect(config.bossType).toBe('boss');
      expect(config.maxLevel).toBe(6);
    });

    test('ステージ3: 迷路90x90、敵40体、bossType=boss、maxLevel=9', () => {
      const config = STAGE_CONFIGS[3];
      expect(config.maze.width).toBe(90);
      expect(config.maze.height).toBe(90);
      // 敵の合計数を検証（14+10+8+6+2=40）
      const totalEnemies =
        config.enemies.patrol +
        config.enemies.charge +
        config.enemies.ranged +
        config.enemies.specimen +
        config.enemies.miniBoss;
      expect(totalEnemies).toBe(40);
      expect(config.bossType).toBe('boss');
      expect(config.maxLevel).toBe(9);
    });

    test('ステージ4: 迷路95x95、敵47体、bossType=boss、maxLevel=12', () => {
      const config = STAGE_CONFIGS[4];
      expect(config.maze.width).toBe(95);
      expect(config.maze.height).toBe(95);
      // 敵の合計数を検証（16+12+10+7+2=47）
      const totalEnemies =
        config.enemies.patrol +
        config.enemies.charge +
        config.enemies.ranged +
        config.enemies.specimen +
        config.enemies.miniBoss;
      expect(totalEnemies).toBe(47);
      expect(config.bossType).toBe('boss');
      expect(config.maxLevel).toBe(12);
    });

    test('ステージ5: 迷路100x100、敵55体、bossType=mega_boss、maxLevel=15', () => {
      const config = STAGE_CONFIGS[5];
      expect(config.maze.width).toBe(100);
      expect(config.maze.height).toBe(100);
      // 敵の合計数を検証（18+14+12+8+3=55）
      const totalEnemies =
        config.enemies.patrol +
        config.enemies.charge +
        config.enemies.ranged +
        config.enemies.specimen +
        config.enemies.miniBoss;
      expect(totalEnemies).toBe(55);
      expect(config.bossType).toBe('mega_boss');
      expect(config.maxLevel).toBe(15);
    });
  });

  describe('getStageConfig', () => {
    test('ステージ1の設定を正しく取得できること', () => {
      const config = getStageConfig(1);
      expect(config).toBe(STAGE_CONFIGS[1]);
    });
  });

  describe('getNextStage', () => {
    test('ステージ1の次はステージ2であること', () => {
      expect(getNextStage(1)).toBe(2);
    });

    test('ステージ4の次はステージ5であること', () => {
      expect(getNextStage(4)).toBe(5);
    });

    test('ステージ5の次はundefinedであること（最終ステージ）', () => {
      expect(getNextStage(5)).toBeUndefined();
    });
  });

  describe('isFinalStage', () => {
    test('ステージ5は最終ステージであること', () => {
      expect(isFinalStage(5)).toBe(true);
    });

    test('ステージ1は最終ステージではないこと', () => {
      expect(isFinalStage(1)).toBe(false);
    });
  });

  describe('TOTAL_STAGES', () => {
    test('総ステージ数が5であること', () => {
      expect(TOTAL_STAGES).toBe(5);
    });
  });
});
