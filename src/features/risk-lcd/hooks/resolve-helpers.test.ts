import type { GameState } from '../types';
import type { CycleJudgment } from '../domain/judgment';
import {
  applyHitStateUpdate,
  applyDodgeStateUpdate,
  HitOutcome,
} from './resolve-helpers';

// テスト用 GameState のファクトリ
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    st: {
      mu: [1, 2, 4],
      rs: [],
      sf: [],
      wm: 0,
      cm: 0,
      sh: 0,
      sp: 5,
      db: 0,
      cb: 0,
      bfSet: [0, 4, 6],
    },
    score: 100,
    stage: 0,
    cycle: 3,
    lane: 1,
    alive: true,
    phase: 'warn',
    shields: 1,
    frozen: 0,
    moveOk: true,
    moveCd: 120,
    comboCount: 3,
    maxCombo: 3,
    riskScore: 0,
    total: 5,
    nearMiss: 0,
    scoreMult: 1,
    comboBonus: 0,
    slowMod: 0,
    speedMod: 0,
    revive: 1,
    bfAdj: 0,
    bfAdj_lane: -1,
    bfAdj_extra: 0,
    baseBonus: 0,
    perks: [],
    perkChoices: null,
    stageMod: null,
    curStgCfg: null,
    curBf0: [0, 4, 6],
    artState: 'idle',
    maxStg: 4,
    walkFrame: 0,
    artFrame: 0,
    shelterSaves: 0,
    dailyMode: false,
    practiceMode: false,
    ghostLog: [],
    ...overrides,
  } as GameState;
}

describe('applyHitStateUpdate', () => {
  describe('シールド使用時', () => {
    it('シールドを減らしフリーズ状態にする', () => {
      // Arrange
      const g = createTestGameState({ shields: 2, comboCount: 5 });
      const judgment: CycleJudgment = {
        hit: true,
        nearMiss: false,
        sheltered: false,
        shieldUsed: true,
        frozen: false,
        zeroed: false,
        scoreGained: 0,
        comboCount: 0,
        maxCombo: 5,
        riskPoint: false,
        reviveUsed: false,
        dead: false,
      };

      // Act
      const outcome = applyHitStateUpdate(g, judgment);

      // Assert
      expect(outcome).toBe(HitOutcome.ShieldUsed);
      expect(g.shields).toBe(1);
      expect(g.frozen).toBe(5); // st.sp = 5
      expect(g.comboCount).toBe(0);
      expect(g.artState).toBe('shield');
    });
  });

  describe('リバイブ使用時', () => {
    it('リバイブを減らしコンボをリセットする', () => {
      // Arrange
      const g = createTestGameState({ revive: 2, comboCount: 3 });
      const judgment: CycleJudgment = {
        hit: true,
        nearMiss: false,
        sheltered: false,
        shieldUsed: false,
        frozen: false,
        zeroed: false,
        scoreGained: 0,
        comboCount: 0,
        maxCombo: 3,
        riskPoint: false,
        reviveUsed: true,
        dead: false,
      };

      // Act
      const outcome = applyHitStateUpdate(g, judgment);

      // Assert
      expect(outcome).toBe(HitOutcome.ReviveUsed);
      expect(g.revive).toBe(1);
      expect(g.comboCount).toBe(0);
      expect(g.alive).toBe(true);
    });
  });

  describe('死亡時', () => {
    it('alive を false にしコンボをリセットする', () => {
      // Arrange
      const g = createTestGameState({ shields: 0, revive: 0, comboCount: 5 });
      const judgment: CycleJudgment = {
        hit: true,
        nearMiss: false,
        sheltered: false,
        shieldUsed: false,
        frozen: false,
        zeroed: false,
        scoreGained: 0,
        comboCount: 0,
        maxCombo: 5,
        riskPoint: false,
        reviveUsed: false,
        dead: true,
      };

      // Act
      const outcome = applyHitStateUpdate(g, judgment);

      // Assert
      expect(outcome).toBe(HitOutcome.Dead);
      expect(g.alive).toBe(false);
      expect(g.comboCount).toBe(0);
    });
  });
});

describe('applyDodgeStateUpdate', () => {
  it('コンボと最大コンボを更新する', () => {
    // Arrange
    const g = createTestGameState({ comboCount: 2, maxCombo: 2 });
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: false,
      sheltered: false,
      shieldUsed: false,
      frozen: false,
      zeroed: false,
      scoreGained: 20,
      comboCount: 3,
      maxCombo: 3,
      riskPoint: false,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, [0]);

    // Assert
    expect(g.comboCount).toBe(3);
    expect(g.maxCombo).toBe(3);
    expect(g.score).toBe(120); // 100 + 20
  });

  it('ニアミス時に nearMiss をインクリメントする', () => {
    // Arrange
    const g = createTestGameState({ nearMiss: 1 });
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: true,
      sheltered: false,
      shieldUsed: false,
      frozen: false,
      zeroed: false,
      scoreGained: 20,
      comboCount: 4,
      maxCombo: 4,
      riskPoint: false,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, [0]);

    // Assert
    expect(g.nearMiss).toBe(2);
  });

  it('リスクポイント時に riskScore をインクリメントする', () => {
    // Arrange
    const g = createTestGameState({ riskScore: 2 });
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: false,
      sheltered: false,
      shieldUsed: false,
      frozen: false,
      zeroed: false,
      scoreGained: 20,
      comboCount: 4,
      maxCombo: 4,
      riskPoint: true,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, [0]);

    // Assert
    expect(g.riskScore).toBe(3);
  });

  it('フリーズ中はスコアを加算せずフリーズを減少する', () => {
    // Arrange
    const g = createTestGameState({ frozen: 3, score: 100 });
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: false,
      sheltered: false,
      shieldUsed: false,
      frozen: true,
      zeroed: false,
      scoreGained: 0,
      comboCount: 4,
      maxCombo: 4,
      riskPoint: false,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, [0]);

    // Assert
    expect(g.frozen).toBe(2);
    expect(g.score).toBe(100); // 変化なし
  });

  it('シェルター吸収時に shelterSaves をインクリメントする', () => {
    // Arrange
    const g = createTestGameState({ lane: 0, shelterSaves: 1 });
    g.st.sf = [0];
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: false,
      sheltered: true,
      shieldUsed: false,
      frozen: false,
      zeroed: true,
      scoreGained: 0,
      comboCount: 0,
      maxCombo: 3,
      riskPoint: false,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, [0]); // 障害物がプレイヤーレーンにある

    // Assert
    expect(g.shelterSaves).toBe(2);
  });

  it('zeroed 時はスコアを加算しない', () => {
    // Arrange
    const g = createTestGameState({ score: 100 });
    const judgment: CycleJudgment = {
      hit: false,
      nearMiss: false,
      sheltered: false,
      shieldUsed: false,
      frozen: false,
      zeroed: true,
      scoreGained: 0,
      comboCount: 4,
      maxCombo: 4,
      riskPoint: false,
      reviveUsed: false,
      dead: false,
    };

    // Act
    applyDodgeStateUpdate(g, judgment, []);

    // Assert
    expect(g.score).toBe(100); // 変化なし
  });
});
