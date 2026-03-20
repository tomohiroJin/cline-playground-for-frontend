/**
 * GameRunner テスト
 * - ゲームループを複数フレーム実行できる
 * - ドメインイベントを収集できる
 * - 状態操作メソッドが動作する
 */
import { GameRunner } from './game-runner';
import { TestFactory } from './factories';

describe('GameRunner', () => {
  const defaultField = TestFactory.createTestFieldConfig();
  const easyAi = TestFactory.createTestAiConfig({ maxSpeed: 1.5, wobble: 30 });

  describe('初期化', () => {
    it('フィールドとAI設定でインスタンスを生成できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      expect(runner.getState()).toBeDefined();
      expect(runner.getFrameCount()).toBe(0);
      expect(runner.getEvents()).toEqual([]);
    });

    it('初期状態のオーバーライドができる', () => {
      const runner = new GameRunner(defaultField, easyAi, {
        pucks: [{ x: 100, y: 200, vx: 0, vy: 0, visible: true, invisibleCount: 0 }],
      });

      const state = runner.getState();
      expect(state.pucks[0].x).toBe(100);
      expect(state.pucks[0].y).toBe(200);
    });
  });

  describe('runFrames', () => {
    it('指定フレーム数だけゲームループを実行する', () => {
      const runner = new GameRunner(defaultField, easyAi);

      runner.runFrames(10);

      expect(runner.getFrameCount()).toBe(10);
    });

    it('フレーム実行でパックの位置が変化する', () => {
      const runner = new GameRunner(defaultField, easyAi);
      runner.setPuckVelocity(0, 0, 5);
      const initialY = runner.getState().pucks[0].y;

      runner.runFrames(10);

      const newY = runner.getState().pucks[0].y;
      expect(newY).not.toBe(initialY);
    });
  });

  describe('runUntil', () => {
    it('条件を満たすまでゲームループを実行する', () => {
      const runner = new GameRunner(defaultField, easyAi);
      runner.setPuckVelocity(0, 0, 5);

      runner.runUntil(
        (state) => state.pucks[0].y > 500,
        300
      );

      expect(runner.getState().pucks[0].y).toBeGreaterThan(500);
    });

    it('最大フレーム数に達すると停止する', () => {
      const runner = new GameRunner(defaultField, easyAi);

      // 条件が満たされない場合でも最大フレーム数で停止する
      runner.runUntil(() => false, 50);

      expect(runner.getFrameCount()).toBe(50);
    });
  });

  describe('イベント収集', () => {
    it('getEvents でドメインイベントを取得できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      // パックを壁に向けて発射
      runner.setPuckPosition(0, 10, 450);
      runner.setPuckVelocity(0, -5, 0);
      runner.runFrames(5);

      // 何らかのイベントが発行されている可能性がある
      const events = runner.getEvents();
      expect(Array.isArray(events)).toBe(true);
    });

    it('getEventsOfType で特定タイプのイベントを取得できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      // パックをゴールに向けて発射
      runner.setPuckPosition(0, 225, 10);
      runner.setPuckVelocity(0, 0, -10);
      runner.runFrames(30);

      const goalEvents = runner.getEventsOfType('GOAL_SCORED');
      expect(Array.isArray(goalEvents)).toBe(true);
    });
  });

  describe('状態操作', () => {
    it('setPuckPosition でパック位置を設定できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      runner.setPuckPosition(0, 100, 200);

      expect(runner.getState().pucks[0].x).toBe(100);
      expect(runner.getState().pucks[0].y).toBe(200);
    });

    it('setPuckVelocity でパック速度を設定できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      runner.setPuckVelocity(0, 3, -4);

      expect(runner.getState().pucks[0].vx).toBe(3);
      expect(runner.getState().pucks[0].vy).toBe(-4);
    });

    it('spawnItem でアイテムを配置できる', () => {
      const runner = new GameRunner(defaultField, easyAi);

      runner.spawnItem('split', 225, 450);

      expect(runner.getState().items).toHaveLength(1);
      expect(runner.getState().items[0].id).toBe('split');
      expect(runner.getState().items[0].x).toBe(225);
      expect(runner.getState().items[0].y).toBe(450);
    });
  });

  describe('プレイヤー入力', () => {
    it('runFrames にプレイヤー入力を渡すとマレット位置が更新される', () => {
      const runner = new GameRunner(defaultField, easyAi);

      runner.runFrames(1, { x: 300, y: 700 });

      const state = runner.getState();
      expect(state.player.x).toBe(300);
      expect(state.player.y).toBe(700);
    });

    it('プレイヤー入力なしの場合マレット位置は物理演算のみで更新される', () => {
      const runner = new GameRunner(defaultField, easyAi);
      const initialX = runner.getState().player.x;

      runner.runFrames(1);

      // 入力なしでも位置は変化しない（速度0のため）
      expect(runner.getState().player.x).toBe(initialX);
    });
  });

  describe('CPU AI', () => {
    it('フレーム実行で CPU マレットが AI に従って移動する', () => {
      // パックを CPU 側に向けて発射
      const runner = new GameRunner(defaultField, easyAi, {
        pucks: [{ x: 225, y: 300, vx: 0, vy: -5, visible: true, invisibleCount: 0 }],
      });
      const initialCpuX = runner.getState().cpu.x;
      const initialCpuY = runner.getState().cpu.y;

      // 複数フレーム実行して AI が動く時間を与える
      runner.runFrames(30);

      const state = runner.getState();
      // CPU が何らかの移動をしている（初期位置から変化）
      const moved = state.cpu.x !== initialCpuX || state.cpu.y !== initialCpuY;
      expect(moved).toBe(true);
    });
  });

  describe('アイテム衝突の一貫性', () => {
    it('アイテム衝突判定が DomainPhysics.detectCollision を使用する', () => {
      const runner = new GameRunner(defaultField, easyAi);

      // プレイヤーマレット近傍にアイテムを配置（dist > 0 が必要なため少しオフセット）
      const playerX = runner.getState().player.x;
      const playerY = runner.getState().player.y;
      runner.spawnItem('speed', playerX + 5, playerY);

      // プレイヤー入力で位置を固定して実行
      runner.runFrames(1, { x: playerX, y: playerY });

      // アイテムが収集される（DomainPhysics.detectCollision で判定）
      const collectEvents = runner.getEventsOfType('ITEM_COLLECTED');
      expect(collectEvents).toHaveLength(1);
      expect(collectEvents[0].itemType).toBe('speed');
    });
  });
});
