import { placeObstacles, type PlaceObstaclesParams } from './obstacle';

// 決定論的なモック RNG
function createMockRng(randomValues: number[], chanceResult: boolean = false) {
  let idx = 0;
  return {
    random: () => {
      const v = randomValues[idx % randomValues.length];
      idx++;
      return v;
    },
    chance: () => chanceResult,
  };
}

describe('placeObstacles', () => {
  describe('単一障害物の配置', () => {
    it('si=1 のとき障害物は1つのみ', () => {
      const rng = createMockRng([0.5]);
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 8, spd: 2600, si: 1, fk: false },
        stage: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(2);
    });

    it('低い乱数値でレーン0（L）が選択される', () => {
      // 0.28未満の値 → L(0)が選ばれる
      const rng = createMockRng([0.1]);
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 8, spd: 2600, si: 1, fk: false },
        stage: 0,
      });

      expect(result[0]).toBe(0);
    });

    it('中間の乱数値でレーン1（C）が選択される', () => {
      // 0.28〜0.64の範囲 → C(1)が選ばれる
      const rng = createMockRng([0.4]);
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 8, spd: 2600, si: 1, fk: false },
        stage: 0,
      });

      expect(result[0]).toBe(1);
    });

    it('高い乱数値でレーン2（R）が選択される', () => {
      // 0.64以上 → R(2)が選ばれる
      const rng = createMockRng([0.8]);
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 8, spd: 2600, si: 1, fk: false },
        stage: 0,
      });

      expect(result[0]).toBe(2);
    });
  });

  describe('ダブル障害物', () => {
    it('si >= 2 かつ chance 成功で2つの障害物が配置される', () => {
      const rng = createMockRng([0.1, 0.8], true); // chance = true
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 12, spd: 1850, si: 2, fk: false },
        stage: 2,
      });

      expect(result).toHaveLength(2);
      // 2つの障害物は異なるレーン
      expect(result[0]).not.toBe(result[1]);
    });

    it('si >= 2 でも chance 失敗なら1つのみ', () => {
      const rng = createMockRng([0.5], false); // chance = false
      const result = placeObstacles({
        rng,
        stageConfig: { cy: 12, spd: 1850, si: 2, fk: false },
        stage: 2,
      });

      expect(result).toHaveLength(1);
    });

    it('_dblChance が確率に加算される', () => {
      // chance が呼ばれる際の確率を検証
      let calledWith = 0;
      const rng = {
        random: () => 0.5,
        chance: (p: number) => {
          calledWith = p;
          return false;
        },
      };

      placeObstacles({
        rng,
        stageConfig: { cy: 12, spd: 1850, si: 2, fk: false, _dblChance: 0.5 },
        stage: 2,
      });

      // 0.2 + 2*0.06 + 0.5 = 0.82
      expect(calledWith).toBeCloseTo(0.82);
    });
  });

  describe('障害物の範囲', () => {
    it('すべての障害物が0-2の範囲内', () => {
      const rng = createMockRng([0.1, 0.5, 0.9], true);

      for (let stage = 0; stage <= 5; stage++) {
        const result = placeObstacles({
          rng,
          stageConfig: { cy: 10, spd: 2000, si: 2, fk: false },
          stage,
        });

        result.forEach(lane => {
          expect(lane).toBeGreaterThanOrEqual(0);
          expect(lane).toBeLessThanOrEqual(2);
        });
      }
    });
  });
});
