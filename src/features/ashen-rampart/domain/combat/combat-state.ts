/**
 * 灰燼の城壁 - 戦闘状態
 *
 * リアルタイムでは敵・盤面・手札・マナが相互に影響するため、
 * 1つの状態に集約する（設計書 §8.1）。分割すると追跡が難しくなる。
 */
import type { CellPos } from '../board/stage-map';
import type { DeckState } from '../cards/deck';
import type { WaveDefinition } from './waves';

/** 設置済みの守り手（攻撃しない石壁・篝火・鍛冶場を含む） */
export interface PlacedUnit {
  cardId: string;
  pos: CellPos;
  /** 現在のHP。0 で消滅する */
  hp: number;
  maxHp: number;
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
  /** 所属レーン上の進行度（0 = 入口、lane.length - 1 = 砦） */
  progress: number;
  spawnTick: number;
  /** どのレーンを進むか */
  laneIndex: number;
  alive: boolean;
  leaked: boolean;
  /** 地上化が切れる tick。この tick までは飛行敵も地上として扱う（落網） */
  groundedUntilTick: number;
}

/**
 * 撃破に至らせた主体
 *
 * 契約: **最後に削った者に帰属する**（オーバーキル分は問わない）。
 * 罠・射撃・業火は同じ tick 内で順に hpById を削るため、
 * 最後の書き込み者を記録する。
 */
export type DefeatSource =
  | { kind: 'unit'; index: number }
  | { kind: 'trap'; index: number }
  | { kind: 'ember'; index: number };

/** 溢れの由来。ドローで引いた札か、徴発で選んだ札か */
export type OverflowOrigin = 'draw' | 'levy';

export type TickEvent =
  | {
      kind: 'shot';
      unitIndex: number;
      targetId: number;
      /** 隣接オーラ（篝火）によって増えたダメージ量。オーラが無ければ 0 */
      auraDamageBonus: number;
      /** 素の射程では届かず、オーラ（鍛冶場）で初めて届いた射撃か */
      beyondBaseRange: boolean;
    }
  | { kind: 'trap'; trapIndex: number; targetId: number }
  | { kind: 'ember'; emberIndex: number }
  | { kind: 'defeat'; enemyId: number; source: DefeatSource }
  | { kind: 'leak'; enemyId: number }
  | { kind: 'unit-damaged'; unitIndex: number; pos: CellPos; enemyId: number; amount: number }
  | { kind: 'unit-lost'; unitIndex: number; cardId: string; pos: CellPos }
  | { kind: 'mana'; amount: number }
  | { kind: 'draw'; cardId: string }
  /**
   * 手札上限で墓地へ落ちた（反復5）
   *
   * `origin` は反復5 の敵対的検証で追加した。ドロー由来と徴発由来の2箇所が
   * 同じイベントを積んでおり、**ログ上で原理的に区別できなかった**。
   * 反復5 の判定では「tick 680 の溢れ＝最後の1枚を引いた瞬間」という読みを
   * したが、それがドロー由来だと確かめる手段が無かった（徴発が未使用だった
   * ため結果的に成立していただけ）。溢れに依存する指標を今後も使うなら
   * 由来の区別が要る。
   */
  | { kind: 'overflow'; cardId: string; origin: OverflowOrigin }
  /**
   * 手動の捨札が**実際に成立した**ことを表す（反復5・最終レビュー指摘3）
   *
   * 判定項目1（手動で捨てた回数）は出口条件（設計書 §8.6）の一部である。
   * これが無かったころ、集計は presentation 側で「捨札ボタンを押した回数」を
   * 数えていた。押した直後の tick で決着してアクションが消費されなかった場合や、
   * 短時間に2回押して手札 index がずれた場合、実際には捨てていないのに
   * カウントだけが増える（上振れ方向にしか誤らない）。
   * 成立を知っているのはドメインだけなので、ここでイベントとして名乗る。
   *
   * `handIndex`（反復6・設計書 §4.4）: 成立したときに実際に消えた添字。
   * `discardFromHand` は添字で消すため、同名札が手札に複数あると cardId
   * だけでは手札配列を再現できない。呼び出し側（presentation）はアクションを
   * 積んだ時点の添字しか知らず、同一 tick に複数の捨札要求が来て一部が
   * 不成立になった場合はその添字と成立結果がずれる。成立した添字を
   * 知っているのはドメインだけなので、cardId と同様にここで名乗る。
   */
  | { kind: 'discarded'; cardId: string; handIndex: number }
  | { kind: 'played'; cardId: string; pos?: CellPos }
  | { kind: 'rejected'; reason: 'cooldown' | 'mana' | 'target' | 'occupied' | 'pending' };

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
  units: PlacedUnit[];
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
  /** 徴発で提示中の候補。空配列なら選択待ちなし */
  levyOptions: string[];
}

/** 初期ライフ。Task 9 の再較正で 10→12（カウントダウン追加後の全滅を解消） */
export const LIFE_INITIAL = 12;

/**
 * ステージクリア時のライフ回復（反復6・設計書 §4.1）
 *
 * 遠征はライフを3ステージに持ち越すため、回復が無いと層1 の失点が
 * そのまま層3 の敗北を決める。**較正対象**（段階D）だが、
 * 「回復する」という符号自体は設計の一部なので 0 や負にはしない。
 */
export const STAGE_CLEAR_HEAL = 3;

/**
 * 溢れ1枚あたりのライフの対価（反復5・設計書 §5）
 *
 * 手札が上限のときに引いた札は墓地へ落ちるが、そこに値段が付いていなかったため
 * 「捨てているのはプレイヤーではなくゲームで、しかも無料」だった（反復4 の実測で
 * 溢れ23回 対 手動の捨札1回）。山札は抱えようが出そうが同じ速さで減るので、
 * **札を終盤へ運ぶ方法は手札に留めること以外に無く、留めれば溢れる。**
 * つまりこの値が、序盤の余剰と終盤の飢餓を交換するレートになる。
 *
 * ライフを選んだのは、現状ライフがほぼ余っているため（初期12 に対し反復4 の漏れは
 * 5ラン通して0〜3体）。マナを対価にすると、溢れが集中する序盤に詰みへ押す。
 */
export const OVERFLOW_LIFE_COST = 1;
export const MANA_INITIAL = 2;
export const DRAW_INTERVAL_TICKS = 40;
export const PLACE_COOLDOWN_TICKS = 60;

/**
 * 開始カウントダウンの長さ（tick）
 *
 * 3 → 2 → 1 を各 30 tick で表示する。この間、敵は出現しないが
 * マナ生成・ドロー・配置は動く（初手を置く猶予にするため）。
 * 実装は「ウェーブの startTick をこのぶんずらす」ことで行い、
 * spawnAt / isCleared の tick 計算には一切手を入れない。
 */
export const COUNTDOWN_TICKS = 90;

/** その tick 時点でカウントダウンの残り（0 なら開始済み） */
export const countdownLeftAt = (tick: number): number =>
  Math.max(0, COUNTDOWN_TICKS - tick);

/**
 * ラン開始時の戦闘状態を作る
 *
 * `initialLife` は遠征がステージ間でライフを持ち越すために使う（反復6）。
 * 省略時は `LIFE_INITIAL`——**既存の呼び出し110箇所を無変更で通すため。**
 */
export const createCombatState = (
  deck: DeckState,
  waves: readonly WaveDefinition[],
  initialLife: number = LIFE_INITIAL
): CombatState => ({
  tick: 0,
  life: initialLife,
  mana: MANA_INITIAL,
  placeCooldown: 0,
  ticksToDraw: DRAW_INTERVAL_TICKS,
  deck,
  units: [],
  traps: [],
  reactors: [],
  embers: [],
  enemies: [],
  slowUntilTick: 0,
  slowMultiplier: 1,
  // カウントダウンぶんウェーブ全体を後ろにずらす。
  // これにより出現も勝利判定も自然に止まる（fencepost 論理は不変）。
  waves: waves.map((w) => ({ ...w, startTick: w.startTick + COUNTDOWN_TICKS })),
  events: [],
  outcome: 'playing',
  levyOptions: [],
});
