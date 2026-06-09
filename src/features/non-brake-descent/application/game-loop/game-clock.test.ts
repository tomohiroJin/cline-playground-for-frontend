import { advanceClock, createGameClock, triggerHitstop, triggerSlowMo } from './game-clock';

describe('GameClock', () => {
  describe('createGameClock', () => {
    describe('正常系', () => {
      it('停止・スローモーともに0の初期クロックを生成する', () => {
        // Arrange / Act
        const clock = createGameClock();

        // Assert
        expect(clock.hitstopFrames).toBe(0);
        expect(clock.slowMoFrames).toBe(0);
        expect(clock.slowMoFactor).toBe(1);
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

      it('負のフレーム指定では停止しない', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const result = triggerHitstop(clock, -3);

        // Assert
        expect(result.hitstopFrames).toBe(0);
      });
    });
  });

  describe('triggerSlowMo', () => {
    describe('正常系', () => {
      it('指定フレーム数・factor のスローモーを設定する', () => {
        // Arrange
        const clock = createGameClock();
        // Act
        const result = triggerSlowMo(clock, 12, 3);
        // Assert
        expect(result.slowMoFrames).toBe(12);
        expect(result.slowMoFactor).toBe(3);
      });

      it('factor は後勝ちで上書きされる（既存より小さい値も適用される）', () => {
        // Arrange
        const clock = triggerSlowMo(createGameClock(), 12, 5);

        // Act
        const result = triggerSlowMo(clock, 12, 2);

        // Assert
        expect(result.slowMoFactor).toBe(2);
      });

      it('再発動で間引き位相（tickCounter）が初期化される', () => {
        // Arrange: スローモー中に tickCounter を進める
        let clock = triggerSlowMo(createGameClock(), 12, 3);
        clock = advanceClock(clock).clock; // tickCounter=1
        clock = advanceClock(clock).clock; // tickCounter=2

        // Act: 再発動
        const result = triggerSlowMo(clock, 12, 3);

        // Assert
        expect(result.tickCounter).toBe(0);
      });
    });

    describe('境界値', () => {
      it('factor は最小1に正規化される', () => {
        // Arrange
        const clock = createGameClock();
        // Act
        const result = triggerSlowMo(clock, 12, 0);
        // Assert
        expect(result.slowMoFactor).toBe(1);
      });
    });
  });

  describe('advanceClock（スローモー）', () => {
    describe('正常系', () => {
      it('factor=3 のスローモーでは3 tick に1回だけ sim を進める', () => {
        // Arrange
        let clock = triggerSlowMo(createGameClock(), 12, 3);
        const steps: boolean[] = [];
        // Act
        for (let i = 0; i < 3; i++) {
          const result = advanceClock(clock);
          clock = result.clock;
          steps.push(result.shouldStepSim);
        }
        // Assert
        expect(steps).toEqual([false, false, true]);
      });

      it('スローモー残数を毎 tick 減らす', () => {
        // Arrange
        const clock = triggerSlowMo(createGameClock(), 12, 3);
        // Act
        const { clock: next } = advanceClock(clock);
        // Assert
        expect(next.slowMoFrames).toBe(11);
      });

      it('ヒットストップはスローモーより優先される', () => {
        // Arrange
        const clock = triggerSlowMo(triggerHitstop(createGameClock(), 2), 12, 3);
        // Act
        const { shouldStepSim, clock: next } = advanceClock(clock);
        // Assert
        expect(shouldStepSim).toBe(false);
        expect(next.hitstopFrames).toBe(1);
        expect(next.slowMoFrames).toBe(12);
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
