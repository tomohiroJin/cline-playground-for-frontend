/**
 * アイテムライフサイクル統合テスト
 * - GameRunner を使ってアイテムの配置・収集・イベント発行を検証
 */
import { GameRunner } from '../helpers/game-runner';
import { TestFactory } from '../helpers/factories';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';

const { CANVAS_WIDTH, MALLET_RADIUS } = PHYSICS_CONSTANTS;

/** テスト用の GameRunner を生成する */
const createRunner = (initialState?: Parameters<typeof TestFactory.createTestGameState>[0]) => {
  const field = TestFactory.createTestFieldConfig();
  const aiConfig = TestFactory.createTestAiConfig();
  const state = initialState ? TestFactory.createTestGameState(initialState) : undefined;
  return new GameRunner(field, aiConfig, state);
};

describe('アイテムライフサイクル', () => {
  it('アイテムを配置してマレット接触で ITEM_COLLECTED イベントが発行される', () => {
    // Arrange: プレイヤーマレットの位置にアイテムを配置
    const playerX = CANVAS_WIDTH / 2;
    const playerY = 830;
    const runner = createRunner({
      player: { x: playerX, y: playerY, vx: 0, vy: 0 },
    });

    // アイテムをマレットの接触範囲内に配置
    runner.spawnItem('speed', playerX, playerY + MALLET_RADIUS);

    // Act: 1フレーム実行してアイテム衝突判定を行う
    runner.runFrames(1);

    // Assert: ITEM_COLLECTED イベントが発行される
    const collectedEvents = runner.getEventsOfType('ITEM_COLLECTED');
    expect(collectedEvents.length).toBe(1);
    expect(collectedEvents[0].itemType).toBe('speed');
    expect(collectedEvents[0].collector).toBe('player');

    // アイテムがフィールドから除去されている
    const state = runner.getState();
    expect(state.items.length).toBe(0);
  });

  it('複数アイテムを配置して個別に収集できる', () => {
    // Arrange: プレイヤーマレットの近くと遠くにアイテムを配置
    const playerX = CANVAS_WIDTH / 2;
    const playerY = 830;
    const runner = createRunner({
      player: { x: playerX, y: playerY, vx: 0, vy: 0 },
    });

    // 近いアイテム（マレット接触範囲内）
    runner.spawnItem('speed', playerX, playerY + MALLET_RADIUS);
    // 遠いアイテム（マレット接触範囲外）
    runner.spawnItem('shield', playerX, 300);

    // Act: 1フレーム実行
    runner.runFrames(1);

    // Assert: 近いアイテムのみ収集される
    const collectedEvents = runner.getEventsOfType('ITEM_COLLECTED');
    expect(collectedEvents.length).toBe(1);
    expect(collectedEvents[0].itemType).toBe('speed');

    // 遠いアイテムはまだフィールドに残っている
    const state = runner.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].id).toBe('shield');
  });

  describe('エフェクト適用', () => {
    it('Shield アイテム収集でプレイヤーにシールドが適用される', () => {
      // Arrange
      const playerX = CANVAS_WIDTH / 2;
      const playerY = 830;
      const runner = createRunner({
        player: { x: playerX, y: playerY, vx: 0, vy: 0 },
      });
      runner.spawnItem('shield', playerX + 5, playerY);

      // Act
      runner.runFrames(1, { x: playerX, y: playerY });

      // Assert: プレイヤーにシールドが適用されている
      const state = runner.getState();
      expect(state.effects.player.shield).toBe(true);
    });

    it('Speed アイテム収集で速度エフェクトが適用される', () => {
      // Arrange
      const playerX = CANVAS_WIDTH / 2;
      const playerY = 830;
      const runner = createRunner({
        player: { x: playerX, y: playerY, vx: 0, vy: 0 },
      });
      runner.spawnItem('speed', playerX + 5, playerY);

      // Act
      runner.runFrames(1, { x: playerX, y: playerY });

      // Assert: 速度エフェクトが適用されている
      const state = runner.getState();
      expect(state.effects.player.speed).not.toBeNull();
      expect(state.effects.player.speed!.duration).toBe(8000);
    });

    it('Invisible アイテム収集で不可視エフェクトが適用される', () => {
      // Arrange
      const playerX = CANVAS_WIDTH / 2;
      const playerY = 830;
      const runner = createRunner({
        player: { x: playerX, y: playerY, vx: 0, vy: 0 },
      });
      runner.spawnItem('invisible', playerX + 5, playerY);

      // Act
      runner.runFrames(1, { x: playerX, y: playerY });

      // Assert
      const state = runner.getState();
      expect(state.effects.player.invisible).toBe(5);
    });
  });
});
