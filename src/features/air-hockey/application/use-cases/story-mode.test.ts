/**
 * ストーリーモードユースケースのテスト
 */
import { StoryModeUseCase } from './story-mode';
import { InMemoryStorageAdapter } from '../../__tests__/helpers/in-memory-storage';
import { createEventDispatcher } from '../../domain/events/game-events';
import type { GameEventDispatcher } from '../../domain/events/game-events';
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { MatchStatsData } from '../../domain/models/match-stats';
import { MatchStats } from '../../domain/models/match-stats';

/** テスト用 MatchStats を生成する */
const createTestMatchStats = (overrides?: Partial<MatchStatsData>): MatchStatsData => ({
  ...MatchStats.create(),
  ...overrides,
});

describe('StoryModeUseCase', () => {
  let storage: GameStoragePort;
  let dispatcher: GameEventDispatcher;
  let useCase: StoryModeUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    dispatcher = createEventDispatcher();
    useCase = new StoryModeUseCase(storage, dispatcher);
  });

  describe('loadProgress', () => {
    it('初期状態ではクリア済みステージが空である', () => {
      const progress = useCase.loadProgress();
      expect(progress.clearedStages).toEqual([]);
    });

    it('保存済みの進行データを読み込める', () => {
      storage.saveStoryProgress({ clearedStages: ['1-1', '1-2'] });
      const progress = useCase.loadProgress();
      expect(progress.clearedStages).toEqual(['1-1', '1-2']);
    });
  });

  describe('getStageConfig', () => {
    it('ステージ1-1のAI設定とフィールドを取得できる', () => {
      const config = useCase.getStageConfig('1-1');
      expect(config.aiConfig).toBeDefined();
      expect(config.field).toBeDefined();
      expect(config.field.id).toBe('classic');
    });

    it('ステージ1-2のフィールドがwideである', () => {
      const config = useCase.getStageConfig('1-2');
      expect(config.field.id).toBe('wide');
    });

    it('ステージ1-3のAIが壁バウンス予測を持つ', () => {
      const config = useCase.getStageConfig('1-3');
      expect(config.aiConfig.wallBounce).toBe(true);
    });
  });

  describe('completeStage', () => {
    it('プレイヤーが勝利するとステージがクリア済みになる', () => {
      const result = useCase.completeStage('1-1', 'player', createTestMatchStats());
      expect(result.progress.clearedStages).toContain('1-1');
    });

    it('プレイヤーが勝利するとストレージに進行が保存される', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      const saved = storage.loadStoryProgress();
      expect(saved.clearedStages).toContain('1-1');
    });

    it('CPUが勝利した場合はステージがクリア済みにならない', () => {
      const result = useCase.completeStage('1-1', 'cpu', createTestMatchStats());
      expect(result.progress.clearedStages).not.toContain('1-1');
    });

    it('同じステージを再クリアしても重複しない', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      const progress = useCase.loadProgress();
      expect(progress.clearedStages.filter(id => id === '1-1')).toHaveLength(1);
    });

    it('ステージクリアで新キャラがアンロックされる', () => {
      const result = useCase.completeStage('1-1', 'player', createTestMatchStats());
      expect(result.newUnlocks).toContain('hiro');
    });

    it('ステージ1-2クリアでmisakiがアンロックされる', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      const result = useCase.completeStage('1-2', 'player', createTestMatchStats());
      expect(result.newUnlocks).toContain('misaki');
    });

    it('ステージ1-3クリアでtakumaがアンロックされる', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      useCase.completeStage('1-2', 'player', createTestMatchStats());
      const result = useCase.completeStage('1-3', 'player', createTestMatchStats());
      expect(result.newUnlocks).toContain('takuma');
    });
  });

  describe('resetProgress', () => {
    it('リセットすると全進行がクリアされる', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      useCase.completeStage('1-2', 'player', createTestMatchStats());
      useCase.resetProgress();
      const progress = useCase.loadProgress();
      expect(progress.clearedStages).toEqual([]);
    });

    it('リセットするとストレージの進行もクリアされる', () => {
      useCase.completeStage('1-1', 'player', createTestMatchStats());
      useCase.resetProgress();
      const saved = storage.loadStoryProgress();
      expect(saved.clearedStages).toEqual([]);
    });
  });
});
