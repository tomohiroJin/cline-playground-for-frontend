import { judgeCycle, type JudgeCycleParams } from './judgment';

// テスト用のデフォルトパラメータ
function defaultParams(overrides: Partial<JudgeCycleParams> = {}): JudgeCycleParams {
  return {
    playerLane: 1,
    obstacles: [2],
    shields: 0,
    shelterLanes: [],
    restrictedLanes: [],
    laneMultiplier: 2,
    comboCount: 0,
    comboBonus: 0,
    scoreMult: 1,
    stageScoreMod: 1,
    baseBonus: 0,
    frozen: 0,
    revive: 0,
    maxCombo: 0,
    ...overrides,
  };
}

describe('judgeCycle', () => {
  describe('被弾判定', () => {
    it('障害物がプレイヤーレーンにある場合、被弾で死亡する', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 1,
        obstacles: [1],
      }));

      expect(result.hit).toBe(true);
      expect(result.dead).toBe(true);
      expect(result.scoreGained).toBe(0);
      expect(result.comboCount).toBe(0);
    });

    it('障害物がプレイヤーレーンにない場合、回避でスコア加算', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 1,
      }));

      expect(result.hit).toBe(false);
      expect(result.dead).toBe(false);
      expect(result.scoreGained).toBe(10); // (10+0)*1*1*1*1 = 10
      expect(result.comboCount).toBe(1);
    });
  });

  describe('ニアミス判定', () => {
    it('隣接レーンに障害物がある場合、ニアミスになる', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 1,
        obstacles: [0],
        laneMultiplier: 2,
      }));

      expect(result.nearMiss).toBe(true);
      expect(result.hit).toBe(false);
    });

    it('隣接でないレーンの場合、ニアミスにならない', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 1,
      }));

      expect(result.nearMiss).toBe(false);
    });
  });

  describe('シールド', () => {
    it('シールド保持中の被弾でシールドを使用する', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 1,
        obstacles: [1],
        shields: 1,
      }));

      expect(result.hit).toBe(true);
      expect(result.shieldUsed).toBe(true);
      expect(result.dead).toBe(false);
      expect(result.comboCount).toBe(0);
      expect(result.scoreGained).toBe(0);
    });
  });

  describe('シェルター', () => {
    it('シェルターレーンでの被弾はシェルター回避になる', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [0],
        shelterLanes: [0],
        laneMultiplier: 0,
      }));

      expect(result.hit).toBe(false);
      expect(result.sheltered).toBe(true);
      expect(result.scoreGained).toBe(0);
      expect(result.zeroed).toBe(true);
      expect(result.comboCount).toBe(0); // シェルターではコンボリセット
    });

    it('シェルターレーンで障害物がない場合も0点', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        shelterLanes: [0],
        laneMultiplier: 0,
      }));

      expect(result.hit).toBe(false);
      expect(result.sheltered).toBe(true);
      expect(result.zeroed).toBe(true);
      expect(result.scoreGained).toBe(0);
    });
  });

  describe('フリーズ中の判定', () => {
    it('フリーズ中は回避しても0点', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        frozen: 3,
        laneMultiplier: 4,
      }));

      expect(result.hit).toBe(false);
      expect(result.frozen).toBe(true);
      expect(result.scoreGained).toBe(0);
      expect(result.comboCount).toBe(1); // コンボは加算される
    });
  });

  describe('リバイブ', () => {
    it('リバイブ保持中の被弾で復活する', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 1,
        obstacles: [1],
        revive: 1,
      }));

      expect(result.hit).toBe(true);
      expect(result.reviveUsed).toBe(true);
      expect(result.dead).toBe(false);
      expect(result.comboCount).toBe(0);
    });

    it('シールドとリバイブがある場合、シールドが優先される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 1,
        obstacles: [1],
        shields: 1,
        revive: 1,
      }));

      expect(result.shieldUsed).toBe(true);
      expect(result.reviveUsed).toBe(false);
    });
  });

  describe('スコア計算', () => {
    it('倍率が反映される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 2,
        obstacles: [0],
        laneMultiplier: 4,
      }));

      // (10+0)*4*1*1*1 = 40
      expect(result.scoreGained).toBe(40);
    });

    it('コンボ倍率が反映される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 2,
        comboCount: 4, // 次は5コンボ目 → cm=2
      }));

      // (10+0)*2*2*1*1 = 40
      expect(result.scoreGained).toBe(40);
    });

    it('ベースボーナスが反映される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 1,
        baseBonus: 5,
      }));

      // (10+5)*1*1*1*1 = 15
      expect(result.scoreGained).toBe(15);
    });

    it('ステージスコア修正値が反映される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 2,
        stageScoreMod: 2, // BONUS ROUND
      }));

      // (10+0)*2*1*1*2 = 40
      expect(result.scoreGained).toBe(40);
    });

    it('制限レーンでは0点', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        restrictedLanes: [0],
        laneMultiplier: 1,
      }));

      expect(result.zeroed).toBe(true);
      expect(result.scoreGained).toBe(0);
    });
  });

  describe('リスクスコア', () => {
    it('レーン2でリスクポイントが加算される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 2,
        obstacles: [0],
        laneMultiplier: 4,
      }));

      expect(result.riskPoint).toBe(true);
    });

    it('倍率4以上でリスクポイントが加算される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 4,
      }));

      expect(result.riskPoint).toBe(true);
    });

    it('レーン0,1で倍率3以下ではリスクポイントなし', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        laneMultiplier: 1,
      }));

      expect(result.riskPoint).toBe(false);
    });
  });

  describe('コンボ更新', () => {
    it('回避時にコンボがインクリメントされる', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        comboCount: 3,
        maxCombo: 5,
      }));

      expect(result.comboCount).toBe(4);
      expect(result.maxCombo).toBe(5); // 既存の maxCombo を超えない
    });

    it('コンボが最大コンボを超える場合に更新される', () => {
      const result = judgeCycle(defaultParams({
        playerLane: 0,
        obstacles: [2],
        comboCount: 5,
        maxCombo: 5,
      }));

      expect(result.comboCount).toBe(6);
      expect(result.maxCombo).toBe(6);
    });
  });
});
