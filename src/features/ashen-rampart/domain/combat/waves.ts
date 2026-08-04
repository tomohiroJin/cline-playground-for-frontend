/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * 反復3 の再較正。マップが2レーン（北=短い直線／南=長い迂回・滞留あり）に
 * 変わり、守り手が経路上でブロックできるようになったため、反復2 までの
 * 単一レーン前提の較正値（総HP728・全エントリがレーン0）は意味を失った。
 * ここでの数・タイミング・レーン配分は、balance.test.ts の不変条件5本が
 * 同時に成立する点として実測で決めてある（難度は快適さではなく仮説成立の条件）。
 *
 * 実測（greedyStrategy・シード1〜20・全要求充足デッキ）:
 *   素直な戦略 14/20 ／ 経路外のみ 0/20 ／ 壁と対空のみ 6/20
 *   対空なし 0/20 ／ 範囲なし 5/20
 *
 * 敵の種類は増やしていない（5種のまま）。動かしたのは数・タイミング・
 * レーン配分だけで、敵1体あたりの数値にも手を付けていない。
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
  // ウェーブ1: 北から雑兵だけ。まず1レーンを見ればよい導入
  {
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 }],
  },
  // ウェーブ2: 両レーンに分かれる。ここで初めて配分の判断が要る
  {
    startTick: 260,
    entries: [
      { enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 },
      // 俊足は南（長いが滞留がある）へ。速さと地形が打ち消し合う組み合わせで、
      // 「短い北に速い敵」より判断の余地が残る
      { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, laneIndex: 1 },
    ],
  },
  // ウェーブ3: 群れを南へ集中させる（範囲要求）。
  // ブロックで詰まるぶん反復2 の単一レーン時代より範囲攻撃が刺さるが、
  // 範囲なしの合法デッキでも 5/20 は勝つため「必ず負ける」は主張しない。
  // 南に寄せてあるのは滞留セル2つで隊列が縮み、単体攻撃との差が開くため。
  {
    startTick: 540,
    entries: [{ enemyId: 'swarm', count: 22, spawnIntervalTicks: 1, laneIndex: 1 }],
  },
  // ウェーブ4: 北に重装＋雑兵（壁を壊す圧力）、南に鴉（対空要求）
  {
    startTick: 820,
    entries: [
      { enemyId: 'brute', count: 2, spawnIntervalTicks: 15, laneIndex: 0 },
      // 鴉は「対空を無視すると必ず負ける」を数学的に保証する数。
      // LIFE_INITIAL(12) を上回る13体なので、全数漏らすと -13 ライフとなり必ず0を下回る。
      // 飛行はブロックを無視するため、この保証はレーンやブロックの有無に依存しない。
      // 「本当に鴉の漏れが敗因になっているか」は balance.test.ts の鴉単体ウェーブによる
      // 直接検証で別途確認している（このコメントの数値だけでは間接的な保証に留まるため）。
      // 難度較正では動かさない。
      { enemyId: 'raven', count: 13, spawnIntervalTicks: 10, laneIndex: 1 },
      { enemyId: 'grunt', count: 2, spawnIntervalTicks: 8, laneIndex: 0 },
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
