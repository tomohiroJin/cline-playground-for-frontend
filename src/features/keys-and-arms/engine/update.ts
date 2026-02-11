import {
  BOSS_PEDESTAL_TARGET,
  CAVE_KEY_TARGET,
  INITIAL_HP,
  resolveBeatLength,
} from '../constants';
import type { GameState, GrassEnemy } from '../types';
import { checkPlayerHit } from './collision';
import { addScore, clampHp } from './scoring';

export interface UpdateInput {
  isActionJustPressed: boolean;
  isActionPressed: boolean;
  isResetJustPressed: boolean;
  isLeftJustPressed: boolean;
  isRightJustPressed: boolean;
  isUpJustPressed: boolean;
  isDownJustPressed: boolean;
}

const CAVE_NAV: ReadonlyArray<{ l?: number; r?: number; u?: number; d?: number }> = [
  { r: 1 },
  { l: 0, r: 2 },
  { l: 1, r: 3, d: 7 },
  { l: 2, r: 4 },
  { l: 3 },
  { r: 6 },
  { l: 5, r: 7 },
  { l: 6, r: 8, u: 2, d: 10 },
  { l: 7, r: 9 },
  { l: 8 },
  { u: 7 },
];

const resolveGrassGoal = (loop: number): number => 10 + loop * 4;
const resolveCageMax = (loop: number): number => 50 + loop * 15;
const resolveBossShields = (earnedShields: number): number => Math.min(5, 1 + earnedShields);

const hazardCycle = (loop: number, base: number): number => Math.max(base - 3, base - loop);

const twoBeatDuration = (loop: number): number => resolveBeatLength(loop) * 2;

const countCollectedKeys = (keys: [boolean, boolean, boolean]): number =>
  keys.filter((value) => value).length;

const baseProgressState = (state: GameState): GameState => ({
  ...state,
  tick: state.tick + 1,
  stageTick: state.stageTick + 1,
});

const resetStageCommon = (state: GameState): GameState => ({
  ...state,
  stageTick: 0,
  beatCounter: 0,
  beatNum: 0,
});

const initCave = (state: GameState): GameState =>
  resetStageCommon({
    ...state,
    scene: 'play',
    stage: 'cave',
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
  });

const initGrass = (state: GameState): GameState => {
  const goal = resolveGrassGoal(state.loop);
  return resetStageCommon({
    ...state,
    stage: 'grass',
    grassKills: 0,
    grassGoal: goal,
    grassCombo: 0,
    grassMaxSpawn: Math.floor(goal * 1.6) + 4,
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
  });
};

const initBoss = (state: GameState): GameState =>
  resetStageCommon({
    ...state,
    stage: 'boss',
    bossPos: 0,
    bossHasGem: false,
    bossPedestals: 0,
    bossPedestalState: [0, 0, 0, 0, 0, 0],
    bossShields: resolveBossShields(state.earnedShields),
    bossWon: false,
    bossWonTick: 0,
  });

const resetForTitle = (state: GameState): GameState => ({
  ...initCave({
    ...state,
    scene: 'title',
    stage: 'cave',
    score: 0,
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    loop: 1,
    noDamage: true,
    endedByNoDamage: true,
  }),
  scene: 'title',
});

const startRunFromTitle = (state: GameState): GameState =>
  initCave({
    ...state,
    scene: 'play',
    score: 0,
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    loop: 1,
    noDamage: true,
    endedByNoDamage: true,
  });

const hurt = (state: GameState, cooldown: number): GameState => {
  const nextHp = clampHp(state.hp - 1, state.maxHp);
  const nextState: GameState = {
    ...state,
    hp: nextHp,
    noDamage: false,
    endedByNoDamage: false,
  };
  if (nextHp <= 0) {
    return {
      ...nextState,
      scene: 'over',
    };
  }
  return {
    ...nextState,
    caveHurtCd: state.stage === 'cave' ? cooldown : state.caveHurtCd,
    grassHurtCd: state.stage === 'grass' ? cooldown : state.grassHurtCd,
  };
};

const moveCave = (state: GameState, input: UpdateInput): GameState => {
  const nav = CAVE_NAV[state.cavePos];
  let nextPos = state.cavePos;
  let nextDir = state.caveDir;

  if (input.isLeftJustPressed && nav.l !== undefined) {
    nextPos = nav.l;
    nextDir = -1;
  }
  if (input.isRightJustPressed && nav.r !== undefined) {
    nextPos = nav.r;
    nextDir = 1;
  }
  if (input.isDownJustPressed && nav.d !== undefined) {
    nextPos = nav.d;
  }
  if (input.isUpJustPressed && nav.u !== undefined) {
    nextPos = nav.u;
  }

  return {
    ...state,
    cavePos: nextPos,
    caveDir: nextDir,
  };
};

const applyCaveAction = (state: GameState, input: UpdateInput): GameState => {
  let nextState = state;

  if (
    state.cavePos === 9 &&
    !state.caveKeyOwned[0] &&
    !state.caveCarrying &&
    !state.caveTrapOn &&
    input.isActionPressed &&
    state.caveHurtCd <= 0
  ) {
    const progress = state.caveCageProgress + 2.5;
    if (progress >= resolveCageMax(state.loop)) {
      const nextKeys: [boolean, boolean, boolean] = [...state.caveKeyOwned] as [
        boolean,
        boolean,
        boolean,
      ];
      nextKeys[0] = true;
      return {
        ...state,
        caveKeyOwned: nextKeys,
        caveKeys: countCollectedKeys(nextKeys),
        caveCarrying: true,
        caveCageProgress: 0,
        score: addScore(state.score, 300 * state.loop),
      };
    }
    nextState = {
      ...state,
      caveCageProgress: progress,
    };
  } else if (state.caveCageProgress > 0) {
    nextState = {
      ...nextState,
      caveCageProgress: Math.max(0, state.caveCageProgress - 0.05),
    };
  }

  if (state.cavePos === 9 && state.caveTrapOn && nextState.caveCageProgress > 0) {
    nextState = {
      ...nextState,
      caveCageProgress: Math.max(0, nextState.caveCageProgress - 0.5),
    };
  }

  if (!input.isActionJustPressed || nextState.caveHurtCd > 0) {
    return nextState;
  }

  if (
    nextState.cavePos === 4 &&
    !nextState.caveKeyOwned[1] &&
    !nextState.caveCarrying &&
    nextState.caveBatPhase === 0
  ) {
    const nextKeys: [boolean, boolean, boolean] = [...nextState.caveKeyOwned] as [
      boolean,
      boolean,
      boolean,
    ];
    nextKeys[1] = true;
    return {
      ...nextState,
      caveKeyOwned: nextKeys,
      caveKeys: countCollectedKeys(nextKeys),
      caveCarrying: true,
      score: addScore(nextState.score, 300 * nextState.loop),
    };
  }

  if (
    nextState.cavePos === 5 &&
    !nextState.caveKeyOwned[2] &&
    !nextState.caveCarrying &&
    !nextState.caveMimicOpen
  ) {
    const pryCount = nextState.cavePryCount + 1;
    if (pryCount >= 5) {
      const nextKeys: [boolean, boolean, boolean] = [...nextState.caveKeyOwned] as [
        boolean,
        boolean,
        boolean,
      ];
      nextKeys[2] = true;
      return {
        ...nextState,
        cavePryCount: pryCount,
        caveKeyOwned: nextKeys,
        caveKeys: countCollectedKeys(nextKeys),
        caveCarrying: true,
        score: addScore(nextState.score, 300 * nextState.loop),
      };
    }

    return {
      ...nextState,
      cavePryCount: pryCount,
    };
  }

  if (nextState.cavePos === 10 && nextState.caveCarrying && nextState.caveSpiderY === 0) {
    const placed = nextState.cavePlaced + 1;
    const won = placed >= CAVE_KEY_TARGET;
    return {
      ...nextState,
      cavePlaced: placed,
      caveCarrying: false,
      caveWon: won,
      caveWonTick: won ? 0 : nextState.caveWonTick,
      score: addScore(nextState.score, won ? 2500 * nextState.loop : 500 * nextState.loop),
      hp: won ? clampHp(nextState.hp + 1, nextState.maxHp) : nextState.hp,
    };
  }

  return nextState;
};

const applyCaveDamage = (state: GameState): GameState => {
  if (state.caveHurtCd > 0) {
    return {
      ...state,
      caveHurtCd: state.caveHurtCd - 1,
    };
  }

  const damageCooldown = twoBeatDuration(state.loop);

  if (state.cavePos === 9 && state.caveTrapOn && !state.caveKeyOwned[0]) {
    return hurt(
      {
        ...state,
        caveHurtCd: damageCooldown,
      },
      damageCooldown
    );
  }

  if (state.cavePos === 4 && state.caveBatPhase === 2 && !state.caveKeyOwned[1]) {
    return hurt(
      {
        ...state,
        caveHurtCd: damageCooldown,
      },
      damageCooldown
    );
  }

  if (state.cavePos === 5 && state.caveMimicOpen && !state.caveKeyOwned[2]) {
    return hurt(
      {
        ...state,
        caveHurtCd: damageCooldown,
        cavePryCount: Math.max(0, state.cavePryCount - 2),
      },
      damageCooldown
    );
  }

  if (state.cavePos === 10 && state.caveSpiderY === 2) {
    let droppedKeys: [boolean, boolean, boolean] = [...state.caveKeyOwned] as [
      boolean,
      boolean,
      boolean,
    ];
    if (state.caveCarrying) {
      for (let index = 2; index >= 0; index -= 1) {
        if (droppedKeys[index]) {
          droppedKeys[index] = false;
          break;
        }
      }
    }

    return hurt(
      {
        ...state,
        caveHurtCd: damageCooldown,
        caveCarrying: false,
        caveKeyOwned: droppedKeys,
        caveKeys: countCollectedKeys(droppedKeys),
      },
      damageCooldown
    );
  }

  return state;
};

const applyCaveBeat = (state: GameState, beat: boolean): GameState => {
  if (!beat) {
    return state;
  }

  const trapBeat = state.caveTrapBeat + 1;
  const trapPeriod = hazardCycle(state.loop, 6);
  const trapOn = trapBeat % trapPeriod >= trapPeriod - 2;

  const batBeat = state.caveBatBeat + 1;
  const batPeriod = hazardCycle(state.loop, 7);
  const batCycle = batBeat % batPeriod;
  const batPhase: 0 | 1 | 2 =
    batCycle < Math.floor(batPeriod * 0.4)
      ? 0
      : batCycle < Math.floor(batPeriod * 0.7)
      ? 1
      : 2;

  const mimicBeat = state.caveMimicBeat + 1;
  const mimicPeriod = hazardCycle(state.loop, 6);
  const mimicOpen = mimicBeat % mimicPeriod >= mimicPeriod - 2;

  const spiderBeat = state.caveSpiderBeat + 1;
  const spiderPeriod = hazardCycle(state.loop, 7);
  const spiderCycle = spiderBeat % spiderPeriod;
  const spiderY: 0 | 1 | 2 =
    spiderCycle < Math.floor(spiderPeriod * 0.35)
      ? 0
      : spiderCycle < Math.floor(spiderPeriod * 0.6)
      ? 1
      : 2;

  return {
    ...state,
    caveTrapBeat: trapBeat,
    caveTrapOn: trapOn,
    caveBatBeat: batBeat,
    caveBatPhase: batPhase,
    caveMimicBeat: mimicBeat,
    caveMimicOpen: mimicOpen,
    caveSpiderBeat: spiderBeat,
    caveSpiderY: spiderY,
  };
};

const spawnGrassEnemy = (state: GameState): GameState => {
  const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  if (state.grassEnemies.some((enemy) => enemy.lane === lane && enemy.step >= 2 && !enemy.dead)) {
    return state;
  }

  const chance = Math.random();
  let beh: GrassEnemy['beh'] = 'normal';
  if (state.loop === 1) {
    if (chance < 0.15) beh = 'shifter';
  } else if (state.loop === 2) {
    if (chance < 0.25) beh = 'shifter';
    else if (chance > 0.7) beh = 'dasher';
  } else {
    if (chance < 0.3) beh = 'shifter';
    else if (chance > 0.55) beh = 'dasher';
  }

  let shiftDir: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
  if (lane === 0) shiftDir = 1;
  if (lane === 2) shiftDir = -1;

  return {
    ...state,
    grassEnemies: [
      ...state.grassEnemies,
      {
        lane,
        step: 3,
        beh,
        dead: false,
        wait: 0,
        shiftDir,
        shifted: false,
        dashReady: false,
        spawnTick: 4,
      },
    ],
    grassSpawned: state.grassSpawned + 1,
  };
};

const checkGrassShieldDrop = (state: GameState): GameState => {
  if (state.grassKills < state.grassNextShieldAt || state.earnedShields >= 4) {
    return state;
  }
  return {
    ...state,
    earnedShields: state.earnedShields + 1,
    grassNextShieldAt: state.grassNextShieldAt + 5,
  };
};

const applyGrassAction = (state: GameState, input: UpdateInput): GameState => {
  let nextState = state;
  if (nextState.grassAttackCd > 0) {
    nextState = {
      ...nextState,
      grassAttackCd: nextState.grassAttackCd - 1,
    };
  }

  let attackLane: 0 | 1 | 2 | null = null;
  if (input.isUpJustPressed) attackLane = 0;
  if (input.isRightJustPressed) attackLane = 1;
  if (input.isDownJustPressed) attackLane = 2;

  if (attackLane !== null && nextState.grassAttackCd <= 0) {
    let enemies = nextState.grassEnemies.map((enemy) => ({ ...enemy }));
    let combo = nextState.grassCombo;
    let kills = nextState.grassKills;
    let score = nextState.score;
    let hit = false;
    let sweepReady = nextState.grassSweepReady;

    if (sweepReady) {
      enemies = enemies.map((enemy) => {
        if (!enemy.dead && enemy.step === 0) {
          hit = true;
          kills += 1;
          combo += 1;
          score = addScore(score, (200 + combo * 60) * nextState.loop);
          return { ...enemy, dead: true };
        }
        return enemy;
      });
      combo = 0;
      sweepReady = false;
    } else {
      const targetIndex = enemies.findIndex(
        (enemy) => !enemy.dead && enemy.lane === attackLane && enemy.step === 0
      );
      if (targetIndex >= 0) {
        hit = true;
        kills += 1;
        combo += 1;
        score = addScore(score, (100 + combo * 40) * nextState.loop);
        enemies[targetIndex] = {
          ...enemies[targetIndex],
          dead: true,
        };
      } else {
        combo = 0;
        sweepReady = false;
      }
      if (combo >= 4) {
        sweepReady = true;
      }
    }

    nextState = {
      ...nextState,
      grassEnemies: enemies,
      grassKills: kills,
      grassCombo: combo,
      grassSweepReady: sweepReady,
      grassAttackCd: 2,
      score,
    };

    if (hit) {
      nextState = checkGrassShieldDrop(nextState);
    }
  }

  if (input.isLeftJustPressed && nextState.grassGuards > 0 && nextState.grassAttackCd <= 0) {
    const enemies = nextState.grassEnemies.map((enemy) => ({ ...enemy }));
    const targetIndex = enemies.findIndex((enemy) => !enemy.dead && enemy.step === 0);
    let kills = nextState.grassKills;
    let score = nextState.score;
    if (targetIndex >= 0) {
      enemies[targetIndex] = { ...enemies[targetIndex], dead: true };
      kills += 1;
      score = addScore(score, 50 * nextState.loop);
    }
    nextState = {
      ...nextState,
      grassEnemies: enemies,
      grassKills: kills,
      score,
      grassGuards: nextState.grassGuards - 1,
      grassAttackCd: 3,
      grassCombo: 0,
    };
    nextState = checkGrassShieldDrop(nextState);
  }

  return nextState;
};

const applyGrassBeat = (state: GameState, beat: boolean): GameState => {
  if (!beat) {
    return state;
  }

  let nextState = state;
  let enemies = nextState.grassEnemies.map((enemy) => ({ ...enemy })).filter((enemy) => !enemy.dead);

  const damageCooldown = twoBeatDuration(nextState.loop);
  let grassHurtCd = Math.max(0, nextState.grassHurtCd - 1);
  for (const enemy of enemies) {
    if (enemy.step <= -1) {
      enemy.dead = true;
      if (grassHurtCd <= 0) {
        nextState = hurt(nextState, damageCooldown);
        grassHurtCd = damageCooldown;
        nextState = {
          ...nextState,
          grassCombo: 0,
        };
      }
    }
  }

  enemies = enemies.filter((enemy) => !enemy.dead).map((enemy) => {
    const nextEnemy = { ...enemy };
    if (nextEnemy.spawnTick > 0) {
      nextEnemy.spawnTick -= 1;
      return nextEnemy;
    }

    if (nextEnemy.beh === 'dasher') {
      if (nextEnemy.step === 2 && !nextEnemy.dashReady) {
        nextEnemy.dashReady = true;
        return nextEnemy;
      }
      if (nextEnemy.dashReady) {
        nextEnemy.step = 0;
        nextEnemy.dashReady = false;
        return nextEnemy;
      }
    }

    if (nextEnemy.beh === 'shifter' && nextEnemy.step === 2 && !nextEnemy.shifted) {
      nextEnemy.shifted = true;
      const lane = nextEnemy.lane + nextEnemy.shiftDir;
      if (lane >= 0 && lane <= 2) {
        nextEnemy.lane = lane as 0 | 1 | 2;
      }
    }

    if (nextEnemy.wait > 0) {
      nextEnemy.wait -= 1;
      return nextEnemy;
    }

    nextEnemy.step -= 1;
    return nextEnemy;
  });

  nextState = {
    ...nextState,
    grassEnemies: enemies,
    grassHurtCd,
  };

  if (nextState.grassSpawned < nextState.grassMaxSpawn && !nextState.grassWon) {
    const interval = Math.max(1, 3 - Math.floor((nextState.loop - 1) / 1));
    if (nextState.beatNum % interval === 0) {
      nextState = spawnGrassEnemy(nextState);
    }
    if (nextState.loop >= 2 && nextState.beatNum % 3 === 1 && nextState.grassSpawned < nextState.grassMaxSpawn) {
      nextState = spawnGrassEnemy(nextState);
    }
    if (nextState.loop >= 4 && nextState.beatNum % 4 === 2 && nextState.grassSpawned < nextState.grassMaxSpawn) {
      nextState = spawnGrassEnemy(nextState);
    }
  }

  return nextState;
};

const updateCave = (state: GameState, input: UpdateInput, beat: boolean): GameState => {
  let nextState = state;

  if (nextState.caveWon) {
    const wonTick = nextState.caveWonTick + 1;
    if (wonTick >= 120) {
      return initGrass({
        ...nextState,
        stageTick: 0,
      });
    }
    return {
      ...nextState,
      caveWonTick: wonTick,
    };
  }

  nextState = moveCave(nextState, input);
  nextState = applyCaveAction(nextState, input);
  nextState = applyCaveDamage(nextState);
  if (nextState.scene === 'over') {
    return nextState;
  }
  nextState = applyCaveBeat(nextState, beat);

  return nextState;
};

const updateGrass = (state: GameState, input: UpdateInput, beat: boolean): GameState => {
  let nextState = state;

  if (nextState.grassWon) {
    const wonTick = nextState.grassWonTick + 1;
    if (wonTick >= 120) {
      return initBoss(nextState);
    }
    return {
      ...nextState,
      grassWonTick: wonTick,
    };
  }

  nextState = applyGrassAction(nextState, input);
  nextState = applyGrassBeat(nextState, beat);

  if (nextState.scene === 'over') {
    return nextState;
  }

  if (nextState.grassKills >= nextState.grassGoal && !nextState.grassWon) {
    return {
      ...nextState,
      grassWon: true,
      grassWonTick: 0,
      score: addScore(nextState.score, 3000 * nextState.loop),
      hp: clampHp(nextState.hp + 1, nextState.maxHp),
    };
  }

  return nextState;
};

const updateBoss = (state: GameState, input: UpdateInput, beat: boolean): GameState => {
  let nextState = state;

  if (nextState.bossWon) {
    const wonTick = nextState.bossWonTick + 1;
    if (wonTick >= 150) {
      if (nextState.loop >= 3) {
        return {
          ...nextState,
          scene: 'trueEnd',
          stageTick: 0,
        };
      }
      if (nextState.loop === 1) {
        return {
          ...nextState,
          scene: 'ending1',
          stageTick: 0,
        };
      }

      return initCave({
        ...nextState,
        loop: nextState.loop + 1,
        noDamage: true,
        endedByNoDamage: true,
        hp: clampHp(nextState.hp + 1, nextState.maxHp),
      });
    }
    return {
      ...nextState,
      bossWonTick: wonTick,
    };
  }

  if (input.isRightJustPressed) {
    nextState = {
      ...nextState,
      bossPos: (nextState.bossPos + 1) % 7,
    };
  }
  if (input.isLeftJustPressed) {
    nextState = {
      ...nextState,
      bossPos: (nextState.bossPos + 6) % 7,
    };
  }

  if (nextState.bossPos === 0 && !nextState.bossHasGem) {
    nextState = {
      ...nextState,
      bossHasGem: true,
    };
  }

  const currentIndex = nextState.bossPos - 1;
  if (input.isActionJustPressed && currentIndex >= 0 && currentIndex < 6) {
    const pedestalState = [...nextState.bossPedestalState] as GameState['bossPedestalState'];

    if (nextState.bossHasGem && pedestalState[currentIndex] === 0) {
      pedestalState[currentIndex] = 1;
      const pedCount = pedestalState.filter((value) => value > 0).length;
      nextState = {
        ...nextState,
        bossPedestalState: pedestalState,
        bossPedestals: pedCount,
        bossHasGem: false,
        score: addScore(nextState.score, 500 * nextState.loop),
      };

      if (pedCount >= BOSS_PEDESTAL_TARGET) {
        nextState = {
          ...nextState,
          bossWon: true,
          bossWonTick: 0,
          score: addScore(nextState.score, 5000 * nextState.loop + (nextState.noDamage ? 10000 * nextState.loop : 0)),
        };
      }
    } else if (pedestalState[currentIndex] === 1 && nextState.bossShields > 0) {
      pedestalState[currentIndex] = 2;
      nextState = {
        ...nextState,
        bossPedestalState: pedestalState,
        bossShields: nextState.bossShields - 1,
        score: addScore(nextState.score, 200 * nextState.loop),
      };
    }
  }

  if (input.isUpJustPressed && currentIndex >= 0 && currentIndex < 6) {
    const pedestalState = [...nextState.bossPedestalState] as GameState['bossPedestalState'];
    if (pedestalState[currentIndex] === 1 && nextState.bossShields > 0) {
      pedestalState[currentIndex] = 2;
      nextState = {
        ...nextState,
        bossPedestalState: pedestalState,
        bossShields: nextState.bossShields - 1,
        score: addScore(nextState.score, 200 * nextState.loop),
      };
    }
  }

  if (beat && nextState.bossPos > 0 && checkPlayerHit('boss', nextState.stageTick, nextState.loop)) {
    nextState = hurt(nextState, twoBeatDuration(nextState.loop));
    if (nextState.scene !== 'over') {
      nextState = {
        ...nextState,
        bossPos: 0,
        bossHasGem: false,
      };
    }
  }

  if (beat && nextState.bossPedestals > 0 && nextState.beatNum % 5 === 0) {
    const pedestalState = [...nextState.bossPedestalState] as GameState['bossPedestalState'];
    const stealIndex = pedestalState.findIndex((value) => value > 0);
    if (stealIndex >= 0) {
      if (pedestalState[stealIndex] === 2) pedestalState[stealIndex] = 1;
      else pedestalState[stealIndex] = 0;
      nextState = {
        ...nextState,
        bossPedestalState: pedestalState,
        bossPedestals: pedestalState.filter((value) => value > 0).length,
      };
    }
  }

  return nextState;
};

const updateEnding1 = (state: GameState, input: UpdateInput): GameState => {
  if (!input.isActionJustPressed) {
    return {
      ...state,
      tick: state.tick + 1,
      stageTick: state.stageTick + 1,
    };
  }

  return initCave({
    ...state,
    loop: 2,
    noDamage: true,
    endedByNoDamage: true,
  });
};

const updateTrueEnd = (state: GameState, input: UpdateInput): GameState => {
  if (!input.isActionJustPressed) {
    return {
      ...state,
      tick: state.tick + 1,
      stageTick: state.stageTick + 1,
    };
  }

  return resetForTitle(state);
};

const updatePlay = (state: GameState, input: UpdateInput): GameState => {
  let nextState = baseProgressState(state);
  const beatLength = resolveBeatLength(nextState.loop);
  let beat = false;
  let nextBeatCounter = nextState.beatCounter + 1;
  let nextBeatNum = nextState.beatNum;

  if (nextBeatCounter >= beatLength) {
    nextBeatCounter = 0;
    nextBeatNum += 1;
    beat = true;
  }

  nextState = {
    ...nextState,
    beatCounter: nextBeatCounter,
    beatNum: nextBeatNum,
    score: addScore(nextState.score, 1),
  };

  if (nextState.stage === 'cave') {
    return updateCave(nextState, input, beat);
  }
  if (nextState.stage === 'grass') {
    return updateGrass(nextState, input, beat);
  }
  return updateBoss(nextState, input, beat);
};

export const updateGameState = (state: GameState, input: UpdateInput): GameState => {
  if (input.isResetJustPressed) {
    return resetForTitle(state);
  }

  if (state.scene === 'title') {
    if (!input.isActionJustPressed) {
      return {
        ...state,
        tick: state.tick + 1,
      };
    }
    return startRunFromTitle(state);
  }

  if (state.scene === 'play') {
    return updatePlay(state, input);
  }

  if (state.scene === 'over') {
    if (input.isActionJustPressed) {
      return startRunFromTitle(state);
    }
    return {
      ...state,
      tick: state.tick + 1,
      stageTick: state.stageTick + 1,
    };
  }

  if (state.scene === 'ending1') {
    return updateEnding1(state, input);
  }

  return updateTrueEnd(state, input);
};
