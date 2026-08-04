/**
 * 灰燼の城壁 - カードの「効かない相手」文言・守り手の数値表示（純粋）
 *
 * 設計原則「最高効率のカードには必ず効かない相手を作る」を
 * プレイヤーに開示する。14種から20枚を選ぶ画面では、
 * この手がかりが無いと「何のために積むか」が読み取れない。
 */
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

const WEAKNESS: Readonly<Record<string, string>> = {
  reactor: '攻撃しない。経路上には置けない',
  'arrow-tower': '飛行に当たらない',
  ballista: '効かない相手はないが、コスト2で単体攻撃のみ',
  'cannon-tower': '飛行に当たらない。単体の硬い敵には非効率',
  catapult: '飛行に当たらない。間隔が長くマナ効率は最低',
  piercer: '一直線に並んでいない敵には貫通の恩恵がなく、単体では割高',
  beacon: '常に0ダメージ（隣接する塔を強化するのみ）',
  forge: '常に0ダメージ（隣接する塔を強化するのみ）',
  'spike-trap': '飛行に当たらない。3体で尽きる',
  'snare-net': 'ダメージを与えない。地上の敵には無意味。3体で尽きる',
  'stone-wall': '常に0ダメージ（敵を食い止めるだけの壁）',
  'ember-blast': '飛行に当たらない。半径2の外には届かない',
  'mud-time': 'ダメージを与えない。盤面に残らない',
  levy: '盤面に何も残らない。山札が尽きると効果がない',
};

/** カードの「効かない相手」文言を返す。未知の id は契約違反として例外 */
export const weaknessTextOf = (cardId: string): string => {
  const text = WEAKNESS[cardId];
  if (text === undefined) {
    throw new Error(`文言が未定義のカードIDです: ${cardId}`);
  }
  return text;
};

/** 文言が全カードを網羅していることを起動時に保証する（開発時の取り漏れ検出） */
export const MISSING_WEAKNESS_IDS: readonly string[] = CARD_IDS.filter(
  (id) => WEAKNESS[id] === undefined
);

/**
 * 守り手のHP・攻撃力を短く表示する文言。守り手（tower spec を持つカード）で
 * なければ undefined
 *
 * HPと攻撃力の逆相関（石壁60/0 → 弓兵8/4、設計書 §7.2）は、盤面では戦闘中の
 * HPバーで読めるが、デッキを組む時点では読めない。弓兵8・弩砲12・投石機10・
 * 徹甲弩14 のように、コスト帯が離れたカード同士のHP差はこの表示なしでは
 * 判別できない。
 */
export const towerStatsTextOf = (cardId: string): string | undefined => {
  const tower = getCardDefinition(cardId).tower;
  if (!tower) return undefined;
  return `HP${tower.hp} / 攻撃${tower.damage}`;
};

/** 1秒あたりの tick 数。表示用に秒へ丸めるときだけ使う */
const TICKS_PER_SECOND = 10;

const toSeconds = (ticks: number): number => Math.ceil(ticks / TICKS_PER_SECOND);

/**
 * 手札とデッキ構築に出す主要数値（最大2つ）
 *
 * 面積が限られるため、そのカードの働きを最も端的に表す2つに絞る。
 * 3つ目以降は能力表示（盤面）とデッキ構築の「効かない相手」に譲る。
 */
export const cardStatsOf = (cardId: string): string[] => {
  const card = getCardDefinition(cardId);
  if (card.tower) return [`HP${card.tower.hp}`, `攻撃${card.tower.damage}`];
  if (card.trap) return [`ダメージ${card.trap.damage}`, `${card.trap.uses}回`];
  if (card.reactor)
    return [`マナ+${card.reactor.manaPerTick}`, `${toSeconds(card.reactor.intervalTicks)}秒`];
  if (card.ember) return [`ダメージ${card.ember.damage}`, `半径${card.ember.radius}`];
  if (card.spell)
    return [`速度x${card.spell.speedMultiplier}`, `${toSeconds(card.spell.durationTicks)}秒`];
  if (card.levy) return [`${card.levy.peekCount}枚から選ぶ`];
  throw new Error(`性能が未定義のカードIDです: ${cardId}`);
};

/** 属性バッジの上限。増やすと手札が読めなくなる（設計書 §6） */
export const MAX_CARD_BADGES = 2;

/**
 * 手札とデッキ構築に出す属性バッジ（最大2つ）
 *
 * 貫通と範囲は排他に扱う。徹甲弩は splashRadius 0 の貫通、火砲台と
 * 投石機は splashRadius > 0 の範囲であり、両方を持つカードは存在しない。
 */
export const cardBadgesOf = (cardId: string): string[] => {
  const tower = getCardDefinition(cardId).tower;
  if (!tower) return [];
  const badges: string[] = [];
  if (tower.hitsFlying) badges.push('対空');
  if (tower.piercing) badges.push('貫通');
  else if (tower.splashRadius > 0) badges.push('範囲');
  return badges.slice(0, MAX_CARD_BADGES);
};
