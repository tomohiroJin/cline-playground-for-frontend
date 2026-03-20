/**
 * 障害物ライフサイクル統合テスト
 * - パックが障害物に衝突するとHPが減少する
 * - HPが0になると障害物が破壊される
 * - 破壊された障害物がリスポーン時間後に復活する
 */
import { GameRunner } from '../helpers/game-runner';
import { TestFactory } from '../helpers/factories';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';

const { PUCK_RADIUS } = PHYSICS_CONSTANTS;

describe('障害物ライフサイクル統合テスト', () => {
  // fortress フィールド（破壊可能な障害物あり）
  const fortressField = TestFactory.createTestFieldConfig({
    id: 'fortress',
    goalSize: 105,
    color: '#ff4488',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      { x: 225, y: 450, r: 21 }, // 中央に1つだけ配置
    ],
  });
  const easyAi = TestFactory.createTestAiConfig();

  it('パックが障害物に衝突するとHPが減少する', () => {
    // Arrange: パックを障害物に向けて発射
    const runner = new GameRunner(fortressField, easyAi, { winScore: 10 });
    const obstacleX = 225;
    const obstacleY = 450;
    const obstacleR = 21;

    runner.setPuckPosition(0, obstacleX, obstacleY - obstacleR - PUCK_RADIUS - 5);
    runner.setPuckVelocity(0, 0, 10);

    // Act
    runner.runFrames(20);

    // Assert: HP が初期値(3)から減少している
    const state = runner.getState();
    expect(state.obstacleStates.length).toBe(1);
    expect(state.obstacleStates[0].hp).toBeLessThan(3);
  });

  it('HPが0になると障害物が破壊される', () => {
    // Arrange: 障害物の HP を 1 にして衝突させる
    const runner = new GameRunner(fortressField, easyAi, { winScore: 10 });

    // setObstacleState で初期HPを1に設定（直接 state 変更を避ける）
    runner.setObstacleState(0, { hp: 1, maxHp: 3, destroyed: false, destroyedAt: 0 });

    const obstacleX = 225;
    const obstacleY = 450;
    const obstacleR = 21;

    runner.setPuckPosition(0, obstacleX, obstacleY - obstacleR - PUCK_RADIUS - 5);
    runner.setPuckVelocity(0, 0, 10);

    // Act
    runner.runFrames(20);

    // Assert: 障害物が破壊されている
    const newState = runner.getState();
    expect(newState.obstacleStates[0].destroyed).toBe(true);
    expect(newState.obstacleStates[0].hp).toBe(0);

    // OBSTACLE_DESTROYED イベントが発行されている
    const destroyEvents = runner.getEventsOfType('OBSTACLE_DESTROYED');
    expect(destroyEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('破壊された障害物がリスポーン時間後に復活する', () => {
    // Arrange: setObstacleState で障害物を破壊済み状態に設定
    const runner = new GameRunner(fortressField, easyAi, { winScore: 10 });
    runner.setObstacleState(0, {
      hp: 0,
      maxHp: 3,
      destroyed: true,
      destroyedAt: 0, // フレーム0で破壊
    });

    // Act: リスポーン時間（5000ms = 約312フレーム @16ms）以上実行
    // 16ms/フレームなので 5000/16 ≈ 313 フレーム
    runner.runFrames(320);

    // Assert: 障害物が復活している
    const newState = runner.getState();
    expect(newState.obstacleStates[0].destroyed).toBe(false);
    expect(newState.obstacleStates[0].hp).toBe(3);
  });
});
