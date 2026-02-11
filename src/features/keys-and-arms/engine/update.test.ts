import { updateGameState } from './update';
import type { GameState } from '../types';

const baseState = (overrides: Partial<GameState> = {}): GameState => ({
  scene: 'title',
  stage: 'cave',
  score: 0,
  hiScore: 0,
  hp: 3,
  maxHp: 3,
  loop: 1,
  tick: 0,
  stageTick: 0,
  endedByNoDamage: true,
  noDamage: true,
  beatCounter: 0,
  beatNum: 0,
  cavePos: 0,
  caveDir: 1,
  caveKeys: 0,
  cavePlaced: 0,
  caveKeyOwned: [false, false, false],
  caveCarrying: false,
  caveTrapOn: false,
  caveTrapBeat: 0,
  caveBatPhase: 0,
  caveBatBeat: 0,
  caveMimicOpen: false,
  caveMimicBeat: 0,
  cavePryCount: 0,
  caveSpiderY: 0,
  caveSpiderBeat: 0,
  caveHurtCd: 0,
  caveWon: false,
  caveWonTick: 0,
  caveCageProgress: 0,
  grassKills: 0,
  grassGoal: 14,
  grassCombo: 0,
  grassMaxSpawn: 26,
  grassSpawned: 0,
  grassGuards: 3,
  grassAttackCd: 0,
  grassHurtCd: 0,
  grassWon: false,
  grassWonTick: 0,
  grassSweepReady: false,
  grassNextShieldAt: 5,
  grassEnemies: [],
  earnedShields: 0,
  bossPos: 0,
  bossHasGem: true,
  bossPedestals: 0,
  bossPedestalState: [0, 0, 0, 0, 0, 0],
  bossShields: 1,
  bossWon: false,
  bossWonTick: 0,
  ...overrides,
});

const input = (overrides: Partial<Parameters<typeof updateGameState>[1]> = {}) => ({
  isActionJustPressed: false,
  isActionPressed: false,
  isResetJustPressed: false,
  isLeftJustPressed: false,
  isRightJustPressed: false,
  isUpJustPressed: false,
  isDownJustPressed: false,
  ...overrides,
});

describe('updateGameState transitions', () => {
  it('title で ACT を押すと play/cave を開始する', () => {
    const next = updateGameState(baseState(), input({ isActionJustPressed: true }));
    expect(next.scene).toBe('play');
    expect(next.stage).toBe('cave');
    expect(next.loop).toBe(1);
  });

  it('cave で3つ設置すると grass へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'cave',
      cavePlaced: 3,
      caveWon: true,
      caveWonTick: 119,
    });
    const next = updateGameState(state, input());
    expect(next.scene).toBe('play');
    expect(next.stage).toBe('grass');
  });

  it('grass の目標撃破で boss へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'grass',
      grassWon: true,
      grassWonTick: 119,
    });
    const next = updateGameState(state, input());
    expect(next.stage).toBe('boss');
  });

  it('被弾で HP が 0 になると over へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'cave',
      hp: 1,
      cavePos: 4,
      caveBatPhase: 2,
      caveKeyOwned: [false, false, false],
      caveHurtCd: 0,
    });
    const next = updateGameState(state, input());
    expect(next.scene).toBe('over');
    expect(next.hp).toBe(0);
  });

  it('loop 1 の boss クリアで ending1 へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'boss',
      loop: 1,
      bossWon: true,
      bossWonTick: 149,
    });
    const next = updateGameState(state, input());
    expect(next.scene).toBe('ending1');
  });

  it('ending1 で ACT を押すと loop 2 の cave 開始へ遷移する', () => {
    const state = baseState({ scene: 'ending1', loop: 1, stageTick: 40 });
    const next = updateGameState(state, input({ isActionJustPressed: true }));
    expect(next.scene).toBe('play');
    expect(next.stage).toBe('cave');
    expect(next.loop).toBe(2);
  });

  it('loop 2 の boss クリアで loop 3 の cave へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'boss',
      loop: 2,
      bossWon: true,
      bossWonTick: 149,
    });
    const next = updateGameState(state, input());
    expect(next.scene).toBe('play');
    expect(next.stage).toBe('cave');
    expect(next.loop).toBe(3);
  });

  it('loop 3 の boss クリアで trueEnd へ遷移する', () => {
    const state = baseState({
      scene: 'play',
      stage: 'boss',
      loop: 3,
      bossWon: true,
      bossWonTick: 149,
    });
    const next = updateGameState(state, input());
    expect(next.scene).toBe('trueEnd');
  });
});
