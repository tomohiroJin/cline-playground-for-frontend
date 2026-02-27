/**
 * 原始進化録 - PRIMAL PATH - 型定義
 */

/** ゲームフェーズ */
export type GamePhase =
  | 'title'
  | 'diff'
  | 'how'
  | 'tree'
  | 'biome'
  | 'evo'
  | 'battle'
  | 'awakening'
  | 'prefinal'
  | 'ally_revive'
  | 'over';

/** 文明タイプ */
export type CivType = 'tech' | 'life' | 'rit';

/** 覚醒込みタイプ (調和含む) */
export type CivTypeExt = CivType | 'bal';

/** バイオームID */
export type BiomeId = 'grassland' | 'glacier' | 'volcano';

/** 最終戦含むバイオーム */
export type BiomeIdExt = BiomeId | 'final';

/** SFX タイプ */
export type SfxType = 'hit' | 'crit' | 'kill' | 'heal' | 'evo' | 'death' | 'click' | 'boss' | 'win' | 'skFire' | 'skHeal' | 'skRage' | 'skShield' | 'synergy';

/** SFX 定義 */
export interface SfxDef {
  readonly f: readonly number[];
  readonly fd: number;
  readonly g: number;
  readonly gd: number;
  readonly w: OscillatorType;
}

/** 難易度定義 */
export interface Difficulty {
  readonly n: string;
  readonly d: string;
  readonly env: number;
  readonly bm: number;
  readonly ul: number;
  readonly ic: string;
  readonly hm: number;
  readonly am: number;
}

/** 進化エフェクト */
export interface EvoEffect {
  readonly atk?: number;
  readonly def?: number;
  readonly cr?: number;
  readonly mhp?: number;
  readonly heal?: number;
  readonly full?: number;
  readonly sd?: number;
  readonly burn?: number;
  readonly half?: number;
  readonly aM?: number;
  readonly bb?: number;
  readonly aHL?: number;
  readonly revA?: number;
}

/** シナジータグ */
export type SynergyTag = 'fire' | 'ice' | 'regen' | 'shield' | 'hunt' | 'spirit' | 'tribe' | 'wild';

/** 進化定義 */
export interface Evolution {
  readonly n: string;
  readonly d: string;
  readonly t: CivType;
  readonly r: number;
  readonly e: EvoEffect;
  readonly tags?: readonly SynergyTag[];
}

/** シナジー効果 */
export type SynergyEffect =
  | { type: 'stat_bonus'; stat: 'atk' | 'hp' | 'def' | 'cr'; value: number }
  | { type: 'damage_multiplier'; target: 'burn' | 'all'; multiplier: number }
  | { type: 'heal_bonus'; ratio: number }
  | { type: 'ally_bonus'; stat: 'atk' | 'hp'; value: number }
  | { type: 'special'; id: 'awakening_boost' | 'awakening_power' | 'env_immune' }
  | { type: 'compound'; effects: readonly SynergyEffect[] };

/** シナジーボーナス定義 */
export interface SynergyBonusDef {
  readonly tag: SynergyTag;
  readonly tier1: {
    readonly name: string;
    readonly description: string;
    readonly effect: SynergyEffect;
  };
  readonly tier2: {
    readonly name: string;
    readonly description: string;
    readonly effect: SynergyEffect;
  };
}

/** 発動中のシナジー情報 */
export interface ActiveSynergy {
  tag: SynergyTag;
  count: number;
  /** 1=Tier1(タグ2個), 2=Tier2(タグ3個以上) */
  tier: 1 | 2;
  bonusName: string;
}

/** 味方テンプレート */
export interface AllyTemplate {
  readonly n: string;
  readonly hp: number;
  readonly atk: number;
  readonly t: CivType;
  readonly h?: number;
  readonly tk?: number;
}

/** 味方 (実行時) */
export interface Ally {
  n: string;
  hp: number;
  mhp: number;
  atk: number;
  t: CivType;
  a: number;
  h?: number;
  tk?: number;
}

/** 敵テンプレート */
export interface EnemyTemplate {
  readonly n: string;
  readonly hp: number;
  readonly atk: number;
  readonly def: number;
  readonly bone: number;
}

/** 敵 (実行時) */
export interface Enemy {
  n: string;
  hp: number;
  mhp: number;
  atk: number;
  def: number;
  bone: number;
}

/** ツリーエフェクト */
export interface TreeEffect {
  readonly bA?: number;
  readonly bH?: number;
  readonly bD?: number;
  readonly rr?: number;
  readonly bM?: number;
  readonly iR?: number;
  readonly fR?: number;
  readonly aH?: number;
  readonly aA?: number;
  readonly cr?: number;
  readonly sC?: number;
  readonly rg?: number;
  readonly rv?: number;
  readonly aS?: number;
  readonly eN?: number;
  readonly fQ?: number;
  readonly dM?: number;
  readonly aQ?: number;
  readonly rP?: number;
}

/** ツリーノード */
export interface TreeNode {
  readonly id: string;
  readonly n: string;
  readonly d: string;
  readonly c: number;
  readonly e: TreeEffect;
  readonly t: number;
  readonly cat: string;
  readonly r?: string;
}

/** バイオーム情報 */
export interface BiomeInfo {
  readonly ic: string;
  readonly nm: string;
  readonly ds: string;
}

/** ツリーボーナス (集計結果) */
export interface TreeBonus {
  bA: number;
  bH: number;
  bD: number;
  rr: number;
  bM: number;
  iR: number;
  fR: number;
  aH: number;
  aA: number;
  cr: number;
  sC: number;
  rg: number;
  rv: number;
  aS: number;
  eN: number;
  fQ: number;
  dM: number;
  aQ: number;
  rP: number;
}

/** ステートスナップショット (applyStatFx用) */
export interface StatSnapshot {
  atk: number;
  mhp: number;
  hp: number;
  def: number;
  cr: number;
  aM: number;
  burn: number;
  bb: number;
}

/** 覚醒エフェクト */
export interface AwakeningEffect {
  readonly atk?: number;
  readonly def?: number;
  readonly mhp?: number;
  readonly sd?: number;
  readonly burn?: number;
  readonly bb?: number;
  readonly allyAtkMul?: number;
  readonly allyFullHeal?: number;
}

/** 覚醒情報 */
export interface AwakeningInfo {
  readonly nm: string;
  readonly ds: string;
  readonly cl: string;
  readonly fx: AwakeningEffect;
  readonly bn?: string;
}

/** 覚醒記録 */
export interface AwokenRecord {
  id: string;
  nm: string;
  cl: string;
}

/** バトルログエントリ */
export interface LogEntry {
  x: string;
  c: string;
}

/** ラン実行ステート */
export interface RunState {
  hp: number;
  mhp: number;
  atk: number;
  def: number;
  cr: number;
  burn: number;
  aM: number;
  dm: number;
  cT: number;
  cL: number;
  cR: number;
  al: Ally[];
  bms: BiomeId[];
  cB: number;
  cBT: BiomeIdExt;
  cW: number;
  wpb: number;
  bE: number;
  bb: number;
  di: number;
  dd: Difficulty;
  fe: CivTypeExt | null;
  tb: TreeBonus;
  mxA: number;
  evoN: number;
  fReq: number;
  saReq: number;
  rvU: number;
  bc: number;
  log: LogEntry[];
  turn: number;
  kills: number;
  dmgDealt: number;
  dmgTaken: number;
  maxHit: number;
  wDmg: number;
  wTurn: number;
  awoken: AwokenRecord[];
  en: Enemy | null;
  sk: SkillSt;
  evs: Evolution[];
  _wDmgBase: number;
  _fbk: string;
  _fPhase: number;
}

/** セーブデータ */
export interface SaveData {
  bones: number;
  tree: Record<string, number>;
  clears: number;
  runs: number;
  best: Record<number, number>;
}

/** ゲーム全体ステート */
export interface GameState {
  phase: GamePhase;
  save: SaveData;
  run: RunState | null;
  finalMode: boolean;
  battleSpd: number;
  evoPicks: Evolution[];
  pendingAwk: { id: string; t: CivTypeExt; tier: number } | null;
  reviveTargets: Ally[];
  gameResult: boolean | null;
}

/** 速度オプション */
export type SpeedOption = readonly [string, number];

/** 文明レベル */
export interface CivLevels {
  tech: number;
  life: number;
  rit: number;
}

/** tick 結果 */
export interface TickResult {
  nextRun: RunState;
  events: TickEvent[];
}

/** tick イベント */
export type TickEvent =
  | { type: 'enemy_killed' }
  | { type: 'player_dead' }
  | { type: 'final_boss_killed' }
  | { type: 'sfx'; sfx: SfxType }
  | { type: 'shake_enemy' }
  | { type: 'flash_player_dmg' }
  | { type: 'flash_player_heal' }
  | { type: 'popup'; v: number; crit: boolean; heal: boolean; tgt: 'en' | 'pl' }
  | { type: 'skill_fx'; sid: ASkillId; v: number };

/** プレイヤー攻撃結果 */
export interface PlayerAttackResult {
  dmg: number;
  crit: boolean;
}

/** 進化適用結果 */
export interface ApplyEvoResult {
  nextRun: RunState;
  allyJoined: AllyTemplate | null;
  allyRevived: string | null;
}

/** 覚醒ルール */
export interface AwakeningRule {
  id: string;
  t: CivTypeExt;
  tier: number;
  ok: boolean;
}

/** 覚醒次情報 */
export interface AwakeningNext {
  nm: string;
  need: string;
  cl: string;
}

/** アクティブスキルID */
export type ASkillId = 'fB' | 'nH' | 'bR' | 'sW';

/** スキルエフェクト */
export type SkillFx =
  | { t: 'dmgAll'; bd: number; mul: number }
  | { t: 'healAll'; bh: number; aR: number }
  | { t: 'buffAtk'; aM: number; hC: number; dur: number }
  | { t: 'shield'; dR: number; dur: number };

/** アクティブスキル定義 */
export interface ASkillDef {
  readonly id: ASkillId;
  readonly nm: string;
  readonly ds: string;
  readonly ct: CivType | 'bal';
  readonly rL: number;
  readonly cd: number;
  readonly fx: SkillFx;
  readonly ic: string;
}

/** アクティブバフ */
export interface ABuff {
  sid: ASkillId;
  rT: number;
  fx: SkillFx;
}

/** スキルステート */
export interface SkillSt {
  avl: ASkillId[];
  cds: Partial<Record<ASkillId, number>>;
  bfs: ABuff[];
}

/** ダメージポップアップ */
export interface DmgPopup {
  v: number;
  x: number;
  y: number;
  cl: string;
  fs: number;
  a: number;
  lt: number;
}

/** 環境ダメージ設定 */
export interface EnvDmgConfig {
  readonly base: number;
  readonly resist: 'iR' | 'fR';
  readonly immune: CivType | null;
  readonly icon: string;
  readonly c: string;
}
