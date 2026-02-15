export type Vector = {
  x: number;
  y: number;
};

export type Velocity = {
  vx: number;
  vy: number;
};

export type Entity = Vector & Velocity;

export type Mallet = Entity;

export type Puck = Entity & {
  visible: boolean;
  invisibleCount: number;
  trail?: Vector[];
};

export type ItemType = 'split' | 'speed' | 'invisible';

export type Item = Entity & {
  id: ItemType;
  name: string;
  color: string;
  icon: string;
  r: number;
};

export type EffectState = {
  speed: { start: number; duration: number } | null;
  invisible: number;
};

export type GameEffects = {
  player: EffectState;
  cpu: EffectState;
};

export type GoalEffect = {
  scorer: 'player' | 'cpu';
  time: number;
};

export type FeverState = {
  active: boolean;
  lastGoalTime: number;
  extraPucks: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type GameState = {
  player: Mallet;
  cpu: Mallet;
  pucks: Puck[];
  items: Item[];
  effects: GameEffects;
  flash: { type: ItemType; time: number } | null;
  goalEffect: GoalEffect | null;
  lastItemSpawn: number;
  cpuTarget: Vector | null;
  cpuTargetTime: number;
  fever: FeverState;
  particles: Particle[];
};

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Obstacle = Vector & { r: number };

export type FieldConfig = {
  readonly id: string;
  readonly name: string;
  readonly goalSize: number;
  readonly color: string;
  readonly obstacles: readonly Obstacle[];
};

export type SoundSystem = {
  hit: () => void;
  wall: () => void;
  item: () => void;
  goal: () => void;
  lose: () => void;
  start: () => void;
};

export type CanvasSize = 'standard' | 'large';

export type SizeConfig = {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
};
