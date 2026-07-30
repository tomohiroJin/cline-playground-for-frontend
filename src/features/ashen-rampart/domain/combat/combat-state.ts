/**
 * 灰燼の城壁 - 戦闘状態
 *
 * リアルタイムでは敵・盤面・手札・マナが相互に影響するため、
 * 1つの状態に集約する（設計書 §8.1）。分割すると追跡が難しくなる。
 */
import type { CellPos } from '../board/stage-map';
import type { DeckState } from '../cards/deck';
import type { WaveDefinition } from './waves';

/** 設置済みの塔（篝火を含む） */
export interface PlacedTower {
  cardId: string;
  pos: CellPos;
  /** 次に撃てるまでの残り tick */
  cooldownLeft: number;
}

/** 設置済みの罠 */
export interface PlacedTrap {
  cardId: string;
  pos: CellPos;
  usesLeft: number;
  /** 既に踏んだ敵の id（同じ敵が同じ罠で二度傷つかない） */
  hitEnemyIds: number[];
}

/** 設置済みの魔力炉 */
export interface PlacedReactor {
  pos: CellPos;
  /** 次にマナを生むまでの残り tick */
  ticksToMana: number;
}

/** 設置済みの燠火 */
export interface PlacedEmber {
  pos: CellPos;
  /** 再点火までの残り tick。0 なら点火できる */
  cooldownLeft: number;
}

/** 盤面にいる敵 */
export interface ActiveEnemy {
  id: number;
  enemyId: string;
  hp: number;
  maxHp: number;
  /** 経路上の進行度（0 = 入口、path.length - 1 = 砦） */
  progress: number;
  spawnTick: number;
  /** 出現する経路 index */
  spawnPathIndex: number;
  alive: boolean;
  leaked: boolean;
  /** 地上化が切れる tick。この tick までは飛行敵も地上として扱う（落網） */
  groundedUntilTick: number;
  /** 足止めが切れる tick。この tick までは移動しない（石壁） */
  stunnedUntilTick: number;
}

export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetId: number }
  | { kind: 'trap'; trapIndex: number; targetId: number }
  | { kind: 'ember'; emberIndex: number }
  | { kind: 'defeat'; enemyId: number }
  | { kind: 'leak'; enemyId: number }
  | { kind: 'mana'; amount: number }
  | { kind: 'draw'; cardId: string }
  | { kind: 'overflow'; cardId: string }
  | { kind: 'played'; cardId: string; pos?: CellPos }
  | { kind: 'rejected'; reason: 'cooldown' | 'mana' | 'target' | 'occupied' };

export type RunOutcome = 'playing' | 'won' | 'lost';

export interface CombatState {
  tick: number;
  life: number;
  mana: number;
  /** 次に配置できるまでの残り tick。0 なら置ける */
  placeCooldown: number;
  /** 次のドローまでの残り tick */
  ticksToDraw: number;
  deck: DeckState;
  towers: PlacedTower[];
  traps: PlacedTrap[];
  reactors: PlacedReactor[];
  embers: PlacedEmber[];
  enemies: ActiveEnemy[];
  /** 時泥の効果が切れる tick（0 = 効果なし） */
  slowUntilTick: number;
  /** 時泥の効果中に適用する速度倍率（カード定義の speedMultiplier を反映） */
  slowMultiplier: number;
  waves: readonly WaveDefinition[];
  /** 直前の tick に起きたこと。描画とログが読む */
  events: TickEvent[];
  outcome: RunOutcome;
}

export const LIFE_INITIAL = 10;
export const MANA_INITIAL = 2;
export const DRAW_INTERVAL_TICKS = 40;
export const PLACE_COOLDOWN_TICKS = 60;

/** ラン開始時の戦闘状態を作る */
export const createCombatState = (
  deck: DeckState,
  waves: readonly WaveDefinition[]
): CombatState => ({
  tick: 0,
  life: LIFE_INITIAL,
  mana: MANA_INITIAL,
  placeCooldown: 0,
  ticksToDraw: DRAW_INTERVAL_TICKS,
  deck,
  towers: [],
  traps: [],
  reactors: [],
  embers: [],
  enemies: [],
  slowUntilTick: 0,
  slowMultiplier: 1,
  waves,
  events: [],
  outcome: 'playing',
});
