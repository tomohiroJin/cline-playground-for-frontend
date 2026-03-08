/**
 * 共通型定義
 */

/** バトルログエントリ */
export interface LogEntry {
  x: string;
  c: string;
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

/** 文明タイプ */
export type CivType = 'tech' | 'life' | 'rit';

/** 覚醒込みタイプ (調和含む) */
export type CivTypeExt = CivType | 'bal';

/** バイオームID */
export type BiomeId = 'grassland' | 'glacier' | 'volcano';

/** 最終戦含むバイオーム */
export type BiomeIdExt = BiomeId | 'final';

/** 文明レベル */
export interface CivLevels {
  tech: number;
  life: number;
  rit: number;
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

/** 環境ダメージ設定 */
export interface EnvDmgConfig {
  readonly base: number;
  readonly resist: 'iR' | 'fR';
  readonly immune: CivType | null;
  readonly icon: string;
  readonly c: string;
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
  /** ボス連戦数（1=通常、2以上で連戦） */
  readonly bb: number;
}

/** 速度オプション */
export type SpeedOption = readonly [string, number];

/** BGM タイプ */
export type BgmType = 'title' | 'grassland' | 'glacier' | 'volcano';

/** BGM パターン定義 */
export interface BgmPattern {
  readonly notes: readonly number[];
  readonly tempo: number;
  readonly wave: OscillatorType;
  readonly gain: number;
}

/** SFX タイプ */
export type SfxType = 'hit' | 'crit' | 'kill' | 'heal' | 'evo' | 'death' | 'click' | 'boss' | 'win' | 'skFire' | 'skHeal' | 'skRage' | 'skShield' | 'synergy' | 'event' | 'achv' | 'plDmg' | 'allyJoin' | 'civUp' | 'envDmg';

/** SFX 定義 */
export interface SfxDef {
  readonly f: readonly number[];
  readonly fd: number;
  readonly g: number;
  readonly gd: number;
  readonly w: OscillatorType;
}
