import { DomainCpuAI } from './ai';
import { DOMAIN_AI_BEHAVIOR_PRESETS } from '../constants/ai-presets';

describe('AI ドメインサービス', () => {
  // 乱数を固定してテストの決定性を保証する
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createGame = (overrides = {}) => ({
    player: { x: 225, y: 830, vx: 0, vy: 0 },
    cpu: { x: 225, y: 80, vx: 0, vy: 0 },
    pucks: [{ x: 225, y: 450, vx: 0, vy: -3, visible: true, invisibleCount: 0 }],
    items: [],
    effects: {
      player: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
      cpu: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
    },
    flash: null,
    goalEffect: null,
    lastItemSpawn: 0,
    cpuTarget: null,
    cpuTargetTime: 0,
    cpuStuckTimer: 0,
    fever: { active: false, lastGoalTime: 0, extraPucks: 0 },
    particles: [],
    obstacleStates: [],
    combo: { count: 0, lastScorer: undefined },
    ...overrides,
  });

  describe('calculateTargetWithBehavior', () => {
    it('パックが CPU 側に向かっている場合にターゲットを計算する', () => {
      const game = createGame();
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.easy;
      const target = DomainCpuAI.calculateTargetWithBehavior(game, config, Date.now());
      expect(target.x).toBeDefined();
      expect(target.y).toBeDefined();
    });

    it('固定乱数でターゲット計算が決定的になる', () => {
      const game = createGame();
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.easy;
      const now = 1000;
      const target1 = DomainCpuAI.calculateTargetWithBehavior(game, config, now);
      const target2 = DomainCpuAI.calculateTargetWithBehavior(game, config, now);
      expect(target1.x).toBe(target2.x);
      expect(target1.y).toBe(target2.y);
    });
  });

  describe('updateWithBehavior', () => {
    it('CPU マレットの位置を更新する', () => {
      const game = createGame();
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.normal;
      const result = DomainCpuAI.updateWithBehavior(game, config, Date.now());
      // skipRate が 0 なので必ず結果が返る
      expect(result).not.toBeNull();
      expect(result!.cpu).toBeDefined();
    });

    it('skipRate > 0 でランダム値が閾値以上なら結果を返す', () => {
      // Math.random() = 0.5、skipRate = 0.05 → 0.5 >= 0.05 なのでスキップしない
      const game = createGame();
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.easy; // skipRate: 0.05
      const result = DomainCpuAI.updateWithBehavior(game, config, Date.now());
      expect(result).not.toBeNull();
    });
  });
});
