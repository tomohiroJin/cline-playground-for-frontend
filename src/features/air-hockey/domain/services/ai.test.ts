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

    it('skipRate > 0 でランダム値が閾値未満なら undefined を返す', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.01);
      const game = createGame();
      const config = { ...DOMAIN_AI_BEHAVIOR_PRESETS.easy, skipRate: 0.05 };
      const result = DomainCpuAI.updateWithBehavior(game, config, Date.now());
      expect(result).toBeUndefined();
    });

    it('CPU がフィールド端にいる場合、中央に戻るターゲットを計算する', () => {
      const game = createGame({
        cpu: { x: 10, y: 80, vx: 0, vy: 0 },
      });
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.normal;
      const target = DomainCpuAI.calculateTargetWithBehavior(game, config, Date.now());
      // フィールド端にいるとき中央に戻る
      expect(target.x).toBe(225);
      expect(target.y).toBe(80);
    });

    it('乱数生成器を注入してターゲットを計算できる', () => {
      const game = createGame();
      const config = { ...DOMAIN_AI_BEHAVIOR_PRESETS.easy, wobble: 10 };
      const fixedRandom = () => 0.3;
      const target = DomainCpuAI.calculateTargetWithBehavior(
        game, config, 1000, { random: fixedRandom }
      );
      expect(target.x).toBeDefined();
      expect(target.y).toBeDefined();
    });

    it('wallBounce 有効時に予測位置が壁で反射する', () => {
      const game = createGame({
        pucks: [{ x: 400, y: 200, vx: 10, vy: -5, visible: true, invisibleCount: 0 }],
      });
      const config = { ...DOMAIN_AI_BEHAVIOR_PRESETS.hard, wallBounce: true };
      const target = DomainCpuAI.calculateTargetWithBehavior(game, config, Date.now());
      // 壁で反射した予測位置がフィールド内にある
      expect(target.x).toBeGreaterThan(0);
      expect(target.x).toBeLessThan(450);
    });

    it('predictionFactor が高い場合、パックがない方向でも待機位置を返す', () => {
      const game = createGame({
        pucks: [{ x: 225, y: 600, vx: 0, vy: 5, visible: true, invisibleCount: 0 }],
      });
      const config = { ...DOMAIN_AI_BEHAVIOR_PRESETS.hard, predictionFactor: 12 };
      const target = DomainCpuAI.calculateTargetWithBehavior(game, config, Date.now());
      // パックが離れているときは中央付近で待機
      expect(target.x).toBe(225);
      expect(target.y).toBe(60);
    });

    it('スタック検知：2秒以上ほぼ動かない場合に中央にリセットする', () => {
      const now = 10000;
      const game = createGame({
        cpu: { x: 225, y: 80, vx: 0, vy: 0 },
        cpuTarget: { x: 225, y: 80 },
        cpuTargetTime: now,
        cpuStuckTimer: now - 3000, // 3秒前からスタック
      });
      const config = DOMAIN_AI_BEHAVIOR_PRESETS.normal;
      const result = DomainCpuAI.updateWithBehavior(game, config, now);
      expect(result).not.toBeNull();
      // スタックリセット後は中央に移動
      expect(result!.cpu.x).toBe(225);
      expect(result!.cpu.y).toBe(80);
    });
  });
});
