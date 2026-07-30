/**
 * 灰燼の城壁 - カードプール（14種）とプリセットデッキ
 *
 * 数値は設計書 §5 の値をそのまま持つ。DPS/マナは
 * 弓兵 0.375 > 弩砲 0.277 > 火砲台 0.223 で弓兵が最効率だが、
 * 弓兵は飛行に当たらず同名3枚が上限のため支配戦略にならない（§7）。
 */
import type { CardDefinition } from './card-definition';

const CARDS: readonly CardDefinition[] = [
  {
    id: 'reactor',
    name: '魔力炉',
    type: 'reactor',
    cost: 0,
    description: '60tick ごとにマナを1得る。設置スロットを1つ使う。',
    reactor: { intervalTicks: 60, manaPerTick: 1 },
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

/** デッキの枚数 */
export const DECK_SIZE = 20;

/** 同名カードの上限。弓兵スパムを構造的に封じる（設計書 §7） */
export const MAX_COPIES = 3;

export interface PresetDeck {
  id: string;
  name: string;
  description: string;
  cards: readonly string[];
}

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * プリセットデッキ2種
 *
 * カード8種 × 同名3枚 = 24枚が上限のため、20枚デッキの差は
 * 魔力炉の数とコスト曲線に限られる（設計書 §5.1 の既知の限界）。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '安い札を多く回す。魔力炉は2枚。',
    cards: [
      ...repeat('reactor', 2),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 2),
      ...repeat('cannon-tower', 2),
      ...repeat('spike-trap', 3),
      ...repeat('mud-time', 3),
      ...repeat('ember-blast', 3),
      ...repeat('beacon', 2),
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '高コスト札を支えるため魔力炉を3枚積む。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('arrow-tower', 2),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('spike-trap', 2),
      ...repeat('mud-time', 2),
      ...repeat('ember-blast', 3),
      ...repeat('beacon', 2),
    ],
  },
};
