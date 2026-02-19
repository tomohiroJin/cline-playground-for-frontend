import {
  resolvePlayerInput,
  updatePlayerPosition,
  getMovementStrategy,
  processBulletEnemyCollisions,
  processItemCollection,
  processPlayerDamage,
  processGraze,
  checkStageProgression,
} from '../game-logic';
import { EntityFactory, isBoss } from '../entities';
import { MovementStrategies } from '../movement';
import { buildGameState, buildUiState } from '../test-helpers';
import { DifficultyConfig } from '../constants';

describe('resolvePlayerInput', () => {
  test('キーボード入力が優先されること', () => {
    const keys = { ArrowLeft: true } as Record<string, boolean>;
    const touchInput = { dx: 1, dy: 0 };
    const result = resolvePlayerInput(keys, touchInput);
    expect(result.dx).toBe(-1);
  });

  test('キーボード入力がない場合はタッチ入力にフォールバックすること', () => {
    const keys = {} as Record<string, boolean>;
    const touchInput = { dx: 0.5, dy: -0.3 };
    const result = resolvePlayerInput(keys, touchInput);
    expect(result.dx).toBe(0.5);
    expect(result.dy).toBe(-0.3);
  });

  test('WASD入力も処理されること', () => {
    const keys = { w: true, d: true } as Record<string, boolean>;
    const result = resolvePlayerInput(keys, { dx: 0, dy: 0 });
    expect(result.dx).toBe(1);
    expect(result.dy).toBe(-1);
  });

  test('入力がなければ (0, 0) を返すこと', () => {
    const keys = {} as Record<string, boolean>;
    const result = resolvePlayerInput(keys, { dx: 0, dy: 0 });
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
  });
});

describe('updatePlayerPosition', () => {
  test('移動方向に応じて座標が変化すること', () => {
    const result = updatePlayerPosition({ x: 200, y: 400 }, { dx: 1, dy: 0 }, 4);
    expect(result.x).toBe(204);
    expect(result.y).toBe(400);
  });

  test('左端でクランプされること', () => {
    const result = updatePlayerPosition({ x: 5, y: 400 }, { dx: -1, dy: 0 }, 10);
    expect(result.x).toBe(15);
  });

  test('右端でクランプされること', () => {
    const result = updatePlayerPosition({ x: 395, y: 400 }, { dx: 1, dy: 0 }, 10);
    expect(result.x).toBe(385);
  });

  test('上端でクランプされること', () => {
    const result = updatePlayerPosition({ x: 200, y: 5 }, { dx: 0, dy: -1 }, 10);
    expect(result.y).toBe(15);
  });

  test('下端でクランプされること', () => {
    const result = updatePlayerPosition({ x: 200, y: 520 }, { dx: 0, dy: 1 }, 10);
    expect(result.y).toBe(510);
  });
});

describe('getMovementStrategy', () => {
  test('ボスタイプにはboss戦略を返すこと', () => {
    expect(getMovementStrategy('boss1', 0)).toBe(MovementStrategies.boss);
    expect(getMovementStrategy('boss3', 1)).toBe(MovementStrategies.boss);
  });

  test('ミッドボスにはboss戦略を返すこと', () => {
    expect(getMovementStrategy('midboss1', 0)).toBe(MovementStrategies.boss);
    expect(getMovementStrategy('midboss3', 2)).toBe(MovementStrategies.boss);
  });

  test('通常敵パターン0にはstraight戦略を返すこと', () => {
    expect(getMovementStrategy('basic', 0)).toBe(MovementStrategies.straight);
  });

  test('通常敵パターン1にはsine戦略を返すこと', () => {
    expect(getMovementStrategy('basic', 1)).toBe(MovementStrategies.sine);
  });

  test('通常敵パターン2にはdrift戦略を返すこと', () => {
    expect(getMovementStrategy('basic', 2)).toBe(MovementStrategies.drift);
  });
});

describe('processBulletEnemyCollisions', () => {
  test('弾と敵が衝突するとスコアが増加すること', () => {
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig);
    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.audioEvents).toContainEqual({ name: 'destroy' });
  });

  test('コンボが加算されること', () => {
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig);
    expect(result.comboState.combo).toBe(1);
    expect(result.comboState.maxCombo).toBe(1);
  });

  test('ボス撃破で bossDefeated が true になること', () => {
    const boss = EntityFactory.enemy('boss1', 100, 100, 1);
    boss.hp = 1;
    const bullet = EntityFactory.bullet(100, 100, { damage: 10 });
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [boss], 0, diffConfig);
    expect(result.bossDefeated).toBe(true);
    expect(result.screenShake).toBe(500);
    expect(result.screenFlash).toBe(200);
  });

  test('貫通弾は衝突後も残ること', () => {
    const bullet = EntityFactory.bullet(100, 100, { piercing: true, damage: 10 });
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig);
    expect(result.bullets.some(b => b.piercing)).toBe(true);
  });

  test('ミッドボス撃破で確定アイテムドロップすること', () => {
    const midboss = EntityFactory.enemy('midboss1', 100, 100, 1);
    midboss.hp = 1;
    const bullet = EntityFactory.bullet(100, 100, { damage: 100 });
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [midboss], 0, diffConfig);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.screenShake).toBe(200);
  });
});

describe('processItemCollection', () => {
  test('パワーアイテムでpower増加すること', () => {
    const player = { x: 100, y: 100 };
    const item = EntityFactory.item(100, 100, 'power');
    const enemies: ReturnType<typeof EntityFactory.enemy>[] = [];
    const result = processItemCollection(player, [item], buildUiState(), enemies, Date.now());
    expect(result.uiChanges.power).toBe(2);
    expect(result.audioEvents).toContainEqual({ name: 'item' });
  });

  test('シールドアイテムでshieldEndTime設定されること', () => {
    const player = { x: 100, y: 100 };
    const item = EntityFactory.item(100, 100, 'shield');
    const enemies: ReturnType<typeof EntityFactory.enemy>[] = [];
    const now = Date.now();
    const result = processItemCollection(player, [item], buildUiState(), enemies, now);
    expect(result.uiChanges.shieldEndTime).toBe(now + 8000);
  });

  test('ボムアイテムでボス以外の敵が全滅すること', () => {
    const player = { x: 100, y: 100 };
    const item = EntityFactory.item(100, 100, 'bomb');
    const enemies = [
      EntityFactory.enemy('basic', 200, 200),
      EntityFactory.enemy('boss1', 200, 100, 1),
    ];
    const result = processItemCollection(player, [item], buildUiState(), enemies, Date.now());
    // 通常敵のHPは0になるが、ボスは無傷
    const basicEnemy = result.enemies.find(e => e.enemyType === 'basic');
    const bossEnemy = result.enemies.find(e => e.enemyType === 'boss1');
    expect(basicEnemy!.hp).toBe(0);
    expect(bossEnemy!.hp).toBeGreaterThan(0);
  });

  test('ライフアイテムでlives増加すること', () => {
    const player = { x: 100, y: 100 };
    const item = EntityFactory.item(100, 100, 'life');
    const enemies: ReturnType<typeof EntityFactory.enemy>[] = [];
    const result = processItemCollection(player, [item], buildUiState({ lives: 2 }), enemies, Date.now());
    expect(result.uiChanges.lives).toBe(3);
  });

  test('スピードアイテムでspeedLevel増加すること', () => {
    const player = { x: 100, y: 100 };
    const item = EntityFactory.item(100, 100, 'speed');
    const enemies: ReturnType<typeof EntityFactory.enemy>[] = [];
    const result = processItemCollection(player, [item], buildUiState(), enemies, Date.now());
    expect(result.uiChanges.speedLevel).toBe(1);
  });

  test('収集されなかったアイテムは残ること', () => {
    const player = { x: 100, y: 100 };
    const farItem = EntityFactory.item(300, 300, 'power');
    const enemies: ReturnType<typeof EntityFactory.enemy>[] = [];
    const result = processItemCollection(player, [farItem], buildUiState(), enemies, Date.now());
    expect(result.remainingItems).toHaveLength(1);
  });
});

describe('processPlayerDamage', () => {
  test('敵と衝突してライフが減ること', () => {
    const player = { x: 100, y: 100 };
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const result = processPlayerDamage(player, [enemy], [], {
      invincible: false,
      invincibleEndTime: 0,
      shieldEndTime: 0,
      lives: 3,
      combo: 5,
    }, Date.now());
    expect(result.hit).toBe(true);
    expect(result.livesLost).toBe(1);
    expect(result.comboReset).toBe(true);
  });

  test('無敵中はダメージを受けないこと', () => {
    const player = { x: 100, y: 100 };
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const now = Date.now();
    const result = processPlayerDamage(player, [enemy], [], {
      invincible: true,
      invincibleEndTime: now + 5000,
      shieldEndTime: 0,
      lives: 3,
      combo: 0,
    }, now);
    expect(result.hit).toBe(false);
  });

  test('シールド中はダメージを受けないこと', () => {
    const player = { x: 100, y: 100 };
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const now = Date.now();
    const result = processPlayerDamage(player, [enemy], [], {
      invincible: false,
      invincibleEndTime: 0,
      shieldEndTime: now + 5000,
      lives: 3,
      combo: 0,
    }, now);
    expect(result.hit).toBe(false);
  });

  test('ライフ0でゲームオーバーイベントが発生すること', () => {
    const player = { x: 100, y: 100 };
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const result = processPlayerDamage(player, [enemy], [], {
      invincible: false,
      invincibleEndTime: 0,
      shieldEndTime: 0,
      lives: 1,
      combo: 0,
    }, Date.now());
    expect(result.event).toBe('gameover');
  });

  test('敵弾との衝突でもダメージを受けること', () => {
    const player = { x: 100, y: 100 };
    const enemyBullet = EntityFactory.enemyBullet(100, 100, { x: 0, y: 1 });
    const result = processPlayerDamage(player, [], [enemyBullet], {
      invincible: false,
      invincibleEndTime: 0,
      shieldEndTime: 0,
      lives: 3,
      combo: 0,
    }, Date.now());
    expect(result.hit).toBe(true);
  });
});

describe('processGraze', () => {
  test('グレイズ範囲内でスコアが加算されること', () => {
    const player = { x: 100, y: 100 };
    // グレイズ範囲: 衝突半径(8+4=12)の外側、グレイズ半径(8+16=24)の内側
    // distance = 15 → hitRadius=12, grazeRadius=24 → グレイズ成功
    const enemyBullet = EntityFactory.enemyBullet(115, 100, { x: 0, y: 1 });
    const grazedIds = new Set<number>();
    const now = Date.now();
    const result = processGraze(player, [enemyBullet], grazedIds, 0, buildUiState(), now);
    expect(result.grazeCount).toBe(1);
    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.audioEvents).toContainEqual({ name: 'graze' });
  });

  test('既にグレイズ済みの弾は無視されること', () => {
    const player = { x: 100, y: 100 };
    const enemyBullet = EntityFactory.enemyBullet(115, 100, { x: 0, y: 1 });
    const grazedIds = new Set<number>([enemyBullet.id]);
    const now = Date.now();
    const result = processGraze(player, [enemyBullet], grazedIds, 0, buildUiState(), now);
    expect(result.grazeCount).toBe(0);
  });
});

describe('checkStageProgression', () => {
  test('ステージ1〜4のボス撃破でステージが進行すること', () => {
    const now = Date.now();
    const result = checkStageProgression(true, now - 3000, 2, 5000, 10, 5, now);
    expect(result.event).toBe('stageCleared');
    expect(result.nextStage).toBe(3);
    expect(result.bonus).toBeGreaterThan(0);
  });

  test('ステージ5のボス撃破でエンディングイベントが発生すること', () => {
    const now = Date.now();
    const result = checkStageProgression(true, now - 3000, 5, 20000, 30, 10, now);
    expect(result.event).toBe('ending');
  });

  test('ボス未撃破ではイベントなしであること', () => {
    const now = Date.now();
    const result = checkStageProgression(false, 0, 1, 1000, 0, 0, now);
    expect(result.event).toBe('none');
  });

  test('ボス撃破後2秒以内はイベントなしであること', () => {
    const now = Date.now();
    const result = checkStageProgression(true, now - 500, 1, 1000, 0, 0, now);
    expect(result.event).toBe('none');
  });
});
