// GameOrchestrator の統合テスト

import { createOrchestrator } from '../../application/game-orchestrator';
import type { GameOrchestratorConfig } from '../../application/game-orchestrator';
import { createMockRenderer, createMockAudio, createMockStorage, createMockInput } from '../helpers/mock-ports';
import { COURSES } from '../../domain/track/course';
import { RACE_TIMING } from '../../domain/race/constants';

const createTestConfig = (overrides?: Partial<GameOrchestratorConfig>): GameOrchestratorConfig => ({
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

describe('GameOrchestrator', () => {
  describe('createOrchestrator', () => {
    it('初期状態が countdown フェーズで生成される', () => {
      const config = createTestConfig();
      const orchestrator = createOrchestrator(config);
      const state = orchestrator.getState();

      expect(state.phase).toBe('countdown');
      expect(state.players.length).toBeGreaterThanOrEqual(1);
      expect(state.paused).toBe(false);
      expect(state.winner).toBeNull();
    });
  });

  describe('フェーズ遷移', () => {
    it('カウントダウン完了後にレースフェーズに遷移する', () => {
      // Arrange
      const audio = createMockAudio();
      const config = createTestConfig({ audio });
      const orchestrator = createOrchestrator(config);

      // Act: カウントダウン時間を経過させる
      const now = Date.now();
      orchestrator.update(now + RACE_TIMING.COUNTDOWN + 100);

      // Assert
      expect(orchestrator.getState().phase).toBe('race');
      expect(audio.calls).toContain('playSfx:go');
    });

    it('カウントダウン中はレースロジックが実行されない', () => {
      // Arrange
      const config = createTestConfig();
      const orchestrator = createOrchestrator(config);
      const initialPlayers = orchestrator.getState().players;

      // Act: カウントダウン中に update
      orchestrator.update(Date.now() + 1000);

      // Assert: プレイヤー位置が変わらない
      const currentPlayers = orchestrator.getState().players;
      expect(currentPlayers[0].x).toBe(initialPlayers[0].x);
      expect(currentPlayers[0].y).toBe(initialPlayers[0].y);
    });
  });

  describe('ポーズ', () => {
    it('togglePause でポーズ状態が切り替わる', () => {
      const config = createTestConfig();
      const orchestrator = createOrchestrator(config);

      expect(orchestrator.getState().paused).toBe(false);
      orchestrator.togglePause();
      expect(orchestrator.getState().paused).toBe(true);
      orchestrator.togglePause();
      expect(orchestrator.getState().paused).toBe(false);
    });

    it('ポーズ中は update でゲーム状態が変わらない', () => {
      // Arrange
      const config = createTestConfig();
      const orchestrator = createOrchestrator(config);
      // レースフェーズに遷移
      orchestrator.update(Date.now() + RACE_TIMING.COUNTDOWN + 100);
      orchestrator.togglePause();
      const pausedState = orchestrator.getState();

      // Act
      orchestrator.update(Date.now() + RACE_TIMING.COUNTDOWN + 5000);

      // Assert: プレイヤー位置が変わらない
      const afterState = orchestrator.getState();
      expect(afterState.players[0].x).toBe(pausedState.players[0].x);
    });
  });

  describe('リセット', () => {
    it('reset で初期状態に戻る', () => {
      const config = createTestConfig();
      const orchestrator = createOrchestrator(config);

      // レースに遷移
      orchestrator.update(Date.now() + RACE_TIMING.COUNTDOWN + 100);
      expect(orchestrator.getState().phase).toBe('race');

      // リセット
      orchestrator.reset();
      expect(orchestrator.getState().phase).toBe('countdown');
      expect(orchestrator.getState().winner).toBeNull();
    });
  });
});
