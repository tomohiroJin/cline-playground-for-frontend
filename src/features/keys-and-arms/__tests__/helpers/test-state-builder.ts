/**
 * KEYS & ARMS — テスト用 GameState ビルダー
 *
 * デフォルト値を持ち、テストに必要な部分のみオーバーライド可能。
 * createInitialGameState を基盤とし、型安全な GameState を生成する。
 */
import type { GameState, GameScreen } from '../../types/game-state';
import type { CaveState, PrairieState, BossState } from '../../types/stage';

/** デフォルトの CaveState を生成 */
function defaultCaveState(): CaveState {
  return {
    pos: 0,
    prevPos: 0,
    dir: 1,
    keys: [false, false, false],
    keysPlaced: 0,
    carrying: false,
    trapOn: false,
    trapBeat: 0,
    trapSparks: [],
    trapWasDanger: 0,
    cageProgress: 0,
    cageMax: 65,
    cageHolding: false,
    batPhase: 0,
    batBeat: 0,
    batHitAnim: 0,
    batWasDanger: 0,
    mimicOpen: false,
    mimicBeat: 0,
    pryCount: 0,
    mimicShake: 0,
    mimicWasDanger: 0,
    pryDecayT: 0,
    spiderY: 0,
    spiderBeat: 0,
    spiderWasDanger: 0,
    hurtCD: 0,
    actAnim: 0,
    actType: '',
    walkAnim: 0,
    idleT: 0,
    won: false,
    wonT: 0,
    trailAlpha: 0,
    roomNameT: 0,
    roomName: '',
  };
}

/** デフォルトの PrairieState を生成 */
function defaultPrairieState(): PrairieState {
  return {
    ens: [],
    kills: 0,
    goal: 14,
    maxSpawn: 3,
    spawned: 0,
    guards: 0,
    atkAnim: [0, 0],
    atkCD: 0,
    guardAnim: 0,
    guardFlash: 0,
    hurtCD: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    won: false,
    wonT: 0,
    shieldOrbs: [],
    nextShieldAt: 5,
    sweepReady: false,
    sweepFlash: 0,
  };
}

/** デフォルトの BossState を生成 */
function defaultBossState(): BossState {
  return {
    pos: 0,
    hasGem: false,
    peds: [0, 0, 0, 0, 0, 0],
    armStage: [0, 0, 0, 0, 0, 0],
    armDir: [1, 1, 1, 1, 1, 1],
    armSpeed: [3, 3, 3, 3, 3, 3],
    armBaseSpd: 3,
    armSpdVar: 1,
    armRest: [0, 0, 0, 0, 0, 0],
    armBaseRest: 5,
    armRestVar: 2,
    armBeat: [0, 0, 0, 0, 0, 0],
    armResting: [true, true, true, true, true, true],
    armRestT: [0, 0, 0, 0, 0, 0],
    armWarn: [0, 0, 0, 0, 0, 0],
    shields: 1,
    hurtCD: 0,
    moveCD: 0,
    won: false,
    wonT: 0,
    walkT: 0,
    prevPos: 0,
    stealAnim: [0, 0],
    placeAnim: [0, 0],
    shieldAnim: [0, 0],
    bossAnger: 0,
    bossPulse: 0,
    bossBreath: 0,
    counterCD: 0,
    counterFlash: [0, 0],
    rageWave: 0,
    quake: 0,
  };
}

/**
 * テスト用 GameState ビルダー
 *
 * @example
 * const state = gameState().withHP(5).withScreen('cave').build();
 */
export class GameStateBuilder {
  private overrides: Partial<GameState> = {};
  private cavOverrides: Partial<CaveState> = {};
  private grsOverrides: Partial<PrairieState> = {};
  private bosOverrides: Partial<BossState> = {};

  withScreen(screen: GameScreen): this {
    this.overrides.state = screen;
    return this;
  }

  withHP(hp: number): this {
    this.overrides.hp = hp;
    return this;
  }

  withMaxHP(maxHp: number): this {
    this.overrides.maxHp = maxHp;
    return this;
  }

  withScore(score: number): this {
    this.overrides.score = score;
    return this;
  }

  withHighScore(hi: number): this {
    this.overrides.hi = hi;
    return this;
  }

  withLoop(loop: number): this {
    this.overrides.loop = loop;
    return this;
  }

  withTick(tick: number): this {
    this.overrides.tick = tick;
    return this;
  }

  withPaused(paused: boolean): this {
    this.overrides.paused = paused;
    return this;
  }

  withEarnedShields(n: number): this {
    this.overrides.earnedShields = n;
    return this;
  }

  withCave(overrides: Partial<CaveState>): this {
    this.cavOverrides = { ...this.cavOverrides, ...overrides };
    return this;
  }

  withPrairie(overrides: Partial<PrairieState>): this {
    this.grsOverrides = { ...this.grsOverrides, ...overrides };
    return this;
  }

  withBoss(overrides: Partial<BossState>): this {
    this.bosOverrides = { ...this.bosOverrides, ...overrides };
    return this;
  }

  build(): GameState {
    return {
      // 画面制御
      state: 'title',
      loop: 1,
      score: 0,
      dispScore: 0,
      hp: 3,
      maxHp: 3,
      tick: 0,
      beatCtr: 0,
      beatNum: 0,
      beatPulse: 0,
      noDmg: true,
      hurtFlash: 0,
      shakeT: 0,
      hitStop: 0,
      hi: 0,
      resetConfirm: 0,
      earnedShields: 0,
      bgmBeat: 0,
      paused: false,
      helpPage: 0,

      // 入力
      jp: {},
      kd: {},

      // トランジション
      trT: 0,
      trTxt: '',
      trFn: undefined,
      trSub: '',

      // タイトル画面
      blink: 0,
      cheatBuf: '',

      // エンディング
      e1T: 0,
      teT: 0,

      // ステージ状態
      cav: { ...defaultCaveState(), ...this.cavOverrides },
      sparks: [],
      dust: [],
      feathers: [],
      smoke: [],
      stepDust: [],
      keySpk: [],
      cavDrips: [],

      grs: { ...defaultPrairieState(), ...this.grsOverrides },
      grsSlash: [],
      grsDead: [],
      grsGrass: [],
      grsDust: [],
      grsLaneFlash: [],
      grsMiss: [],

      bos: { ...defaultBossState(), ...this.bosOverrides },
      bosParticles: [],
      bosShieldBreak: [],
      bosArmTrail: [],

      // 遅延バインド
      cavInit: undefined,
      grsInit: undefined,
      bosInit: undefined,
      startGame: undefined,

      // オーバーライドを適用
      ...this.overrides,
    } as GameState;
  }
}

/** ビルダーのショートカット */
export function gameState(): GameStateBuilder {
  return new GameStateBuilder();
}
