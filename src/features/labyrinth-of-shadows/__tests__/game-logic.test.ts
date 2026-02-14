import { GameLogic } from '../game-logic';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';

// AudioContext のモック
beforeAll(() => {
  (window as { AudioContext?: typeof AudioContext }).AudioContext = jest.fn().mockImplementation(
    () => ({
      createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: '',
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      }),
      destination: {},
      currentTime: 0,
    })
  );
});

describe('labyrinth-of-shadows/game-logic', () => {
  let state: GameState;

  beforeEach(() => {
    state = GameStateFactory.create('EASY');
  });

  describe('updateHiding', () => {
    test('隠れる要求でエネルギーがある場合、隠れ状態になる', () => {
      GameLogic.updateHiding(state, true, 16);
      expect(state.hiding).toBe(true);
    });

    test('隠れる要求なしの場合、隠れ状態が解除される', () => {
      state.hiding = true;
      GameLogic.updateHiding(state, false, 16);
      expect(state.hiding).toBe(false);
    });

    test('隠れている間エネルギーが減少する', () => {
      const initialEnergy = state.energy;
      GameLogic.updateHiding(state, true, 100);
      expect(state.energy).toBeLessThan(initialEnergy);
    });

    test('隠れていない間エネルギーが回復する', () => {
      state.energy = 50;
      GameLogic.updateHiding(state, false, 100);
      expect(state.energy).toBeGreaterThan(50);
    });
  });

  describe('updateSprinting', () => {
    test('ダッシュ要求でスタミナがある場合、ダッシュ状態になる', () => {
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(true);
    });

    test('隠れている間はダッシュできない', () => {
      state.hiding = true;
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(false);
    });

    test('スタミナが低い場合はダッシュできない', () => {
      state.player.stamina = 3;
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(false);
    });
  });

  describe('updatePlayer', () => {
    test('隠れている間は移動しない', () => {
      state.hiding = true;
      const moved = GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: true, backward: false },
        16
      );
      expect(moved).toBe(false);
    });

    test('前進入力で移動する', () => {
      const initialX = state.player.x;
      const initialY = state.player.y;
      GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: true, backward: false },
        16
      );
      // 角度0の場合、x方向に移動する
      const dx = state.player.x - initialX;
      const dy = state.player.y - initialY;
      expect(dx !== 0 || dy !== 0).toBe(true);
    });
  });

  describe('updateExplored', () => {
    test('プレイヤー周辺のセルが探索済みになる', () => {
      state.explored = {};
      GameLogic.updateExplored(state);
      const px = Math.floor(state.player.x);
      const py = Math.floor(state.player.y);
      expect(state.explored[`${px},${py}`]).toBe(true);
    });
  });

  describe('checkExit', () => {
    test('出口から遠い場合はnullを返す', () => {
      const result = GameLogic.checkExit(state);
      expect(result).toBeNull();
    });
  });

  describe('updateEnemies', () => {
    test('最も近い敵の距離を返す', () => {
      const closest = GameLogic.updateEnemies(state, 16);
      expect(typeof closest).toBe('number');
    });
  });
});
