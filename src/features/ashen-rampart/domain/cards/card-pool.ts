/**
 * 灰燼の城壁 - カードプール（14種）とプリセットデッキ
 *
 * 数値は設計書 §3.4 / §5 の値をそのまま持つ。攻撃塔5種の DPS/マナ（基礎値）は
 * 弓兵 0.375 > 弩砲 0.278 > 徹甲弩 0.233 > 火砲台 0.222 > 投石機 0.111。
 * 弓兵が単体効率で最高だが飛行に当たらず、徹甲弩は最大HP40以上の敵に限り
 * 0.467 と弓兵を上回る。つまり効率の順位が敵によって入れ替わるため、
 * 同名3枚上限と併せて単一の支配戦略が成立しない（設計書 §3.4 / §7）。
 * 篝火・鍛冶場は攻撃せず（0ダメージ）、隣接塔を強化するだけのオーラ札。
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
    name: '弓兵の塔',
    type: 'tower',
    cost: 2,
    description: '単体を速射する。飛行には当たらない。',
    tower: { range: 1.6, damage: 6, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
  },
  {
    id: 'ballista',
    name: '弩砲',
    type: 'tower',
    cost: 3,
    description: '射程が長く、唯一飛行を撃ち落とせる。効率は低い。',
    tower: { range: 2.2, damage: 10, cooldownTicks: 12, splashRadius: 0, hitsFlying: true },
  },
  {
    id: 'cannon-tower',
    name: '火砲台',
    type: 'tower',
    cost: 3,
    description: '着弾点の周囲にもダメージ。群れに強い。飛行には当たらない。',
    tower: { range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false },
  },
  {
    id: 'beacon',
    name: '篝火',
    type: 'tower',
    cost: 2,
    description: '攻撃しないが、隣接する塔の攻撃力を +25% する。',
    tower: {
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
    cost: 2,
    description: '攻撃しないが、隣接する塔の射程を +0.6 する。',
    tower: {
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
  // つまり体感の地上化時間は 120 ではなく実効 119 tick になる。
  // 振る舞いは石壁と一貫しており実害がないため実装は変えず、注記だけ残す。
  {
    id: 'snare-net',
    name: '落網',
    type: 'trap',
    cost: 2,
    description: '経路に張る網。踏んだ飛行の敵を120tick 地に落とす。ダメージはない。',
    trap: { damage: 0, uses: 3, groundedTicks: 120 },
  },
  // 実効値の注記: 落網と同じ理由で、足止めは 40 ではなく実効 39 tick（T+1〜T+39）。
  {
    id: 'stone-wall',
    name: '石壁',
    type: 'trap',
    cost: 1,
    description: '経路を塞ぐ石。踏んだ地上の敵を40tick 足止めする。ダメージはない。',
    trap: { damage: 0, uses: 3, stunTicks: 40 },
  },
  {
    id: 'catapult',
    name: '投石機',
    type: 'tower',
    cost: 3,
    description: '遠くまで届き広く砕くが、間隔は長い。飛行には当たらない。',
    tower: { range: 3.0, damage: 8, cooldownTicks: 24, splashRadius: 2, hitsFlying: false },
  },
  {
    id: 'piercer',
    name: '徹甲弩',
    type: 'tower',
    cost: 3,
    description: '硬い敵を貫く。最大HP40以上の敵には2倍。飛行も撃てるが雑兵相手は非効率。',
    tower: {
      range: 1.8,
      damage: 7,
      cooldownTicks: 10,
      splashRadius: 0,
      hitsFlying: true,
      heavyBonusThreshold: 40,
      heavyBonusMultiplier: 2,
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
 * プリセットデッキ2種（14種前提の再構成。設計書 §5.1）
 *
 * プリセットは構築画面の「たたき台として読み込む」導線から使われる。ここが弱いと、
 * 素直に始めた人が引き運ではなくプリセットの弱さで連敗し、設計書 §7 の反証条件
 * （クリア不可の引きが3ラン中2ラン以上）に誤って当たってしまう。
 *
 * そこで反復1のレビュー是正で、両プリセットを「全要求充足寄り」に組み直した。
 * 敵側の数値は一切動かしていない（実プレイ判定の直前に難度を動かさない方針）。
 * greedyStrategy（素直な戦略）・シード1〜20 での実測勝率は **どちらも 10/20（50%）**。
 * 旧構成は swift 3/20・heavy 5/20 だった。
 *
 * 2種の性格の違いは残してある:
 * - 速攻型 = テンポ寄り。安い弓兵・棘罠・時泥で手数を稼ぎ、群れは火砲台で潰す
 * - 重厚型 = 火力寄り。徹甲弩・投石機を鍛冶場で伸ばし、飛行は落網で落として叩く
 * 共有しているのは魔力炉・弩砲・業火・徴発だけで、主戦力の塔は重なっていない。
 *
 * **注意: 配列の並び順にも意味がある。** createDeck のシャッフルは入力配列の順序に依存し、
 * 枚数構成が同一でも並べ替えるだけで実測勝率が 6/20〜11/20 の範囲で動いた。
 * 「見やすさのために並べ替える」だけのリファクタリングが較正を揺らすので、
 * 順序を変えたら balance.test.ts の勝率テストを必ず再実行すること。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '安い札を多く回す。対空は弩砲、群れは火砲台。',
    cards: [
      // 旧構成（3/20）は石壁・篝火など盤面に火力を足さない札で枠を使っていた。
      // それらを抜いて弩砲3・火砲台3・業火3 まで火力を厚くし、10/20 まで戻した。
      ...repeat('reactor', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('ember-blast', 3),
      ...repeat('spike-trap', 2),
      ...repeat('mud-time', 1),
      ...repeat('levy', 2),
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '射程と特効で固める。対空は徹甲弩と落網、弩砲で補う。群れは投石機。',
    cards: [
      // 旧構成（5/20）は対空を徹甲弩と落網だけに頼っていた。落網は経路の踏まれる位置に
      // 置けたときしか効かず、鴉13体を捌ききれずに落ちるランが多かった（実測）。
      // 弩砲2枚を対空の保険として足し、篝火2を業火・投石機の火力に置き換えて 10/20。
      ...repeat('reactor', 3),
      ...repeat('piercer', 3),
      ...repeat('catapult', 3),
      ...repeat('ballista', 2),
      ...repeat('ember-blast', 2),
      ...repeat('snare-net', 2),
      ...repeat('forge', 2),
      ...repeat('beacon', 1),
      ...repeat('levy', 2),
    ],
  },
};
