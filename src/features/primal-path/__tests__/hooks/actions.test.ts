/**
 * 原始進化録 - PRIMAL PATH - アクション型ガードテスト
 */
import {
  isBattleAction,
  isEvolutionAction,
  isEventAction,
  isProgressionAction,
  isMetaAction,
} from '../../hooks/actions';
import type { GameAction } from '../../hooks/actions';

describe('アクション型ガード', () => {
  describe('isBattleAction', () => {
    const battleTypes = [
      'BATTLE_TICK',
      'AFTER_BATTLE',
      'USE_SKILL',
      'CHANGE_SPEED',
      'SURRENDER',
      'FINAL_BOSS_KILLED',
    ] as const;

    it.each(battleTypes)('%s を戦闘アクションとして判定する', (type) => {
      // Arrange
      const action = { type } as GameAction;

      // Act & Assert
      expect(isBattleAction(action)).toBe(true);
    });

    it('戦闘以外のアクションは false を返す', () => {
      // Arrange
      const action = { type: 'GO_DIFF' } as GameAction;

      // Act & Assert
      expect(isBattleAction(action)).toBe(false);
    });
  });

  describe('isEvolutionAction', () => {
    const evolutionTypes = [
      'SELECT_EVO',
      'SKIP_EVO',
      'SHOW_EVO',
      'PROCEED_AFTER_AWK',
      'PROCEED_TO_BATTLE',
    ] as const;

    it.each(evolutionTypes)('%s を進化アクションとして判定する', (type) => {
      const action = { type } as GameAction;
      expect(isEvolutionAction(action)).toBe(true);
    });

    it('進化以外のアクションは false を返す', () => {
      const action = { type: 'BATTLE_TICK' } as GameAction;
      expect(isEvolutionAction(action)).toBe(false);
    });
  });

  describe('isEventAction', () => {
    const eventTypes = [
      'TRIGGER_EVENT',
      'CHOOSE_EVENT',
      'APPLY_EVENT_RESULT',
    ] as const;

    it.each(eventTypes)('%s をイベントアクションとして判定する', (type) => {
      const action = { type } as GameAction;
      expect(isEventAction(action)).toBe(true);
    });

    it('イベント以外のアクションは false を返す', () => {
      const action = { type: 'START_RUN' } as GameAction;
      expect(isEventAction(action)).toBe(false);
    });
  });

  describe('isProgressionAction', () => {
    const progressionTypes = [
      'START_RUN',
      'START_CHALLENGE',
      'GO_DIFF',
      'GO_HOW',
      'GO_TREE',
      'PREPARE_BIOME_SELECT',
      'PICK_BIOME',
      'GO_FINAL_BOSS',
      'BIOME_CLEARED',
      'SET_PHASE',
    ] as const;

    it.each(progressionTypes)('%s を進行アクションとして判定する', (type) => {
      const action = { type } as GameAction;
      expect(isProgressionAction(action)).toBe(true);
    });

    it('進行以外のアクションは false を返す', () => {
      const action = { type: 'BATTLE_TICK' } as GameAction;
      expect(isProgressionAction(action)).toBe(false);
    });
  });

  describe('isMetaAction', () => {
    const metaTypes = [
      'GAME_OVER',
      'RETURN_TO_TITLE',
      'BUY_TREE_NODE',
      'RESET_SAVE',
      'LOAD_SAVE',
      'LOAD_META',
      'RECORD_RUN_END',
      'REVIVE_ALLY',
      'SKIP_REVIVE',
      'ENDLESS_CONTINUE',
      'ENDLESS_RETIRE',
    ] as const;

    it.each(metaTypes)('%s をメタアクションとして判定する', (type) => {
      const action = { type } as GameAction;
      expect(isMetaAction(action)).toBe(true);
    });

    it('メタ以外のアクションは false を返す', () => {
      const action = { type: 'BATTLE_TICK' } as GameAction;
      expect(isMetaAction(action)).toBe(false);
    });
  });

  describe('全アクションの網羅性', () => {
    it('すべてのアクションがいずれかのグループに属する', () => {
      // 全アクションタイプのリスト
      const allTypes: GameAction['type'][] = [
        'LOAD_SAVE', 'START_RUN', 'PICK_BIOME', 'SELECT_EVO',
        'PROCEED_AFTER_AWK', 'PROCEED_TO_BATTLE', 'BATTLE_TICK',
        'CHANGE_SPEED', 'SURRENDER', 'AFTER_BATTLE', 'BIOME_CLEARED',
        'GO_FINAL_BOSS', 'FINAL_BOSS_KILLED', 'GAME_OVER',
        'RETURN_TO_TITLE', 'GO_DIFF', 'GO_HOW', 'GO_TREE',
        'BUY_TREE_NODE', 'REVIVE_ALLY', 'SKIP_REVIVE', 'SHOW_EVO',
        'RESET_SAVE', 'SET_PHASE', 'PREPARE_BIOME_SELECT', 'USE_SKILL',
        'TRIGGER_EVENT', 'CHOOSE_EVENT', 'APPLY_EVENT_RESULT',
        'LOAD_META', 'RECORD_RUN_END', 'START_CHALLENGE', 'SKIP_EVO',
        'ENDLESS_CONTINUE', 'ENDLESS_RETIRE',
      ];

      for (const type of allTypes) {
        const action = { type } as GameAction;
        const classified =
          isBattleAction(action) ||
          isEvolutionAction(action) ||
          isEventAction(action) ||
          isProgressionAction(action) ||
          isMetaAction(action);
        expect(classified).toBe(true);
      }
    });
  });
});
