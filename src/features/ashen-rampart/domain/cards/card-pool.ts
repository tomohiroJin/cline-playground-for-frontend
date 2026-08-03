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
 * 入れ替わるため、同名3枚上限と併せて単一の支配戦略が成立しない（設計書 §7）。
 * 篝火・鍛冶場は攻撃せず（0ダメージ）、隣接する守り手を強化するだけのオーラ札。
 *
 * 石壁は type: 'trap'（40tick足止め）から守り手（type: 'tower', HP60・攻撃0）へ
 * 変わった（Task 10）。本モデルでは「HP60の壁」のほうが素直であり、
 * 足止めと石壁という2つの「止める」概念の重複も消える。
 */
import type { CardDefinition } from './card-definition';

/** デッキの枚数 */
export const DECK_SIZE = 20;

const CARDS: readonly CardDefinition[] = [
  {
    id: 'reactor',
    name: '魔力炉',
    type: 'reactor',
    cost: 0,
    description: '60tick ごとにマナを1得る。設置スロットを1つ使う。',
    reactor: { intervalTicks: 60, manaPerTick: 1 },
    // 盤面では3〜4基で消費レート（3マナ/60tick）を飽和させるため、
    // 並べるほど強くはならない。上限を外すのは「確実に引くため」である。
    // 20枚中3枚(15%)ではマナ基盤が確立する前にランが進んでしまっていた。
    maxCopies: DECK_SIZE,
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

export interface PresetDeck {
  id: string;
  name: string;
  description: string;
  cards: readonly string[];
}

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * プリセットデッキ2種（反復2 の再構成）
 *
 * プリセットは構築画面の「たたき台として読み込む」導線から使われる。ここが弱いと、
 * 素直に始めた人が引き運ではなくプリセットの弱さで連敗し、設計書 §7 の反証条件
 * （クリア不可の引きが3ラン中2ラン以上）に誤って当たってしまう。
 *
 * 魔力炉のデッキ内上限を外したため、MTG の土地比率（40枚中17枚＝42.5%）に
 * 近い **20枚中8枚（40%）** へ組み直した。盤面では3〜4基で消費レートを
 * 飽和させるため並べ得にはならず、増やす目的は「確実に引く」ことにある。
 * 敵側の数値は一切動かしていない（実プレイ判定の直前に難度を動かさない方針）。
 *
 * greedyStrategy（素直な戦略）・シード1〜20 での実測勝率は
 * **速攻型 10/20・重厚型 13/20**（魔力炉3枚構成では どちらも 8/20 だった）。
 *
 * 机上案（速攻=弩砲2＋時泥1／重厚=徹甲弩3・投石機2・落網2）は実測で 4/20・19/20 と
 * 極端に割れたため、内訳だけを調整した:
 * - 速攻型: 弩砲2→3・時泥1を削除（対空が弩砲2枚しかなく鴉13体で崩れていた）。4→10/20
 * - 重厚型: 徹甲弩3→2・落網2→3（対空が過剰で全ウェーブを抜けてしまっていた）。19→13/20
 *
 * 2種の性格の違いは残してある:
 * - 速攻型 = 手数寄り。安い弓兵・棘罠で数を捌き、群れは火砲台で潰す
 * - 重厚型 = 火力寄り。徹甲弩・投石機で硬い敵を抜き、飛行は落網で落として叩く
 * 共有しているのは魔力炉・弩砲・徴発だけで、主戦力の塔は重なっていない。
 *
 * **注意: 配列の並び順にも意味がある。** createDeck のシャッフルは入力配列の順序に依存し、
 * 枚数構成が同一でも並べ替えるだけで実測勝率が動く（反復1 では 6/20〜11/20 の幅が出た）。
 * 較正の測定は下記の宣言順そのままで行った。「見やすさのために並べ替える」だけの
 * リファクタリングが較正を揺らすので、順序を変えたら balance.test.ts を必ず再実行すること。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '安い弓兵と棘罠で手数を稼ぎ、群れは火砲台で潰す。対空は弩砲。',
    cards: [
      ...repeat('reactor', 8),
      ...repeat('arrow-tower', 3),
      ...repeat('spike-trap', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 2),
      ...repeat('levy', 1),
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '徹甲弩と投石機で火力を通し、飛行は落網で落として叩く。',
    cards: [
      ...repeat('reactor', 8),
      ...repeat('piercer', 2),
      ...repeat('catapult', 2),
      ...repeat('ballista', 2),
      ...repeat('snare-net', 3),
      ...repeat('ember-blast', 2),
      ...repeat('levy', 1),
    ],
  },
};
