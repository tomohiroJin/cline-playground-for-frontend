// レイヤー横断統合テスト: レースフロー

import { createOrchestrator } from '../../application/game-orchestrator';
import type { GameOrchestratorConfig } from '../../application/game-orchestrator';
import { createMockRenderer, createMockAudio, createMockStorage, createMockInput } from '../helpers/mock-ports';
import { COURSES } from '../../domain/track/course';
import { RACE_TIMING } from '../../domain/race/constants';
import type { InputState } from '../../application/ports/input-port';

const createConfig = (overrides?: Partial<GameOrchestratorConfig>): GameOrchestratorConfig => ({
  renderer: createMockRenderer(),
  audio: createMockAudio(),
  storage: createMockStorage(),
  input: createMockInput(),
  raceConfig: {
    mode: 'cpu',
    courseIndex: 0,
    maxLaps: 3,
    baseSpeed: 3.2,
    cpuDifficulty: 'normal',
    cardsEnabled: true,
  },
  course: COURSES[0],
  playerColors: ['#E60012', '#0066FF'],
  playerNames: ['P1', 'CPU'],
  ...overrides,
});

describe('race-flow', () => {
  describe('ソロレースの基本フロー', () => {
    it('countdown → race のフェーズ遷移が正しく行われる', () => {
      // Arrange
      const config = createConfig({
        raceConfig: { mode: 'solo', courseIndex: 0, maxLaps: 1, baseSpeed: 3.2, cpuDifficulty: 'normal', cardsEnabled: false },
        playerNames: ['P1', 'P2'],
      });
      const orc = createOrchestrator(config);
      expect(orc.getState().phase).toBe('countdown');

      // Act
      orc.update(Date.now() + RACE_TIMING.COUNTDOWN + 100);

      // Assert
      expect(orc.getState().phase).toBe('race');
      expect(orc.getState().players).toHaveLength(1);
    });
  });

  describe('CPU 対戦フロー', () => {
    it('CPU モードでは 2 プレイヤーが生成される', () => {
      const config = createConfig();
      const orc = createOrchestrator(config);
      expect(orc.getState().players).toHaveLength(2);
      expect(orc.getState().players[1].isCpu).toBe(true);
    });

    it('レース開始後に CPU がプレイヤーと同様に移動する', () => {
      // Arrange
      const config = createConfig();
      const orc = createOrchestrator(config);
      const raceStart = Date.now() + RACE_TIMING.COUNTDOWN + 100;
      orc.update(raceStart);

      const cpuBefore = orc.getState().players[1];

      // Act: 10 フレーム更新
      for (let i = 0; i < 10; i++) {
        orc.update(raceStart + (i + 1) * 16);
      }

      // Assert
      const cpuAfter = orc.getState().players[1];
      const moved = cpuAfter.x !== cpuBefore.x || cpuAfter.y !== cpuBefore.y;
      expect(moved).toBe(true);
    });
  });

  describe('2P 対戦フロー', () => {
    it('2P モードでは両プレイヤーが人間', () => {
      const config = createConfig({
        raceConfig: { mode: '2p', courseIndex: 0, maxLaps: 3, baseSpeed: 3.2, cpuDifficulty: 'normal', cardsEnabled: true },
        playerNames: ['P1', 'P2'],
      });
      const orc = createOrchestrator(config);
      expect(orc.getState().players).toHaveLength(2);
      expect(orc.getState().players[0].isCpu).toBe(false);
      expect(orc.getState().players[1].isCpu).toBe(false);
    });

    it('異なる入力を各プレイヤーに提供できる', () => {
      // Arrange: P1 は右、P2 は左
      const p1Input: InputState = { left: false, right: true, handbrake: false };
      const p2Input: InputState = { left: true, right: false, handbrake: false };
      const input = createMockInput({ 0: p1Input, 1: p2Input });
      const config = createConfig({
        input,
        raceConfig: { mode: '2p', courseIndex: 0, maxLaps: 3, baseSpeed: 3.2, cpuDifficulty: 'normal', cardsEnabled: false },
        playerNames: ['P1', 'P2'],
      });
      const orc = createOrchestrator(config);
      const raceStart = Date.now() + RACE_TIMING.COUNTDOWN + 100;
      orc.update(raceStart);

      // Act
      for (let i = 0; i < 5; i++) {
        orc.update(raceStart + (i + 1) * 16);
      }

      // Assert: 両プレイヤーの角度が異なる（異なる方向に操舵）
      const state = orc.getState();
      expect(state.players[0].angle).not.toBe(state.players[1].angle);
    });
  });

  describe('ゲーム状態の整合性', () => {
    it('カウントダウン前はプレイヤーの lapStart が 0', () => {
      const config = createConfig();
      const orc = createOrchestrator(config);
      expect(orc.getState().players[0].lapStart).toBe(0);
    });

    it('レース開始時に lapStart が設定される', () => {
      const config = createConfig();
      const orc = createOrchestrator(config);
      const raceStart = Date.now() + RACE_TIMING.COUNTDOWN + 100;
      orc.update(raceStart);
      expect(orc.getState().players[0].lapStart).toBe(raceStart);
    });

    it('デッキがプレイヤー数分作成される', () => {
      const config = createConfig();
      const orc = createOrchestrator(config);
      expect(orc.getState().decks).toHaveLength(2);
    });
  });
});
