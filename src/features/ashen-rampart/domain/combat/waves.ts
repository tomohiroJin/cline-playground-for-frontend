/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * 設計書 §6 の較正値。総HP（Task 9 再較正後の値）は「15回の配置枠を使い切る必然性」
 * 「対空を無視すると必ず負ける」（鴉13体、LIFE_INITIAL を上回る数）「範囲攻撃を
 * 無視すると勝率が著しく落ちる」（群れ22体を1tick間隔の密な同時侵入）を両立させる
 * ために設定されており、難度は快適さではなく仮説成立の条件。
 *
 * 範囲攻撃だけは「必ず負ける」ではないことに注意。範囲攻撃を一切持たない合法デッキでも
 * 単体塔を厚く積めば一部のシードでは勝てる（実測 6/20。全要求充足デッキは 14/20）。
 * 「必ず負ける」を成立させるには群れをさらに増やす必要があるが、実プレイ判定の直前に
 * 敵側の較正を動かすリスクを避け、数値は据え置いて主張の側を実態に合わせた。
 *
 * 敵数を変更したら §9.3 の描画密度（スタック表示）を必ず再計算すること。
 */
import { getEnemySpec } from './enemies';

export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
  /** どのレーンに出すか。0 = 北（短い）、1 = 南（長い） */
  laneIndex: number;
}

export interface WaveDefinition {
  /** ラン開始からの絶対 tick。ウェーブは重なりうる */
  startTick: number;
  entries: WaveEntry[];
}

export const PLAINS_WAVES: readonly WaveDefinition[] = [
  // ウェーブ1: 雑兵の小隊
  {
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 }],
  },
  // ウェーブ2: 雑兵＋俊足（テンポ要求）
  {
    startTick: 250,
    entries: [
      { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
      { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, laneIndex: 0 },
    ],
  },
  // ウェーブ3: 群れの大量投入（範囲要求）
  {
    startTick: 500,
    entries: [
      // 群れは「範囲攻撃を無視すると勝率が著しく落ちる」を成立させる数（8→22、Task 9 是正）。
      // spawnIntervalTicks を3→1にして侵入を密にしたのは、単体攻撃だけでも時間さえあれば
      // いずれ倒し切れてしまうため（8体・間隔3では life9残しで楽勝できていた＝範囲要求が
      // 実質何も拘束していなかった）。22体・間隔1でも「必ず負ける」までは達しておらず、
      // 範囲なしの合法デッキは 6/20 で勝つ（対して全要求充足デッキは 14/20）。難度較正では動かさない。
      { enemyId: 'swarm', count: 22, spawnIntervalTicks: 1, laneIndex: 0 },
      { enemyId: 'grunt', count: 4, spawnIntervalTicks: 8, laneIndex: 0 },
    ],
  },
  // ウェーブ4: 重装＋鴉（属性要求。位置要求は Task 2 でスポーン位置を入口へ戻したため消滅）
  {
    startTick: 750,
    entries: [
      { enemyId: 'brute', count: 1, spawnIntervalTicks: 15, laneIndex: 0 },
      // 鴉は「対空を無視すると必ず負ける」を数学的に保証する数（3→10→13、Task 9 レビュー是正）。
      // LIFE_INITIAL(12) を上回る13体なので、全数漏らすと -13 ライフとなり必ず0を下回る。
      // 「本当に鴉の漏れが敗因になっているか」は balance.test.ts の鴉単体ウェーブによる
      // 直接検証で別途確認している（このコメントの数値だけでは間接的な保証に留まるため）。
      // 難度較正では動かさない。
      // ウェーブ4 の鴉。laneIndex を持つ形になり、経路中盤からの出現は無くなる
      // （フィードバック#4: 中盤スポーンは1マス幅の経路で守り手1体が全レーンを
      // 塞げてしまう問題とは別に、そもそも「経路のどこからともなく敵が湧く」
      // という不自然さの温床だった。以後は全ての敵が入口から進軍する）。
      { enemyId: 'raven', count: 13, spawnIntervalTicks: 10, laneIndex: 0 },
      { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
    ],
  },
];

/** 全ウェーブの敵の総体数 */
export const totalEnemyCount = (waves: readonly WaveDefinition[]): number =>
  waves.reduce((sum, w) => sum + w.entries.reduce((s, e) => s + e.count, 0), 0);

/** 全ウェーブの敵の総HP。バランス較正の基準値 */
export const totalEnemyHp = (waves: readonly WaveDefinition[]): number =>
  waves.reduce(
    (sum, w) =>
      sum + w.entries.reduce((s, e) => s + e.count * getEnemySpec(e.enemyId).hp, 0),
    0
  );
