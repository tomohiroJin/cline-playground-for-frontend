/**
 * ゲームフロー統合テスト
 * - GameRunner を使ってゴール判定・衝突・イベント発行を検証
 *
 * フレーム上限の根拠:
 * - dt=1 の固定タイムステップで速度15のパックは 1フレームで15px移動
 * - ゴールまでの距離は最大約900px → 60フレームで到達可能
 * - 余裕を持って maxFrames=100 を設定
 */
import { GameRunner } from '../helpers/game-runner';
import { TestFactory } from '../helpers/factories';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PUCK_RADIUS, MALLET_RADIUS } = PHYSICS_CONSTANTS;

/** テスト用の GameRunner を生成する */
const createRunner = (initialState?: Parameters<typeof TestFactory.createTestGameState>[0]) => {
  const field = TestFactory.createTestFieldConfig();
  const aiConfig = TestFactory.createTestAiConfig();
  const state = initialState ? TestFactory.createTestGameState(initialState) : undefined;
  return new GameRunner(field, aiConfig, state);
};

describe('ゲームフロー統合テスト', () => {
  describe('ゴール判定', () => {
    it('パックがプレイヤー側ゴールに入るとCPUにスコアが加算される', () => {
      // Arrange: パックをゴール手前に配置し、下方向に高速移動
      const runner = createRunner();
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - PUCK_RADIUS - 10);
      runner.setPuckVelocity(0, 0, 15);

      // Act: ゴールに到達するまで実行
      runner.runUntil((_state) => {
        const score = runner.getScore();
        return score.cpu > 0;
      }, 100);

      // Assert: CPU のスコアが1加算される
      const score = runner.getScore();
      expect(score.cpu).toBe(1);
      expect(score.player).toBe(0);

      const goalEvents = runner.getEventsOfType('GOAL_SCORED');
      expect(goalEvents.length).toBe(1);
      expect(goalEvents[0].scorer).toBe('cpu');
    });

    it('パックがCPU側ゴールに入るとプレイヤーにスコアが加算される', () => {
      // Arrange: パックをCPU側ゴール手前に配置し、上方向に高速移動
      const runner = createRunner();
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 10);
      runner.setPuckVelocity(0, 0, -15);

      // Act: ゴールに到達するまで実行
      runner.runUntil(() => {
        const score = runner.getScore();
        return score.player > 0;
      }, 100);

      // Assert: プレイヤーのスコアが1加算される
      const score = runner.getScore();
      expect(score.player).toBe(1);
      expect(score.cpu).toBe(0);

      const goalEvents = runner.getEventsOfType('GOAL_SCORED');
      expect(goalEvents.length).toBe(1);
      expect(goalEvents[0].scorer).toBe('player');
    });

    it('ゴール後にパックが中央にリセットされる', () => {
      // Arrange: パックをゴール手前に配置
      const runner = createRunner();
      runner.setPuckPosition(0, CANVAS_WIDTH / 2, CANVAS_HEIGHT - PUCK_RADIUS - 10);
      runner.setPuckVelocity(0, 0, 15);

      // Act: ゴールが入るまで実行
      runner.runUntil(() => runner.getScore().cpu > 0, 100);

      // Assert: パックが中央付近にリセットされている
      const state = runner.getState();
      const puck = state.pucks[0];
      expect(puck.x).toBe(CANVAS_WIDTH / 2);
      expect(puck.y).toBe(CANVAS_HEIGHT / 2);
    });
  });

  describe('衝突', () => {
    it('マレットとパックが衝突するとパックが反射する', () => {
      // Arrange: パックをプレイヤーマレットの直前に配置し、マレットに向かって移動
      const playerY = 830;
      const runner = createRunner({
        player: { x: CANVAS_WIDTH / 2, y: playerY, vx: 0, vy: 0 },
        pucks: [{
          x: CANVAS_WIDTH / 2,
          y: playerY - MALLET_RADIUS - PUCK_RADIUS - 2,
          vx: 0,
          vy: 5,
          visible: true,
          invisibleCount: 0,
        }],
      });

      // Act: 数フレーム実行して衝突を発生させる
      runner.runFrames(10);

      // Assert: COLLISION イベントが発行されている
      const collisionEvents = runner.getEventsOfType('COLLISION');
      expect(collisionEvents.length).toBeGreaterThanOrEqual(1);
      expect(collisionEvents[0].objectB).toBe('player');
    });

    it('壁に衝突するとパックが反射しWALL_BOUNCEイベントが発行される', () => {
      // Arrange: パックを左壁付近に配置し、左方向に移動
      const runner = createRunner();
      runner.setPuckPosition(0, PUCK_RADIUS + 10, CANVAS_HEIGHT / 2);
      runner.setPuckVelocity(0, -10, 0);

      // Act: 数フレーム実行して壁バウンスを発生させる
      runner.runFrames(5);

      // Assert: WALL_BOUNCE イベントが発行される
      const wallEvents = runner.getEventsOfType('WALL_BOUNCE');
      expect(wallEvents.length).toBeGreaterThanOrEqual(1);

      // パックの速度が反転（右方向）していることを確認
      const state = runner.getState();
      expect(state.pucks[0].vx).toBeGreaterThan(0);
    });

    it('衝突時の速度に応じたCOLLISIONイベントが発行される', () => {
      // Arrange: パックを高速でマレットに衝突させる
      const playerY = 830;
      const initialSpeed = 8;
      const runner = createRunner({
        player: { x: CANVAS_WIDTH / 2, y: playerY, vx: 0, vy: 0 },
        pucks: [{
          x: CANVAS_WIDTH / 2,
          y: playerY - MALLET_RADIUS - PUCK_RADIUS - 2,
          vx: 0,
          vy: initialSpeed,
          visible: true,
          invisibleCount: 0,
        }],
      });

      // Act: 衝突が発生するまで実行
      runner.runFrames(10);

      // Assert: COLLISION イベントの speed が記録されている
      const collisionEvents = runner.getEventsOfType('COLLISION');
      expect(collisionEvents.length).toBeGreaterThanOrEqual(1);
      expect(collisionEvents[0].speed).toBeGreaterThan(0);
    });
  });

  describe('フェーズ遷移', () => {
    it('勝利スコアに達するとフェーズが finished に遷移する', () => {
      // Arrange: winScore=2 で短いゲーム
      const field = TestFactory.createTestFieldConfig();
      const aiConfig = TestFactory.createTestAiConfig();
      const runner = new GameRunner(field, aiConfig, { winScore: 2 });

      // Act: プレイヤーが2回連続ゴール
      for (let i = 0; i < 2; i++) {
        runner.setPuckPosition(0, CANVAS_WIDTH / 2, PUCK_RADIUS + 5);
        runner.setPuckVelocity(0, 0, -15);
        runner.runUntil(() => runner.getScore().player > i, 100);
      }

      // Assert: フェーズが finished に遷移している
      const phaseEvents = runner.getEventsOfType('PHASE_CHANGED');
      const finishedEvent = phaseEvents.find(e => e.to === 'finished');
      expect(finishedEvent).toBeDefined();
      expect(runner.getPhase()).toBe('finished');
    });
  });
});
