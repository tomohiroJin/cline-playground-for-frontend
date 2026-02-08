// ゲーム画面の種別
export type ScreenId = 'T' | 'Y' | 'G' | 'H' | 'HP' | 'R';

// パーク画面内の仮想画面
export type GamePhase = 'idle' | 'announce' | 'warn' | 'judge' | 'perks' | 'done';

// レーンインデックス（0=L, 1=C, 2=R）
export type LaneIndex = 0 | 1 | 2;

// キャラクターアートの状態
export type ArtKey = 'idle' | 'walk' | 'danger' | 'combo' | 'shield' | 'dead' | 'ghost' | 'safe';

// エモーションパネルの状態
export type EmoKey = 'idle' | 'walk' | 'danger' | 'combo' | 'safe' | 'shield' | 'dead';

// 入力アクション
export type InputAction = 'left' | 'right' | 'up' | 'down' | 'act' | 'back';

// ステージ設定
export interface StageConfig {
  /** サイクル数 */
  readonly cy: number;
  /** ビート速度(ms) */
  readonly spd: number;
  /** 同時障害数 */
  readonly si: number;
  /** フェイク障害有無 */
  readonly fk: boolean;
}

// ランタイムステージ設定（モディファイアで変更可能）
export interface RuntimeStageConfig {
  cy: number;
  spd: number;
  si: number;
  fk: boolean;
  _dblChance?: number;
  _scoreMod?: number;
  _fogShift?: number;
  _calm?: boolean;
}

// プレイスタイル定義
export interface StyleDef {
  readonly nm: string;
  readonly bf: readonly string[];
  readonly df: readonly string[];
  readonly mu: readonly number[];
  readonly rs: readonly number[];
  readonly wm: number;
  readonly cm: number;
  readonly sh: number;
  readonly sp: number;
  readonly db: number;
  readonly cb: number;
  readonly bfSet: readonly number[];
  readonly autoBlock?: number;
}

// マージ済みスタイル（ゲーム実行時に使用）
export interface MergedStyle {
  mu: number[];
  rs: number[];
  sf: number[];
  wm: number;
  cm: number;
  sh: number;
  sp: number;
  db: number;
  cb: number;
  bfSet: number[];
  autoBlock: number;
}

// ステージ修飾（モディファイア）
export interface ModDef {
  readonly id: string;
  readonly nm: string;
  readonly ds: string;
  readonly fn: (c: RuntimeStageConfig) => void;
}

// パーク定義
export interface PerkDef {
  readonly id: string;
  readonly nm: string;
  readonly ds: string;
  readonly tp: 'buff' | 'risk';
  readonly ic: string;
  readonly fn: (g: GameState) => void;
}

// ショップアイテム
export interface ShopItem {
  readonly id: string;
  readonly tp: 's' | 'u';
  readonly nm: string;
  readonly ds: string;
  readonly co: number;
}

// ヘルプアイテム
export interface HelpItem {
  readonly nm: string;
  readonly ds: string;
}

// ヘルプセクション
export interface HelpSection {
  readonly cat: string;
  readonly items: readonly HelpItem[];
}

// ランクテーブルエントリ
export interface RankEntry {
  readonly test: (score: number, cleared: boolean, stage: number) => boolean;
  readonly g: string;
  readonly c: string;
}

// ランク結果
export interface RankResult {
  readonly g: string;
  readonly c: string;
}

// セーブデータ
export interface SaveData {
  pts: number;
  plays: number;
  best: number;
  bestSt: number;
  sty: string[];
  ui: string[];
  eq: string[];
}

// ゲーム状態
export interface GameState {
  st: MergedStyle;
  score: number;
  stage: number;
  cycle: number;
  lane: LaneIndex;
  alive: boolean;
  phase: GamePhase;
  shields: number;
  frozen: number;
  moveOk: boolean;
  moveCd: number;
  comboCount: number;
  maxCombo: number;
  riskScore: number;
  total: number;
  nearMiss: number;
  scoreMult: number;
  comboBonus: number;
  slowMod: number;
  speedMod: number;
  revive: number;
  bfAdj: number;
  bfAdj_lane: number;
  bfAdj_extra: number;
  baseBonus: number;
  perks: PerkDef[];
  perkChoices: PerkDef[] | null;
  stageMod: ModDef | null;
  curStgCfg: RuntimeStageConfig | null;
  curBf0: number[];
  artState: ArtKey;
  maxStg: number;
  walkFrame: number;
  artFrame: number;
  shelterSaves: number;
  curObs?: number[];
}
