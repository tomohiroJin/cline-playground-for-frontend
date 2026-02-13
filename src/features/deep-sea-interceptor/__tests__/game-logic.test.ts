import { createInitialGameState, createInitialUiState, updateFrame } from '../game-logic';
import { EntityFactory } from '../entities';

describe('createInitialGameState', () => {
  test('初期ゲーム状態を正しく生成すること', () => {
    const state = createInitialGameState();
    expect(state.player.x).toBe(200);
    expect(state.player.y).toBe(480);
    expect(state.bullets).toHaveLength(0);
    expect(state.enemies).toHaveLength(0);
    expect(state.charging).toBe(false);
    expect(state.bossDefeated).toBe(false);
    expect(state.invincible).toBe(false);
  });
});

describe('createInitialUiState', () => {
  test('初期UI状態を正しく生成すること', () => {
    const state = createInitialUiState(5000);
    expect(state.stage).toBe(1);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.highScore).toBe(5000);
    expect(state.power).toBe(1);
  });

  test('ハイスコアのデフォルト値は0であること', () => {
    const state = createInitialUiState();
    expect(state.highScore).toBe(0);
  });
});

describe('updateFrame', () => {
  const mockAudioPlay = jest.fn();

  beforeEach(() => {
    mockAudioPlay.mockClear();
  });

  test('プレイヤー移動が正しく行われること', () => {
    const gd = createInitialGameState();
    gd.keys['ArrowRight'] = true;
    const ui = createInitialUiState();
    const now = Date.now();

    updateFrame(gd, ui, now, mockAudioPlay);

    expect(gd.player.x).toBeGreaterThan(200);
  });

  test('プレイヤーが画面端を超えないこと', () => {
    const gd = createInitialGameState();
    gd.player.x = 5;
    gd.keys['ArrowLeft'] = true;
    const ui = createInitialUiState();

    updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(gd.player.x).toBeGreaterThanOrEqual(15);
  });

  test('弾が画面外に出たら除去されること', () => {
    const gd = createInitialGameState();
    gd.bullets.push(EntityFactory.bullet(200, -30));
    const ui = createInitialUiState();

    updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(gd.bullets).toHaveLength(0);
  });

  test('弾が敵に命中したらスコアが増加すること', () => {
    const gd = createInitialGameState();
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('basic', 100, 100);
    gd.bullets.push(bullet);
    gd.enemies.push(enemy);
    const ui = createInitialUiState();

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.uiState.score).toBe(100);
    expect(mockAudioPlay).toHaveBeenCalledWith('destroy');
  });

  test('ライフが0になったらゲームオーバーイベントが発生すること', () => {
    const gd = createInitialGameState();
    const enemy = EntityFactory.enemy('basic', gd.player.x, gd.player.y);
    gd.enemies.push(enemy);
    const ui = createInitialUiState();
    ui.lives = 1;

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.event).toBe('gameover');
    expect(result.uiState.lives).toBe(0);
  });

  test('被弾時にシールドがあれば無効であること', () => {
    const gd = createInitialGameState();
    const enemy = EntityFactory.enemy('basic', gd.player.x, gd.player.y);
    gd.enemies.push(enemy);
    const ui = createInitialUiState();
    ui.shieldEndTime = Date.now() + 10000;

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.uiState.lives).toBe(3);
    expect(result.event).toBe('none');
  });

  test('無敵時間中はダメージを受けないこと', () => {
    const gd = createInitialGameState();
    gd.invincible = true;
    gd.invincibleEndTime = Date.now() + 10000;
    const enemy = EntityFactory.enemy('basic', gd.player.x, gd.player.y);
    gd.enemies.push(enemy);
    const ui = createInitialUiState();

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.uiState.lives).toBe(3);
  });

  test('ボス撃破後にステージが進行すること', () => {
    const gd = createInitialGameState();
    gd.bossDefeated = true;
    gd.bossDefeatedTime = Date.now() - 3000;
    const ui = createInitialUiState();
    ui.stage = 1;

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.event).toBe('stageCleared');
    expect(result.uiState.stage).toBe(2);
  });

  test('最終ステージのボス撃破でエンディングイベントが発生すること', () => {
    const gd = createInitialGameState();
    gd.bossDefeated = true;
    gd.bossDefeatedTime = Date.now() - 3000;
    const ui = createInitialUiState();
    ui.stage = 3;

    const result = updateFrame(gd, ui, Date.now(), mockAudioPlay);

    expect(result.event).toBe('ending');
  });
});
