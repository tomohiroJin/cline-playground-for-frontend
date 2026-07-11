import { advanceGame, TickInput } from '../game-tick';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';
import { capEnemySpeed } from '../game-logic';
import { GAME_BALANCE } from '../domain/constants';
import { GameStateBuilder } from './helpers/game-state-builder';

// AudioService は Web Audio に触れるためモックする
jest.mock('../audio', () => ({
  AudioService: {
    play: jest.fn(),
    playSpatial: jest.fn(),
    startBGM: jest.fn(),
    stopBGM: jest.fn(),
    updateBGM: jest.fn(),
  },
}));

const NO_INPUT: TickInput = {
  left: false, right: false, forward: false, backward: false, hide: false, sprint: false, throwStone: false,
};

const setup = (): GameState => GameStateFactory.create('EASY');

describe('advanceGame', () => {
  test('経過時間 dt だけ残り時間が減る', () => {
    const g = setup();
    const before = g.time;
    advanceGame(g, 16, NO_INPUT);
    expect(g.time).toBeCloseTo(before - 16);
    expect(g.gTime).toBeCloseTo(16);
  });

  test('残り時間が尽きると timeout を返す', () => {
    const g = setup();
    g.time = 10;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('timeout');
  });

  test('ライフが尽きると gameover を返す', () => {
    const g = setup();
    g.lives = 1;
    // プレイヤー位置に敵を重ね、無敵を切る
    g.invince = 0;
    g.hiding = false;
    const e = g.enemies[0];
    e.active = true;
    e.x = g.player.x;
    e.y = g.player.y;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('gameover');
    expect(g.lives).toBe(0);
  });

  test('全鍵所持で出口に重なると victory を返す', () => {
    const g = setup();
    g.keys = g.reqKeys;
    g.player.x = g.exit.x;
    g.player.y = g.exit.y;
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('victory');
  });

  test('通常フレームは playing と最近敵距離を返す', () => {
    const g = setup();
    const result = advanceGame(g, 16, NO_INPUT);
    expect(result.status).toBe('playing');
    expect(typeof result.closestEnemy).toBe('number');
  });
});

describe('Phase2: 石投げと索敵の統合', () => {
  const idleInput = NO_INPUT;

  it('throwStone 入力で石が減り弾が生成される', () => {
    const g = GameStateFactory.create('NORMAL');
    const before = g.stones;
    advanceGame(g, 16, { ...idleInput, throwStone: true });
    expect(g.stones).toBe(before - 1);
    expect(g.stoneProjectiles).toHaveLength(1);
  });

  it('敵に渡る速度はプレイヤー速度の0.9倍を超えない', () => {
    // GAME_BALANCE.player.MOVE_SPEED * MAX_SPEED_RATIO を超える eSpeed を強制しても
    // capEnemySpeed でキャップされることを確認する（capEnemySpeed を export して直接検証）
    expect(capEnemySpeed(999)).toBeCloseTo(
      GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO
    );
    expect(capEnemySpeed(0.001)).toBe(0.001);
  });

  it('TickResult は alerts 配列を返す', () => {
    const g = GameStateFactory.create('NORMAL');
    const result = advanceGame(g, 16, idleInput);
    expect(Array.isArray(result.alerts)).toBe(true);
  });

  it('罠を踏むと騒音半径内の敵が search 状態でその地点へ向かう', () => {
    // 敵を罠から 6 セル（小石半径5の外・罠半径8の内）に配置して advanceGame を1tick
    const g = GameStateBuilder.create('EASY')
      .withPlayer({ x: 1.5, y: 1.5 })
      .withItem('trap', 1, 1)
      .withEnemy('chaser', { x: 7.5, y: 1.5, active: true, aiState: 'patrol' })
      .build();
    advanceGame(g, 16, idleInput);
    expect(g.enemies[0].aiState).toBe('search');
    expect(g.enemies[0].lastSeenX).toBeCloseTo(1.5);
  });

  it('useSpeed 入力でチャージが消費され加速が発動する', () => {
    const g = GameStateBuilder.create('EASY').build();
    g.speedCharges = 1;
    advanceGame(g, 16, { ...idleInput, useSpeed: true });
    expect(g.speedCharges).toBe(0);
    expect(g.speedBoost).toBeGreaterThan(0);
  });
});
