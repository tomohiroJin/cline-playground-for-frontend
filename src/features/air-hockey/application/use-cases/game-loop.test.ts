/**
 * ゲームループユースケースのテスト
 */
import { GameLoopUseCase, type GameLoopDependencies } from './game-loop';
import { InMemoryStorageAdapter } from '../../__tests__/helpers/in-memory-storage';
import { NullAudioAdapter } from '../../__tests__/helpers/null-audio';
import { createNullRenderer } from '../../__tests__/helpers/null-renderer';
import { createEventDispatcher } from '../../domain/events/game-events';
import type { GameEvent, GameEventDispatcher } from '../../domain/events/game-events';
import type { FieldConfig } from '../../core/types';
import type { AiBehaviorConfig } from '../../core/story-balance';
import { AI_BEHAVIOR_PRESETS } from '../../core/story-balance';
import { FIELDS } from '../../core/config';

describe('GameLoopUseCase', () => {
  let deps: GameLoopDependencies;
  let dispatcher: GameEventDispatcher;
  let collectedEvents: GameEvent[];
  let useCase: GameLoopUseCase;
  const defaultField: FieldConfig = FIELDS[0];
  const easyAi: AiBehaviorConfig = AI_BEHAVIOR_PRESETS.easy;

  beforeEach(() => {
    dispatcher = createEventDispatcher();
    collectedEvents = [];
    dispatcher.subscribe(event => collectedEvents.push(event));

    deps = {
      storage: new InMemoryStorageAdapter(),
      audio: new NullAudioAdapter(),
      renderer: createNullRenderer(),
      eventDispatcher: dispatcher,
    };
    useCase = new GameLoopUseCase(deps, defaultField, easyAi, 3);
  });

  describe('初期化', () => {
    it('初期ゲーム状態が生成される', () => {
      const state = useCase.getState();
      expect(state).toBeDefined();
      expect(state.pucks.length).toBeGreaterThanOrEqual(1);
      expect(state.player).toBeDefined();
      expect(state.cpu).toBeDefined();
    });

    it('初期フェーズがcountdownである', () => {
      expect(useCase.getPhase()).toBe('countdown');
    });

    it('初期スコアがどちらも0である', () => {
      const score = useCase.getScore();
      expect(score.player).toBe(0);
      expect(score.cpu).toBe(0);
    });

    it('初期状態で勝者がundefinedである', () => {
      expect(useCase.getWinner()).toBeUndefined();
    });
  });

  describe('フェーズ遷移', () => {
    it('startPlayingでplayingフェーズに遷移する', () => {
      useCase.startPlaying();
      expect(useCase.getPhase()).toBe('playing');
    });

    it('finishedフェーズからstartPlayingを呼んでも遷移しない', () => {
      useCase.startPlaying();
      for (let i = 0; i < 3; i++) {
        useCase.addScore('player');
      }
      expect(useCase.getPhase()).toBe('finished');
      useCase.startPlaying();
      expect(useCase.getPhase()).toBe('finished');
    });

    it('pauseでpausedフェーズに遷移する', () => {
      useCase.startPlaying();
      useCase.pause();
      expect(useCase.getPhase()).toBe('paused');
    });

    it('resumeでplayingに戻る', () => {
      useCase.startPlaying();
      useCase.pause();
      useCase.resume();
      expect(useCase.getPhase()).toBe('playing');
    });

    it('フェーズ遷移でPHASE_CHANGEDイベントが発行される', () => {
      useCase.startPlaying();
      const phaseEvents = collectedEvents.filter(e => e.type === 'PHASE_CHANGED');
      expect(phaseEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('handleEvents', () => {
    it('GOAL_SCOREDイベントでゴール音が再生される', () => {
      const audio = deps.audio as NullAudioAdapter;
      useCase.handleEvents([{ type: 'GOAL_SCORED', scorer: 'player', speed: 5 }]);
      expect(audio.calls.some(c => c.method === 'playGoal')).toBe(true);
    });

    it('COLLISIONイベントでヒット音が再生される', () => {
      const audio = deps.audio as NullAudioAdapter;
      useCase.handleEvents([{
        type: 'COLLISION',
        objectA: 'puck',
        objectB: 'mallet',
        speed: 5,
        x: 100,
        y: 200,
      }]);
      expect(audio.calls.some(c => c.method === 'playHit')).toBe(true);
    });

    it('WALL_BOUNCEイベントで壁音が再生される', () => {
      const audio = deps.audio as NullAudioAdapter;
      useCase.handleEvents([{ type: 'WALL_BOUNCE', x: 0, y: 100 }]);
      expect(audio.calls.some(c => c.method === 'playWall')).toBe(true);
    });

    it('ITEM_COLLECTEDイベントでアイテム音が再生される', () => {
      const audio = deps.audio as NullAudioAdapter;
      useCase.handleEvents([{ type: 'ITEM_COLLECTED', itemType: 'speed', collector: 'player' }]);
      expect(audio.calls.some(c => c.method === 'playItem')).toBe(true);
    });
  });

  describe('スコア管理', () => {
    it('addScoreでスコアが加算される', () => {
      useCase.addScore('player');
      expect(useCase.getScore().player).toBe(1);
    });

    it('勝利スコアに達するとfinishedフェーズに遷移する', () => {
      useCase.startPlaying();
      for (let i = 0; i < 3; i++) {
        useCase.addScore('player');
      }
      expect(useCase.getPhase()).toBe('finished');
    });

    it('勝利スコアに達すると勝者が取得できる', () => {
      useCase.startPlaying();
      for (let i = 0; i < 3; i++) {
        useCase.addScore('player');
      }
      expect(useCase.getWinner()).toBe('player');
    });
  });
});
