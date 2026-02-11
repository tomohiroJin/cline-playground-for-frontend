export type SceneState =
  | 'title'
  | 'transition'
  | 'cave'
  | 'grass'
  | 'boss'
  | 'over'
  | 'ending1'
  | 'trueEnd';

export type StageId = 'cave' | 'grass' | 'boss';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  act: boolean;
  reset: boolean;
}

export interface JustPressedState extends InputState {}

export interface StageProgress {
  caveCleared: boolean;
  grassCleared: boolean;
  bossCleared: boolean;
}

export interface TransitionState {
  label: string;
  timer: number;
}

export interface CoreGameState {
  scene: SceneState;
  loop: number;
  score: number;
  displayedScore: number;
  hp: number;
  maxHp: number;
  highScore: number;
  noDamageRun: boolean;
  transition: TransitionState | null;
  progress: StageProgress;
}

export interface DamageResult {
  nextState: CoreGameState;
  didDie: boolean;
}

export interface StageDifficulty {
  hazardCycle: number;
  moveWindow: number;
  bossArmSpeed: number;
  bossArmRest: number;
  bossShieldCount: number;
  trueEndingScore: number;
}
