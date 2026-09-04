/**
 * 灰燼の城壁 - カードプール（14種）とプリセットデッキ
 *
 * 数値は設計書 §7 の表（コスト帯0〜5・HPと攻撃力の逆相関）の値をそのまま持つ。
 * 攻撃塔5種の DPS/マナ（基礎値）は
 * 弓兵 0.500 > 弩砲 0.375 > 徹甲弩 0.292 > 火砲台 0.222 > 投石機 0.120。
 * 弓兵が単体効率で最高だが飛行に当たらない。徹甲弩は単体効率こそ中位だが、
 * 守り手から標的へ引いた直線上の敵すべてを貫くため、単体・範囲攻撃のどちらとも
 * 重ならない3つ目の軸を持つ（一直線に並ばない限り恩恵がない代わりに、
 * 並んだ相手には他のどの塔より効率が跳ね上がる）。効率の性格が敵の並び方で
 * 入れ替わるため、同名3枚上限と併せて単一の支配戦略が成立しない**はずだった**（設計書 §7）。
 *
 * **⚠️ 反復5 時点では成立していなかった。** 魔力炉だけ同名上限が無かったため
 * （当時の `maxCopiesOf('reactor')` は `DECK_SIZE`=20）、魔力炉5＋攻撃塔5種を
 * 各3枚で「壁も罠も持たない塔だけの20枚」が合法に組めていた。実測は
 * greedy 20/20・offPathOnly 12/20 で、`balance.test.ts` の不変条件
 * 「経路外のみは 4/20 未満」を3倍超で破っていた（`OFF_PATH_DOMINANT_DECK`。
 * 20枚時代の記録として同ファイルに凍結してある）。
 *
 * **反復6 で魔力炉の同名上限の例外を外した**（下記 `reactor` の定義を参照）。
 * ただし塔だけ12枚（魔力炉3＋攻撃塔3種×3）は依然として合法であり、
 * **支配デッキが解けたとは主張しない**（設計書 §4.5）。12枚デッキ空間の
 * 支配戦略は段階D で `expedition-balance.test.ts` が別に探索する。
 * 篝火・鍛冶場は攻撃せず（0ダメージ）、隣接する守り手を強化するだけのオーラ札。
 *
 * 石壁は type: 'trap'（40tick足止め）から守り手（type: 'tower', HP60・攻撃0）へ
 * 変わった（Task 10）。本モデルでは「HP60の壁」のほうが素直であり、
 * 足止めと石壁という2つの「止める」概念の重複も消える。
 */
import type { CardAvailability, CardDefinition } from './card-definition';

/** デッキの枚数（反復6 で 20 → 12。設計書 §4.6） */
export const DECK_SIZE = 12;

const CARDS: readonly CardDefinition[] = [
  {
    id: 'reactor',
    name: '魔力炉',
    type: 'reactor',
    cost: 0,
    description: '60tick ごとにマナを1得る。経路上には置けない。',
    reactor: { intervalTicks: 60, manaPerTick: 1 },
    // 盤面では3〜4基で消費レート（3マナ/60tick）を飽和させるため、並べるほど強くはならない。
    //
    // **反復6 で同名上限の例外を外した。** 20枚中3枚(15%)ではマナ基盤が
    // 確立する前にランが進んでいたため上限を外していたが、12枚中3枚は25%で
    // 確実に引ける。例外の理由が消えた。
    // **支配デッキ対策ではない**（設計書 §4.5——魔力炉3＋攻撃塔3種×3 の
    // 塔だけ12枚は依然として合法である。初版はここを論証の誤りで塞いだつもりでいた）
  },
  {
    id: 'arrow-tower',
    name: '弓兵',
    type: 'tower',
    cost: 1,
    description: '単体を速射する。安く、数で押す。飛行には当たらない。',
    tower: { hp: 8, range: 1.6, damage: 4, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
  },
  {
    id: 'ballista',
    name: '弩砲',
    type: 'tower',
    cost: 2,
    description: '射程が長く、飛行を撃ち落とせる。対空の標準解。',
    tower: { hp: 12, range: 2.4, damage: 9, cooldownTicks: 12, splashRadius: 0, hitsFlying: true },
  },
  {
    id: 'cannon-tower',
    name: '火砲台',
    type: 'tower',
    cost: 3,
    description: '着弾点の周囲にもダメージ。群れに強い。飛行には当たらない。',
    tower: { hp: 16, range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false },
  },
  {
    id: 'beacon',
    name: '篝火',
    type: 'tower',
    cost: 2,
    description: '攻撃しないが、隣接する守り手の攻撃力を +25% する。',
    tower: {
      hp: 8,
      range: 0,
      damage: 0,
      cooldownTicks: 0,
      splashRadius: 0,
      hitsFlying: false,
      aura: { towerDamageBonus: 0.25 },
    },
  },
  {
    id: 'forge',
    name: '鍛冶場',
    type: 'tower',
    cost: 1,
    description: '攻撃しないが、隣接する守り手の射程を +0.6 する。',
    tower: {
      hp: 8,
      range: 0,
      damage: 0,
      cooldownTicks: 0,
      splashRadius: 0,
      hitsFlying: false,
      aura: { towerRangeBonus: 0.6 },
    },
  },
  {
    id: 'spike-trap',
    name: '棘罠',
    type: 'trap',
    cost: 1,
    description: '経路に仕掛ける棘。地上の敵3体まで傷つける。',
    trap: { damage: 5, uses: 3 },
  },
  {
    id: 'ember-blast',
    name: '業火',
    type: 'ember',
    cost: 2,
    description: '半径2の地上敵に8ダメージ。燠火として残り、300tick 後に再点火できる。',
    ember: { radius: 2, damage: 8, cooldownTicks: 300 },
  },
  {
    id: 'mud-time',
    name: '時泥',
    type: 'spell',
    cost: 2,
    description: '200tick のあいだ、すべての敵の足を 40% 遅くする。',
    spell: { speedMultiplier: 0.6, durationTicks: 200 },
  },
  // 実効値の注記: 罠の判定（applyTraps）は移動（moveEnemies）の後に走るため、
  // 発動 tick T では敵が既に移動済みで、実際に止まるのは T+1〜T+groundedTicks。
  // つまり体感の地上化時間は 120 ではなく実効 119 tick になる。実装は変えず、注記だけ残す。
  {
    id: 'snare-net',
    name: '落網',
    type: 'trap',
    cost: 2,
    description: '経路に張る網。踏んだ飛行の敵を120tick 地に落とす。ダメージはない。',
    trap: { damage: 0, uses: 3, groundedTicks: 120 },
  },
  {
    id: 'stone-wall',
    name: '石壁',
    type: 'tower',
    cost: 1,
    description: '攻撃しないが非常に硬い。経路に置いて敵を食い止める。',
    tower: { hp: 60, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false },
  },
  {
    id: 'catapult',
    name: '投石機',
    type: 'tower',
    cost: 5,
    description: '遠くまで届き広く砕くが、間隔は長い。飛行には当たらない。',
    tower: { hp: 10, range: 3.0, damage: 18, cooldownTicks: 30, splashRadius: 2, hitsFlying: false },
  },
  {
    id: 'piercer',
    name: '徹甲弩',
    type: 'tower',
    // コスト帯を0〜5に広げる際、設計書 §7 の表で唯一コスト4を占めるのが徹甲弩。
    cost: 4,
    description: '一直線上の敵をまとめて貫く。飛行も撃てる。',
    tower: {
      hp: 14,
      range: 1.8,
      damage: 14,
      cooldownTicks: 12,
      splashRadius: 0,
      hitsFlying: true,
      piercing: true,
    },
  },
  {
    id: 'levy',
    name: '徴発',
    type: 'levy',
    cost: 1,
    description: '山札の上から3枚を見て1枚を手札に加える。残りは墓地へ。',
    levy: { peekCount: 3 },
    // **反復6 で構築・獲得の両プールから外した（設計書 §4.6）。**
    // 山札の上から3枚を一括で焼くため、12枚デッキでは山札の33%が一度に消える。
    // 実測で枯渇 tick 360→276、出せた枚数 11.3→10.1、無操作の尾 9.9%→20.8%。
    // 「獲得した札は次のステージで必ず引かれる」という構造的保証を壊す。
    // さらに「3枚見て1枚選ぶ」は獲得とまったく同じ動詞である。
    // 定義は残す（較正で20枚時代を再現するのに要る）。反復7 で12枚経済へ再設計する。
    availability: 'retired',
  },
];

const CARD_MAP: ReadonlyMap<string, CardDefinition> = new Map(CARDS.map((c) => [c.id, c]));

export const CARD_IDS: readonly string[] = CARDS.map((c) => c.id);

/** カード定義を取得する。未知の id は契約違反として例外 */
export const getCardDefinition = (id: string): CardDefinition => {
  const card = CARD_MAP.get(id);
  if (!card) {
    throw new Error(`未知のカードIDです: ${id}`);
  }
  return card;
};

/** 同名カードの上限。弓兵スパムを構造的に封じる（設計書 §7） */
export const MAX_COPIES = 3;

/** カードごとの同名上限。定義が無ければ MAX_COPIES */
export const maxCopiesOf = (id: string): number =>
  getCardDefinition(id).maxCopies ?? MAX_COPIES;

/** カードの入手経路。定義が無ければ 'buildable' */
export const availabilityOf = (id: string): CardAvailability =>
  getCardDefinition(id).availability ?? 'buildable';

/** 構築画面で選べる札 */
export const BUILDABLE_CARD_IDS: readonly string[] = CARD_IDS.filter(
  (id) => availabilityOf(id) === 'buildable'
);

/** 獲得の3択に出る札（buildable ＋ acquire-only） */
export const ACQUIRABLE_CARD_IDS: readonly string[] = CARD_IDS.filter(
  (id) => availabilityOf(id) !== 'retired'
);

export interface PresetDeck {
  id: string;
  name: string;
  description: string;
  cards: readonly string[];
}

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * プリセットデッキ2種（反復3 の再構成）
 *
 * プリセットは構築画面の「たたき台として読み込む」導線から使われる。ここが弱いと、
 * 素直に始めた人が引き運ではなくプリセットの弱さで連敗し、設計書 §7 の反証条件
 * （クリア不可の引きが3ラン中2ラン以上）に誤って当たってしまう。
 *
 * **魔力炉を8枚から4〜5枚へ減らした。** 8枚は配置クールダウンが全札に掛かって
 * いた時代の構成で、「置きたいのに置けない」時間をマナ源で埋める意味があった。
 * クールダウンが魔力炉だけになった今はマナが唯一の律速であり、盤面では3〜4基で
 * 消費レートを飽和させる。それ以上はマナが余って本命の札の枚数を削るだけになる。
 * 空いた枠は**石壁3枚**に充てた。経路上でブロックするという行為が反復3 の中核で、
 * たたき台がそれを1枚も持たないのは導線として成立しない。
 *
 * greedyStrategy（素直な戦略）・シード1〜20 での実測勝率:
 *
 * | 版     | 速攻型 | 重厚型 | 差 |
 * |--------|--------|--------|----|
 * | 反復3  |  8/20  |  7/20  | 1  |
 * | 反復5  | 13/20  |  8/20  | 5  |
 *
 * （反復3 の対照条件は 経路外のみ 0/20 ／ 壁と対空のみ 速攻型 1/20・重厚型 5/20。
 * 反復5 の経路外のみは 速攻型 1/20・重厚型 0/20）。反復2 の 10/20・13/20 とは
 * 敵側の構成が違うため直接比較できない（2レーン化で総HP 728→648→808・
 * レーン配分が変わっている）。
 *
 * **反復5 で速攻型が 8→13 へ跳ねたのは徹甲弩2枚を入れたため**（下記）。
 * その結果いったん 速攻型14・重厚型7 の差7 まで開き、プリセットの偏りの
 * 不変条件（差5以内）を割った。差を戻したのはデッキではなくウェーブ側で、
 * 重厚型が20ラン合計で鴉を125体漏らしていた（速攻型は15体）ことが分かったため
 * 鴉の出現間隔を 10 → 18 tick に緩めてある（waves.ts の docstring 参照）。
 * **プリセットの構成そのものは較正のために動かしていない。**
 *
 * 2種の性格の違いは残してある:
 * - 速攻型 = 手数寄り。安い弓兵・棘罠で数を捌き、群れは火砲台で潰す。対空は弩砲
 * - 重厚型 = 火力寄り。徹甲弩・投石機で硬い敵を抜き、飛行は落網で落として叩く
 * 共有しているのは魔力炉・石壁・弩砲・徴発だけで、主戦力の塔は重なっていない。
 *
 * **反復5 で速攻型にも重い帯を入れた。** それまで速攻型は最大コスト3 で、
 * これを選んだ人には「マナを貯めて重い札を出す」という反復5 の判断が
 * 一度も発生しなかった（設計書 §2.4）。手数寄りという性格は残すため、
 * 入れたのは徹甲弩2枚だけで、投石機（コスト5）は重厚型の専売のままにする。
 *
 * **注意: 配列の並び順にも意味がある。** createDeck のシャッフルは入力配列の順序に依存し、
 * 枚数構成が同一でも並べ替えるだけで実測勝率が動く（反復1 では 6/20〜11/20 の幅が出た）。
 * 較正の測定は下記の宣言順そのままで行った。「見やすさのために並べ替える」だけの
 * リファクタリングが較正を揺らすので、順序を変えたら balance.test.ts を必ず再実行すること。
 *
 * **⚠️ 反復6 で12枚版に作り直した。上の実測値は20枚時代のものである。**
 * 12枚版の較正は段階D で行う。それまでこの表の数値を根拠に使わないこと。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '石壁で受けつつ、安い弓兵と棘罠で手数を稼ぐ。群れは火砲台、対空は弩砲、仕上げに徹甲弩。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('stone-wall', 2),
      ...repeat('arrow-tower', 2),
      ...repeat('ballista', 2),
      'cannon-tower',
      'spike-trap',
      'piercer',
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '石壁で足を止め、徹甲弩と投石機で火力を通す。飛行は落網で落として叩く。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('stone-wall', 2),
      ...repeat('piercer', 2),
      ...repeat('snare-net', 2),
      'catapult',
      'ballista',
      'beacon',
    ],
  },
};
