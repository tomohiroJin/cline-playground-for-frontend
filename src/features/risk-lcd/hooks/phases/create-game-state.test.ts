import { createGameState } from './create-game-state';

// テスト用の最小限 StoreApi モック
function createMockStore(overrides: {
  unlocks?: string[];
} = {}) {
  const unlocks = overrides.unlocks ?? [];
  return {
    data: {
      eq: ['standard'],
      sty: ['standard'],
      pts: 0,
      plays: 0,
      best: 0,
      unlocks,
      tutorialDone: false,
      dailyId: '',
      dailyBest: 0,
      dailyPlays: 0,
    },
    hasUnlock: (id: string) => unlocks.includes(id),
  } as unknown as ReturnType<typeof import('../useStore').useStore>;
}

describe('createGameState', () => {
  describe('通常モード', () => {
    it('基本的な初期状態を生成する', () => {
      // Arrange
      const store = createMockStore();

      // Act
      const g = createGameState(['standard'], store, 'normal');

      // Assert
      expect(g.alive).toBe(true);
      expect(g.score).toBe(0);
      expect(g.stage).toBe(0);
      expect(g.cycle).toBe(0);
      expect(g.lane).toBe(1);
      expect(g.phase).toBe('idle');
      expect(g.dailyMode).toBe(false);
      expect(g.practiceMode).toBe(false);
    });

    it('デフォルトの最大ステージは4', () => {
      const store = createMockStore();

      const g = createGameState(['standard'], store);

      expect(g.maxStg).toBe(4);
    });
  });

  describe('デイリーモード', () => {
    it('dailyMode が true になる', () => {
      const store = createMockStore();

      const g = createGameState(['standard'], store, 'daily');

      expect(g.dailyMode).toBe(true);
      expect(g.practiceMode).toBe(false);
    });
  });

  describe('プラクティスモード', () => {
    it('practiceMode が true、maxStg が 0 になる', () => {
      const store = createMockStore();

      const g = createGameState(['standard'], store, 'practice');

      expect(g.practiceMode).toBe(true);
      expect(g.maxStg).toBe(0);
    });
  });

  describe('アンロック条件', () => {
    it('stage6 アンロックで最大ステージが5になる', () => {
      const store = createMockStore({ unlocks: ['stage6'] });

      const g = createGameState(['standard'], store, 'normal');

      expect(g.maxStg).toBe(5);
    });

    it('oracle アンロックで bfAdj が -2 になる', () => {
      const store = createMockStore({ unlocks: ['oracle'] });

      const g = createGameState(['standard'], store);

      expect(g.bfAdj).toBe(-2);
    });

    it('oracle 未アンロックで bfAdj が 0', () => {
      const store = createMockStore();

      const g = createGameState(['standard'], store);

      expect(g.bfAdj).toBe(0);
    });

    it('score_base アンロックで baseBonus が 5 になる', () => {
      const store = createMockStore({ unlocks: ['score_base'] });

      const g = createGameState(['standard'], store);

      expect(g.baseBonus).toBe(5);
    });

    it('score_base 未アンロックで baseBonus が 0', () => {
      const store = createMockStore();

      const g = createGameState(['standard'], store);

      expect(g.baseBonus).toBe(0);
    });
  });

  describe('初期値の独立性', () => {
    it('複数回呼び出しても配列が共有されない', () => {
      const store = createMockStore();

      const g1 = createGameState(['standard'], store);
      const g2 = createGameState(['standard'], store);

      // 配列が別インスタンスであること
      expect(g1.st.mu).not.toBe(g2.st.mu);
      expect(g1.st.bfSet).not.toBe(g2.st.bfSet);
      expect(g1.curBf0).not.toBe(g2.curBf0);
      expect(g1.ghostLog).not.toBe(g2.ghostLog);
    });
  });
});
