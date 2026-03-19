/**
 * 迷宮の残響 - ProceedStepUseCase テスト
 */
import { proceedStep } from '../../../application/use-cases/proceed-step';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { createMetaState } from '../../../domain/models/meta-state';
import { CFG } from '../../../domain/constants/config';
import type { GameState } from '../../../domain/models/game-state';
import type { GameEvent } from '../../../domain/events/game-event';
import type { RandomPort } from '../../../application/ports/random-port';

/** テスト用GameStateを生成する */
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  phase: 'result',
  player: {
    hp: 55, maxHp: 55, mn: 35, maxMn: 35, inf: 5, statuses: [],
  },
  difficulty: DIFFICULTY.find(d => d.id === 'normal')!,
  floor: 1,
  step: 1,
  usedEventIds: ['evt001'],
  log: [],
  chainNextId: null,
  usedSecondLife: false,
  ...overrides,
});

/** テスト用イベント群を生成する */
const createTestEvents = (): GameEvent[] => [
  {
    id: 'evt001', fl: [1], tp: 'exploration', sit: 'イベント1',
    ch: [{ t: '選択A', o: [{ c: 'default', r: '結果A' }] }],
  },
  {
    id: 'evt002', fl: [1], tp: 'encounter', sit: 'イベント2',
    ch: [{ t: '選択B', o: [{ c: 'default', r: '結果B' }] }],
  },
  {
    id: 'evt003', fl: [1, 2], tp: 'trap', sit: 'イベント3',
    ch: [{ t: '選択C', o: [{ c: 'default', r: '結果C' }] }],
  },
  {
    id: 'evt004', fl: [2], tp: 'exploration', sit: 'イベント4',
    ch: [{ t: '選択D', o: [{ c: 'default', r: '結果D' }] }],
  },
  {
    id: CFG.BOSS_EVENT_ID, fl: [1, 2, 3, 4, 5], tp: 'boss', sit: 'ボスイベント',
    ch: [{ t: 'ボス選択', o: [{ c: 'default', r: 'ボス結果' }] }],
  },
  {
    id: 'chain001', fl: [1], tp: 'exploration', sit: 'チェインイベント',
    ch: [{ t: 'チェイン選択', o: [{ c: 'default', r: 'チェイン結果' }] }],
    chainOnly: true,
  },
];

/** 常に0を返す固定乱数ソース */
const fixedRng: RandomPort = { random: () => 0 };

describe('proceedStep', () => {
  describe('通常の次イベント選出', () => {
    it('使用済みでないイベントが選出される', () => {
      // Arrange
      const gameState = createTestGameState({ step: 1 });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('next_event');
      const transition = result.transition as { type: 'next_event'; event: GameEvent };
      expect(transition.event.id).not.toBe('evt001'); // 使用済み
      expect(result.gameState.step).toBe(2);
    });

    it('chainOnlyイベントは通常選出されない', () => {
      // Arrange
      const gameState = createTestGameState({ step: 1 });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('next_event');
      const transition = result.transition as { type: 'next_event'; event: GameEvent };
      expect(transition.event.chainOnly).not.toBe(true);
    });
  });

  describe('フロア遷移', () => {
    it('EVENTS_PER_FLOOR回イベントをこなしたらフロア遷移する', () => {
      // Arrange
      const gameState = createTestGameState({
        step: CFG.EVENTS_PER_FLOOR,
        floor: 1,
      });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('floor_change');
      const transition = result.transition as { type: 'floor_change'; newFloor: number };
      expect(transition.newFloor).toBe(2);
      expect(result.gameState.floor).toBe(2);
      expect(result.gameState.step).toBe(0);
      expect(result.gameState.usedEventIds).toEqual([]);
    });
  });

  describe('ボス遭遇', () => {
    it('最終フロアでEVENTS_PER_FLOOR回イベントをこなしたらボス遭遇する', () => {
      // Arrange
      const gameState = createTestGameState({
        step: CFG.EVENTS_PER_FLOOR,
        floor: CFG.MAX_FLOOR,
      });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('boss_encounter');
    });
  });

  describe('チェインイベント', () => {
    it('chainNextIdが設定されている場合にチェインイベントが選出される', () => {
      // Arrange
      const gameState = createTestGameState({
        step: 1,
        chainNextId: 'chain001',
      });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('chain_event');
      const transition = result.transition as { type: 'chain_event'; event: GameEvent };
      expect(transition.event.id).toBe('chain001');
      expect(result.gameState.chainNextId).toBeNull();
    });

    it('chainNextIdが設定されているが該当イベントが見つからない場合は通常選出にフォールバックする', () => {
      // Arrange
      const gameState = createTestGameState({
        step: 1,
        chainNextId: 'nonexistent_chain',
      });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert: チェインが見つからないので通常のイベント選出にフォールバック
      expect(result.transition.type).toBe('next_event');
    });
  });

  describe('イベント枯渇時のフォールバック', () => {
    it('利用可能なイベントがない場合にフロア遷移する', () => {
      // Arrange: フロア1のイベントを全て使用済みにする（ボス含む）
      const events = createTestEvents();
      const usedIds = events
        .filter(e => e.fl.includes(1) && !e.chainOnly)
        .map(e => e.id);
      const gameState = createTestGameState({
        step: 1,
        floor: 1,
        usedEventIds: usedIds,
      });
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('floor_change');
    });

    it('最終フロアでイベントが枯渇した場合にボス遭遇にフォールバックする', () => {
      // Arrange: 最終フロアのイベントを全て使用済みにする
      const events = createTestEvents();
      const usedIds = events
        .filter(e => e.fl.includes(CFG.MAX_FLOOR) && !e.chainOnly)
        .map(e => e.id);
      const gameState = createTestGameState({
        step: 1,
        floor: CFG.MAX_FLOOR,
        usedEventIds: usedIds,
      });
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      // 最終フロアでの枯渇はボス遭遇にフォールバック（無限ループ防止）
      expect(result.transition.type).toBe('boss_encounter');
    });
  });

  describe('ステップ進行', () => {
    it('イベント選出時にusedEventIdsにIDが追加される', () => {
      // Arrange
      const gameState = createTestGameState({ step: 1, usedEventIds: [] });
      const events = createTestEvents();
      const meta = createMetaState();

      // Act
      const result = proceedStep({
        gameState,
        events,
        meta,
        rng: fixedRng,
      });

      // Assert
      expect(result.transition.type).toBe('next_event');
      const transition = result.transition as { type: 'next_event'; event: GameEvent };
      expect(result.gameState.usedEventIds).toContain(transition.event.id);
    });
  });
});
