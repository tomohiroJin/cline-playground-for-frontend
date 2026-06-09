import { advanceClock, createGameClock, triggerHitstop } from './game-clock';

describe('GameClock', () => {
  describe('createGameClock', () => {
    describe('正常系', () => {
      it('停止・スローモーともに0の初期クロックを生成する', () => {
        // Arrange / Act
        const clock = createGameClock();

        // Assert
        expect(clock.hitstopFrames).toBe(0);
        expect(clock.slowMoFrames).toBe(0);
        expect(clock.tickCounter).toBe(0);
      });
    });
  });

  describe('triggerHitstop', () => {
    describe('正常系', () => {
      it('指定フレーム数のヒットストップを設定する', () => {
        // Arrange
        const clock = createGameClock();
        // Act
        const result = triggerHitstop(clock, 4);
        // Assert
        expect(result.hitstopFrames).toBe(4);
      });

      it('既存より長いヒットストップで上書きする（max 合成）', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 2);
        // Act
        const result = triggerHitstop(clock, 5);
        // Assert
        expect(result.hitstopFrames).toBe(5);
      });

      it('既存より短い指定では上書きしない', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 5);
        // Act
        const result = triggerHitstop(clock, 2);
        // Assert
        expect(result.hitstopFrames).toBe(5);
      });
    });

    describe('境界値', () => {
      it('0フレーム指定では停止しない', () => {
        // Arrange
        const clock = createGameClock();
        // Act
        const result = triggerHitstop(clock, 0);
        // Assert
        expect(result.hitstopFrames).toBe(0);
      });
    });
  });

  describe('advanceClock', () => {
    describe('正常系', () => {
      it('通常時はシミュレーションを進める', () => {
        // Arrange
        const clock = createGameClock();
        // Act
        const { shouldStepSim } = advanceClock(clock);
        // Assert
        expect(shouldStepSim).toBe(true);
      });

      it('ヒットストップ中はシミュレーションを止める', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 2);
        // Act
        const { clock: next, shouldStepSim } = advanceClock(clock);
        // Assert
        expect(shouldStepSim).toBe(false);
        expect(next.hitstopFrames).toBe(1);
      });

      it('ヒットストップが切れた次の tick で再びシミュレーションを進める', () => {
        // Arrange
        const first = advanceClock(triggerHitstop(createGameClock(), 1));
        // Act
        const second = advanceClock(first.clock);
        // Assert
        expect(first.shouldStepSim).toBe(false);
        expect(second.shouldStepSim).toBe(true);
      });
    });
  });
});
