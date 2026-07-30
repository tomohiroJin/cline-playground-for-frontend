/**
 * 灰燼の城壁 - カードの「効かない相手」文言（純粋）
 *
 * 設計原則「最高効率のカードには必ず効かない相手を作る」を
 * プレイヤーに開示する。14種から20枚を選ぶ画面では、
 * この手がかりが無いと「何のために積むか」が読み取れない。
 */
import { CARD_IDS } from '../domain/cards/card-pool';

const WEAKNESS: Readonly<Record<string, string>> = {
  reactor: '攻撃しない。スロットを1つ使う',
  'arrow-tower': '飛行に当たらない',
  ballista: '効かない相手はないが、コスト3で単体攻撃のみ',
  'cannon-tower': '飛行に当たらない。単体の硬い敵には非効率',
  catapult: '飛行に当たらない。間隔が長くマナ効率は最低',
  piercer: '最大HP40未満の敵には非効率（弓兵に劣る）',
  beacon: '常に0ダメージ（隣接する塔を強化するのみ）',
  forge: '常に0ダメージ（隣接する塔を強化するのみ）',
  'spike-trap': '飛行に当たらない。3体で尽きる',
  'snare-net': 'ダメージを与えない。地上の敵には無意味。3体で尽きる',
  'stone-wall': 'ダメージを与えない。飛行には無意味。3体で尽きる',
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
