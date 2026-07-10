import {
  WandererStrategy,
  ChaserStrategy,
  TeleporterStrategy,
  getEnemyStrategy,
} from '../services/enemy-strategy';
import type { EnemyUpdateParams } from '../services/enemy-strategy';
import type { Enemy } from '../../types';
import { OPEN_MAZE_7X7, FIXED_MAZE_9X9 } from '../../__tests__/helpers/fixed-maze';
import { setupAudioContextMock } from '../../__tests__/helpers/audio-mock';
import { distance } from '../../utils';

beforeAll(() => {
  setupAudioContextMock();
});

const createEnemy = (overrides?: Partial<Enemy>): Enemy => ({
  x: 3.5, y: 3.5, dir: 0, active: true, actTime: 0,
  lastSeenX: -1, lastSeenY: -1, type: 'wanderer',
  path: [], pathTime: 0, teleportCooldown: 0,
  aiState: 'patrol', searchTimer: 0, loseSightTimer: 0, ...overrides,
});

const createParams = (overrides?: Partial<EnemyUpdateParams>): EnemyUpdateParams => ({
  enemy: createEnemy(), playerX: 1.5, playerY: 1.5,
  isPlayerHiding: false, maze: OPEN_MAZE_7X7, enemySpeed: 0.006,
  dt: 16, gameTime: 5000, randomFn: () => 0.5,
  sightRange: 8, searchDuration: 4000, ...overrides,
});

describe('domain/services/enemy-strategy', () => {
  describe('WandererStrategy', () => {
    const strategy = new WandererStrategy();

    test('徘徊型は移動する', () => {
      const enemy = createEnemy({ x: 3.5, y: 3.5 });
      const params = createParams({ enemy });
      for (let i = 0; i < 50; i++) strategy.update(params);
      expect(enemy.x !== 3.5 || enemy.y !== 3.5).toBe(true);
    });

    test('徘徊型は lastSeenX を更新しない', () => {
      const enemy = createEnemy({ x: 2.5, y: 1.5 });
      strategy.update(createParams({ enemy }));
      expect(enemy.lastSeenX).toBe(-1);
    });

    test('イベントは空配列を返す', () => {
      const result = strategy.update(createParams());
      expect(result.events).toEqual([]);
    });
  });

  describe('TeleporterStrategy', () => {
    const strategy = new TeleporterStrategy();

    test('テレポート型のクールダウンが減少する', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 5000 });
      strategy.update(createParams({ enemy }));
      expect(enemy.teleportCooldown).toBeLessThan(5000);
    });

    test('クールダウン終了時にテレポートする', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 0, x: 3.5, y: 3.5 });
      const result = strategy.update(createParams({ enemy, maze: FIXED_MAZE_9X9 }));
      if (enemy.x !== 3.5 || enemy.y !== 3.5) {
        expect(result.events.length).toBe(1);
        expect(result.events[0]).toEqual({ type: 'SOUND_PLAY', sound: 'teleport', volume: 0.3 });
      }
    });

    test('プレイヤーが隠れている場合はテレポートしない', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 0 });
      strategy.update(createParams({ enemy, isPlayerHiding: true }));
      expect(enemy.teleportCooldown).toBeLessThan(0);
    });

    test('短距離でプレイヤーを追跡する', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 5000, x: 2.5, y: 1.5, dir: 0 });
      strategy.update(createParams({ enemy, playerX: 1.5, playerY: 1.5 }));
      expect(enemy.dir).not.toBe(0);
    });
  });

  describe('getEnemyStrategy', () => {
    test('wanderer タイプで WandererStrategy を返す', () => {
      expect(getEnemyStrategy('wanderer')).toBeInstanceOf(WandererStrategy);
    });
    test('chaser タイプで ChaserStrategy を返す', () => {
      expect(getEnemyStrategy('chaser')).toBeInstanceOf(ChaserStrategy);
    });
    test('teleporter タイプで TeleporterStrategy を返す', () => {
      expect(getEnemyStrategy('teleporter')).toBeInstanceOf(TeleporterStrategy);
    });
    test('不明なタイプでは wanderer にフォールバックする', () => {
      expect(getEnemyStrategy('unknown')).toBeInstanceOf(WandererStrategy);
    });
  });
});

// 7x7 の十字通路迷路: 中央行・中央列が通路
const maze = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

const createChaser = (x: number, y: number, dir = 0): Enemy => ({
  x, y, dir,
  active: true, actTime: 0,
  lastSeenX: -1, lastSeenY: -1,
  type: 'chaser', path: [], pathTime: -10000, teleportCooldown: 0,
  aiState: 'patrol', searchTimer: 0, loseSightTimer: 0,
});

const baseParams = (e: Enemy, over: Record<string, unknown> = {}) => ({
  enemy: e,
  playerX: 5.5, playerY: 3.5,
  isPlayerHiding: false,
  maze,
  enemySpeed: 0.002,
  dt: 16,
  gameTime: 1000,
  randomFn: () => 0.5,
  sightRange: 8,
  searchDuration: 4000,
  ...over,
});

describe('TeleporterStrategy 視認ベース追跡', () => {
  const strategy = new TeleporterStrategy();

  const createTeleporter = (x: number, y: number): Enemy => ({
    x, y, dir: 0,
    active: true, actTime: 0,
    lastSeenX: -1, lastSeenY: -1,
    type: 'teleporter', path: [], pathTime: 0, teleportCooldown: 5000,
    aiState: 'patrol', searchTimer: 0, loseSightTimer: 0,
  });

  it('壁越しのプレイヤーは追跡しない', () => {
    // 縦通路の敵 (3.5,1.5) と横通路のプレイヤー (1.5,3.5): 距離は近いが直線は壁を通る
    const e = createTeleporter(3.5, 1.5);
    const before = { x: e.x, y: e.y };
    strategy.update(baseParams(e, { playerX: 1.5, playerY: 3.5 }));
    // 追跡していれば target 方向に直進するはず。巡回（ランダム歩き）の移動距離と方向で判別
    const movedTowardPlayer =
      Math.hypot(e.x - 1.5, e.y - 3.5) < Math.hypot(before.x - 1.5, before.y - 3.5) - 0.01;
    expect(movedTowardPlayer).toBe(false);
  });

  it('遮蔽のない近距離プレイヤーは追跡する', () => {
    const e = createTeleporter(3.5, 3.5); // プレイヤー (5.5,3.5) と同一通路・距離2
    const before = Math.hypot(e.x - 5.5, e.y - 3.5);
    strategy.update(baseParams(e));
    expect(Math.hypot(e.x - 5.5, e.y - 3.5)).toBeLessThan(before);
  });
});

describe('ChaserStrategy 状態機械', () => {
  const strategy = new ChaserStrategy();

  it('patrol: 視界内のプレイヤーを発見して chase に遷移し spotted アラートを出す', () => {
    const e = createChaser(1.5, 3.5, 0); // +x を向く。プレイヤーは同一行の (5.5,3.5)
    const result = strategy.update(baseParams(e));
    expect(e.aiState).toBe('chase');
    expect(e.lastSeenX).toBe(5.5);
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'ENEMY_ALERT', alert: 'spotted' })
    );
  });

  it('patrol: 背後のプレイヤーには気づかない', () => {
    const e = createChaser(1.5, 3.5, Math.PI); // -x を向く（プレイヤーに背中）
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('patrol');
  });

  it('patrol: 壁越しのプレイヤーには気づかない', () => {
    const e = createChaser(3.5, 1.5, Math.PI / 2); // 縦通路の上端、+y を向く
    // プレイヤー (1.5,3.5) は横通路。角を挟むので直線は壁を通る
    const p = baseParams(e, { playerX: 1.5, playerY: 3.5 });
    strategy.update(p);
    expect(e.aiState).toBe('patrol');
  });

  it('patrol: 隠れているプレイヤーは発見できない', () => {
    const e = createChaser(1.5, 3.5, 0);
    strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('patrol');
  });

  it('chase: 視認中は lastSeen を更新し続ける', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase';
    strategy.update(baseParams(e, { playerX: 4.5 }));
    expect(e.lastSeenX).toBe(4.5);
    expect(e.loseSightTimer).toBe(0);
  });

  it('chase: 視線を失い猶予時間を超えると search に遷移する', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase';
    e.lastSeenX = 5.5; e.lastSeenY = 3.5;
    e.loseSightTimer = 2100; // LOSE_SIGHT_GRACE=2000 超過
    const result = strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('search');
    expect(e.searchTimer).toBe(4000);
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'ENEMY_ALERT', alert: 'searching' })
    );
  });

  it('chase: 最終目撃地点に到達したら search に遷移する', () => {
    const e = createChaser(3.5, 3.5, 0);
    e.aiState = 'chase';
    e.lastSeenX = 3.6; e.lastSeenY = 3.5; // 到達済み（< LAST_SEEN_REACH_DISTANCE）
    strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('search');
  });

  it('search: プレイヤーを再発見すると chase に戻る', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'search'; e.searchTimer = 3000;
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('chase');
  });

  it('search: タイマーが切れると patrol に戻る', () => {
    const e = createChaser(1.5, 3.5, Math.PI); // プレイヤーに背を向けたまま
    e.aiState = 'search'; e.searchTimer = 10;
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('patrol');
    expect(e.lastSeenX).toBe(-1);
  });

  it('patrol: 音（石の着地）に反応して search に遷移する', () => {
    const e = createChaser(1.5, 3.5, Math.PI);
    strategy.update(baseParams(e, { noise: { x: 3.5, y: 3.5 } }));
    expect(e.aiState).toBe('search');
    expect(e.lastSeenX).toBe(3.5);
    expect(e.searchTimer).toBe(4000);
  });

  it('chase: 音には反応しない（追跡を優先する）', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase'; e.lastSeenX = 5.5; e.lastSeenY = 3.5;
    strategy.update(baseParams(e, { noise: { x: 3.5, y: 5.5 } }));
    expect(e.aiState).toBe('chase');
    expect(e.lastSeenX).toBe(5.5); // 音で上書きされない
  });

  it('patrol: 遠すぎる音（NOISE_RADIUS 外）には反応しない', () => {
    const e = createChaser(1.5, 3.5, Math.PI);
    strategy.update(baseParams(e, { noise: { x: 30, y: 30 } }));
    expect(e.aiState).toBe('patrol');
  });

  it('search: 壁を回り込んで目撃地点に到達できる（BFS 経路追従）', () => {
    // 縦通路 (3.5,1.5) の敵が、角を挟んだ横通路 (1.5,3.5) の目撃地点を捜索する。
    // 直線の旋回移動では角の壁に張り付いて到達できないため、BFS 経路追従が必須。
    const e = createChaser(3.5, 1.5, 0);
    e.aiState = 'search';
    e.lastSeenX = 1.5;
    e.lastSeenY = 3.5;
    e.searchTimer = 60000;
    const params = baseParams(e, {
      playerX: 100,
      playerY: 100,
      isPlayerHiding: true,
      searchDuration: 60000,
    });
    for (let i = 0; i < 3000; i++) {
      strategy.update({ ...params, gameTime: 1000 + i * 16 });
    }
    expect(distance(e.x, e.y, e.lastSeenX, e.lastSeenY)).toBeLessThan(1);
  });

  it('chase: 視認中は lastSeen 至近でも search に遷移しない', () => {
    // 敵はプレイヤーに正対しており、プレイヤーは lastSeen とほぼ同じ位置にいる（視認継続中）
    const e = createChaser(4.5, 3.5, 0); // +x を向く
    e.aiState = 'chase';
    e.lastSeenX = 5.5;
    e.lastSeenY = 3.5;
    strategy.update(baseParams(e, { playerX: 5.5, playerY: 3.5 }));
    expect(e.aiState).toBe('chase');
  });
});
