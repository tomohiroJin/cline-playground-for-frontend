import { advanceGame, TickInput } from '../game-tick';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';

// AudioService は Web Audio に触れるためモックする
jest.mock('../audio', () => ({
  AudioService: {
    play: jest.fn(),
    startBGM: jest.fn(),
    stopBGM: jest.fn(),
    updateBGM: jest.fn(),
  },
}));

const NO_INPUT: TickInput = {
  left: false, right: false, forward: false, backward: false, hide: false, sprint: false,
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
