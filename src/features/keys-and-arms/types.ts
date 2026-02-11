export type Scene = 'title' | 'play' | 'over' | 'ending1' | 'trueEnd';

export type Stage = 'cave' | 'grass' | 'boss';

export type VirtualKey =
  | 'arrowup'
  | 'arrowdown'
  | 'arrowleft'
  | 'arrowright'
  | 'z'
  | ' '
  | 'enter'
  | 'escape';

export interface GrassEnemy {
  lane: 0 | 1 | 2;
  step: number;
  beh: 'normal' | 'shifter' | 'dasher';
  dead: boolean;
  wait: number;
  shiftDir: -1 | 1;
  shifted: boolean;
  dashReady: boolean;
  spawnTick: number;
}

export interface GameState {
  scene: Scene;
  stage: Stage;
  score: number;
  hiScore: number;
  hp: number;
  maxHp: number;
  loop: number;
  tick: number;
  stageTick: number;
  endedByNoDamage: boolean;
  noDamage: boolean;
  beatCounter: number;
  beatNum: number;

  cavePos: number;
  caveDir: -1 | 1;
  caveKeys: number;
  cavePlaced: number;
  caveKeyOwned: [boolean, boolean, boolean];
  caveCarrying: boolean;
  caveTrapOn: boolean;
  caveTrapBeat: number;
  caveBatPhase: 0 | 1 | 2;
  caveBatBeat: number;
  caveMimicOpen: boolean;
  caveMimicBeat: number;
  cavePryCount: number;
  caveSpiderY: 0 | 1 | 2;
  caveSpiderBeat: number;
  caveHurtCd: number;
  caveWon: boolean;
  caveWonTick: number;
  caveCageProgress: number;

  grassKills: number;
  grassGoal: number;
  grassCombo: number;
  grassMaxSpawn: number;
  grassSpawned: number;
  grassGuards: number;
  grassAttackCd: number;
  grassHurtCd: number;
  grassWon: boolean;
  grassWonTick: number;
  grassSweepReady: boolean;
  grassNextShieldAt: number;
  grassEnemies: GrassEnemy[];
  earnedShields: number;

  bossPos: number;
  bossHasGem: boolean;
  bossPedestals: number;
  bossPedestalState: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2];
  bossShields: number;
  bossWon: boolean;
  bossWonTick: number;
}

export interface StageClearResult {
  nextStage?: Stage;
  nextScene?: Exclude<Scene, 'play'>;
  scoreBonus: number;
  hpBonus: number;
}
