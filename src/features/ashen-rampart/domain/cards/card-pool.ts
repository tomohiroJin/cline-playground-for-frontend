/**
 * 灰燼の城壁 - P1 カードプール（8種）
 */
import type { CardDefinition } from './card-definition';

const CARDS: readonly CardDefinition[] = [
  {
    id: 'arrow-tower',
    name: '弓兵の塔',
    type: 'tower',
    cost: 2,
    rarity: 'common',
    description: '単体を速射する基本タワー。',
    tower: { range: 1.6, damage: 6, cooldownTicks: 8, splashRadius: 0 },
  },
  {
    id: 'cannon-tower',
    name: '火砲台',
    type: 'tower',
    cost: 3,
    rarity: 'rare',
    description: '着弾点の周囲にもダメージを与える重砲。攻撃間隔は長い。',
    tower: { range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1 },
  },
  {
    id: 'spike-trap',
    name: '棘罠',
    type: 'trap',
    cost: 1,
    rarity: 'common',
    description: '経路に仕掛ける棘。3体まで傷つける。',
    trap: { damage: 5, uses: 3 },
  },
  {
    id: 'pitfall',
    name: '落とし穴',
    type: 'trap',
    cost: 2,
    rarity: 'rare',
    description: '最初に踏んだ敵を確実に葬る一発罠。',
    trap: { damage: 999, uses: 1 },
  },
  {
    id: 'fire-blast',
    name: '業火',
    type: 'spell',
    cost: 2,
    rarity: 'common',
    description: '次のウェーブの敵全員に、現れた瞬間8ダメージ。',
    spell: { openingDamage: 8 },
  },
  {
    id: 'mud-time',
    name: '時泥',
    type: 'spell',
    cost: 2,
    rarity: 'rare',
    description: '次のウェーブの敵全員の足を 40% 遅くする。',
    spell: { speedMultiplier: 0.6 },
  },
  {
    id: 'supply',
    name: '補給',
    type: 'spell',
    cost: 1,
    rarity: 'common',
    description: 'ただちにマナを2得る。',
    spell: { gainMana: 2 },
  },
  {
    id: 'smith-blessing',
    name: '鍛冶の加護',
    type: 'tactic',
    cost: 2,
    rarity: 'rare',
    description: 'このステージの間、全タワーの攻撃力 +15%。',
    tactic: { towerAttackBonus: 0.15 },
  },
];

const CARD_MAP: ReadonlyMap<string, CardDefinition> = new Map(
  CARDS.map((c) => [c.id, c])
);

/** カード定義を取得する。未知の id は契約違反として例外 */
export const getCardDefinition = (id: string): CardDefinition => {
  const card = CARD_MAP.get(id);
  if (!card) {
    throw new Error(`未知のカードIDです: ${id}`);
  }
  return card;
};

/** 初期デッキ10枚: 基本タワー×6、基本スペル×3、罠×1 */
export const INITIAL_DECK: readonly string[] = [
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'fire-blast',
  'fire-blast',
  'supply',
  'spike-trap',
];

/** ウェーブクリア報酬の抽選プール */
export const REWARD_POOL: readonly string[] = [
  'cannon-tower',
  'pitfall',
  'mud-time',
  'smith-blessing',
  'arrow-tower',
  'fire-blast',
];
