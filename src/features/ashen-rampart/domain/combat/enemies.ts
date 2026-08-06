/**
 * 灰燼の城壁 - 敵定義（5種）
 *
 * 設計書 §6。カウンター要求を敵の性質で担う: 鴉(飛行)は対空手段（弩砲・徹甲弩・
 * 落網）を、俊足はテンポの速さを、重装は単体高火力を要求する。
 *
 * 群れについて: 「範囲攻撃を要求する」は反復2 までの想定だが、反復3 の較正で
 * 明示的に否定されている（範囲攻撃を抜いても 10/20 勝つ。詳細は run-simulation.ts
 * の hasMassAnswer / balance.test.ts の「範囲攻撃と貫通のそれぞれの寄与」参照）。
 * 実際の拘束は「群れをまとめて削る手段（範囲攻撃 **または** 貫通）」であり、
 * どちらか一方を持てば足りる。
 *
 * 位置について: 全ての敵は所属レーンの入口（progress:0）から出現する
 * （フィードバック#4への対応。「経路中盤から出現」という反復2 以前の仕様には
 * 戻していない。spawnAt 参照）。
 */
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  /** 移動速度（経路セル/tick） */
  speed: number;
  /** 飛行するか。true の敵には hitsFlying の塔と罠が当たらない */
  flying: boolean;
  /** 止められたときに守り手へ与えるダメージ */
  attack: number;
  /** 攻撃間隔（tick） */
  attackIntervalTicks: number;
  /**
   * 経路外の守り手にも届く攻撃の射程（セル）
   *
   * 0 なら、自分をブロックしている守り手しか殴らない（反復4 までの挙動）。
   * 0 より大きいと、進みながら射程内の守り手を削る（反復5・設計書 §4）。
   * **持たせるのは北レーン専属の2種だけ。** 南（俊足・群れ・鴉）に持たせると、
   * 群れ22体が同時に削るため上限3 でも盤面が溶ける（設計書 §4.3）。
   *
   * **この値で難度は較正できない（反復5 の実測）。** 較正の測定器である
   * greedyStrategy は攻撃札を shootingCellFor で置くため経路セルを優先し、
   * ほとんど経路外に置かない。1.5/1.2 → 2.5/2.0 → 3.5/3.0 と上げても20シードの
   * 勝率は1本も動かなかった。摩耗が効いていないのではなく、測定器が拾わない
   * （経路外にしか置かない対照条件では20シード中8シードで弓兵が壊れる）。
   * 難度を動かしたいときは waves.ts の数・タイミングを使うこと。
   */
  attackRange: number;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, flying: false, attack: 3, attackIntervalTicks: 20, attackRange: 1.2 },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, flying: false, attack: 2, attackIntervalTicks: 12, attackRange: 0 },
  { id: 'swarm', name: '群れ', hp: 8, speed: 0.12, flying: false, attack: 1, attackIntervalTicks: 15, attackRange: 0 },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, flying: false, attack: 10, attackIntervalTicks: 30, attackRange: 1.5 },
  // 鴉の攻撃は地上化中のみ使う。0 にすると落網で落とした鴉が壁の前で
  // 何もできず 120tick 膠着し、落網が「足止め」になってしまう（設計書 §8.2）
  { id: 'raven', name: '鴉', hp: 16, speed: 0.14, flying: true, attack: 2, attackIntervalTicks: 20, attackRange: 0 },
];

const ENEMY_MAP: ReadonlyMap<string, EnemySpec> = new Map(ENEMIES.map((e) => [e.id, e]));

export const ENEMY_IDS: readonly string[] = ENEMIES.map((e) => e.id);

export const getEnemySpec = (id: string): EnemySpec => {
  const spec = ENEMY_MAP.get(id);
  if (!spec) {
    throw new Error(`未知の敵IDです: ${id}`);
  }
  return spec;
};
