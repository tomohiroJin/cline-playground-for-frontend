/**
 * フリー対戦ユースケースのテスト
 */
import { FreeBattleUseCase } from './free-battle';
import { InMemoryStorageAdapter } from '../../__tests__/helpers/in-memory-storage';
import { createEventDispatcher } from '../../domain/events/game-events';
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { GameEvent, GameEventDispatcher } from '../../domain/events/game-events';
import type { MatchStatsData } from '../../domain/models/match-stats';
import { MatchStats } from '../../domain/models/match-stats';
import { FIELDS } from '../../core/config';

const createTestMatchStats = (overrides?: Partial<MatchStatsData>): MatchStatsData => ({
  ...MatchStats.create(),
  ...overrides,
});

describe('FreeBattleUseCase', () => {
  let storage: GameStoragePort;
  let dispatcher: GameEventDispatcher;
  let useCase: FreeBattleUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    dispatcher = createEventDispatcher();
    useCase = new FreeBattleUseCase(storage, dispatcher);
  });

  describe('createGameConfig', () => {
    it('難易度とフィールドに基づいてゲーム設定を生成できる', () => {
      const config = useCase.createGameConfig('normal', FIELDS[0], 7);
      expect(config.difficulty).toBe('normal');
      expect(config.field.id).toBe('classic');
      expect(config.winScore).toBe(7);
    });

    it('AI設定が難易度に対応したプリセットになる', () => {
      const easyConfig = useCase.createGameConfig('easy', FIELDS[0], 3);
      const hardConfig = useCase.createGameConfig('hard', FIELDS[0], 3);
      expect(easyConfig.aiConfig.maxSpeed).toBeLessThan(hardConfig.aiConfig.maxSpeed);
    });
  });

  describe('completeGame', () => {
    it('プレイヤーが勝利するとアンロック状態が更新される', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      const result = useCase.completeGame(config, 'player', createTestMatchStats());
      expect(result).toBeDefined();
      expect(result.newUnlocks).toBeDefined();
    });

    it('勝利するとtotalWinsが加算される', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      useCase.completeGame(config, 'player', createTestMatchStats());
      const unlockState = storage.loadUnlockState();
      expect(unlockState.totalWins).toBe(1);
    });

    it('敗北してもtotalWinsは加算されない', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      useCase.completeGame(config, 'cpu', createTestMatchStats());
      const unlockState = storage.loadUnlockState();
      expect(unlockState.totalWins).toBe(0);
    });

    it('3勝でpillarsフィールドがアンロックされる', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      for (let i = 0; i < 3; i++) {
        useCase.completeGame(config, 'player', createTestMatchStats());
      }
      const unlockState = storage.loadUnlockState();
      expect(unlockState.unlockedFields).toContain('pillars');
    });

    it('実績判定が実行され新規実績が返される', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      const result = useCase.completeGame(config, 'player', createTestMatchStats(), { player: 3, cpu: 1 });
      // 初勝利実績が解除されるはず
      expect(result.achievements).toContain('first_win');
    });

    it('実スコアが実績判定に反映される（パーフェクト判定）', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      // 無失点で勝利 → パーフェクト実績
      const result = useCase.completeGame(config, 'player', createTestMatchStats(), { player: 3, cpu: 0 });
      expect(result.achievements).toContain('perfect');
    });

    it('失点ありの勝利ではパーフェクト実績が解除されない', () => {
      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      const result = useCase.completeGame(config, 'player', createTestMatchStats(), { player: 3, cpu: 2 });
      expect(result.achievements).not.toContain('perfect');
    });

    it('実績解除時にACHIEVEMENT_UNLOCKEDイベントが発行される', () => {
      const events: GameEvent[] = [];
      dispatcher.subscribe(event => events.push(event));

      const config = useCase.createGameConfig('easy', FIELDS[0], 3);
      useCase.completeGame(config, 'player', createTestMatchStats(), { player: 3, cpu: 0 });

      const achievementEvents = events.filter(e => e.type === 'ACHIEVEMENT_UNLOCKED');
      expect(achievementEvents.length).toBeGreaterThanOrEqual(1);
    });
  });
});
