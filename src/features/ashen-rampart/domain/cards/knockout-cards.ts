/**
 * 灰燼の城壁 - 軸ノックアウト変種の導出（純粋・葉モジュール・設計書 §8.2.15）
 *
 * **「その軸を持つ札を置かない」ではなく「札は残して、その軸の能力だけを消す」ための道具。**
 * 旧道具（`withoutAxisStrategy`）は落ちる札の枚数とコストが軸ごとに違い、
 * 飛行が1体もいないステージで対空を落とすと差16 が出ていた——軸ではなく
 * 「デッキから何割の火力が抜けたか」を測っていた（設計書 §8.2.15(a)）。
 *
 * **`card-pool` を import してはならない**（循環になる。§8.2.15(m)）。
 * 判定述語は `axis-of-card.ts` の `axesOfCard` を使い、ここで再実装しない。
 *
 * **`heavy-hit` の分割で DPS を保てない・軸の元になる `tower` が無いときは、
 * 個々の導出（`derivedFor`）は例外を投げる。** 静かに歪めると、この道具は
 * 旧道具と同じ「量の交絡」に戻るからである。ただし `deriveKnockouts` は
 * その例外をトップレベルへ伝播させず `failures` として集める（最終レビュー
 * I3・下記 docstring 参照）——ここが投げっぱなしだと `card-pool.ts` の
 * トップレベル評価が本番の起動ごと止まる。
 */
import type { CardDefinition } from './card-definition';
import { axesOfCard, type DemandAxis } from './axis-of-card';

/**
 * 変種 ID の接頭辞
 *
 * 基礎札の ID が構文的に取り得ない形にしてある（`card-pool.test.ts` が固定する）。
 * これにより `CARD_MAP` での衝突が起こりえず、`baseIdOf` の逆変換も一意になる。
 */
export const KNOCKOUT_ID_PREFIX = '!ko/';

/** 基礎札の ID から変種の ID を作る */
export const knockoutIdOf = (axis: DemandAxis, baseId: string): string =>
  `${KNOCKOUT_ID_PREFIX}${axis}/${baseId}`;

/**
 * 変種 ID を基礎札の ID へ戻す（基礎 ID はそのまま返す）
 *
 * 陰性対照が2つの腕の状態を比べるときに使う。腕どうしはカードIDだけが
 * 構造上必ず違うので、ここで正規化しないと深比較が使えない。
 */
export const baseIdOf = (id: string): string => {
  if (!id.startsWith(KNOCKOUT_ID_PREFIX)) return id;
  const separator = id.indexOf('/', KNOCKOUT_ID_PREFIX.length);
  return separator < 0 ? id : id.slice(separator + 1);
};

export interface KnockoutThresholds {
  blockHp: number;
  heavyHitDamage: number;
}

/** 変種の共通部分（入手経路を持たせない） */
const asVariant = (card: CardDefinition, axis: DemandAxis): CardDefinition => ({
  ...card,
  id: knockoutIdOf(axis, card.id),
  availability: 'retired',
});

/**
 * DPS を保ったまま `damage` を閾値未満へ落とす分割比
 *
 * `damage` と `cooldownTicks` の両方を割り切る最小の `k`（2以上）を探す。
 * 見つからなければ undefined（呼び出し側が例外にする）。
 */
const splitFactorFor = (
  damage: number,
  cooldownTicks: number,
  threshold: number
): number | undefined => {
  for (let k = 2; k <= damage; k++) {
    if (damage % k !== 0 || cooldownTicks % k !== 0) continue;
    if (cooldownTicks / k < 1) continue;
    if (damage / k < threshold) return k;
  }
  return undefined;
};

const withoutBlock = (card: CardDefinition, blockHp: number): CardDefinition => {
  const spec = card.tower;
  // **静かに undefined を返さない。** ここが undefined を返すと、呼び出し元の
  // `deriveKnockouts` がその変種を黙って欠落させ、`knockoutDeck` はノックアウト
  // されるはずの腕に基礎札をそのまま残してしまう（誰にも赤くならない失敗）。
  if (!spec) {
    throw new Error(`block のノックアウトを導出できません（tower を持たない）: ${card.id}`);
  }
  // 最小介入。閾値の1つ下まで下げれば軸は落ちる（8 まで落とすのは必要量の5倍以上）
  return { ...asVariant(card, 'block'), tower: { ...spec, hp: blockHp - 1 } };
};

const withoutAntiAir = (card: CardDefinition): CardDefinition => {
  const tower = card.tower;
  const trap = card.trap;
  return {
    ...asVariant(card, 'anti-air'),
    ...(tower ? { tower: { ...tower, hitsFlying: false } } : {}),
    // **削除せず 0 にする。** `applyTraps` は groundedTicks の有無で
    // 罠の対象（飛行か地上か）を決めているため、消すと極性が反転する
    ...(trap ? { trap: { ...trap, groundedTicks: 0 } } : {}),
  };
};

const withoutMassAnswer = (card: CardDefinition): CardDefinition => {
  const tower = card.tower;
  const ember = card.ember;
  return {
    ...asVariant(card, 'mass-answer'),
    ...(tower ? { tower: { ...tower, splashRadius: 0, piercing: false } } : {}),
    ...(ember ? { ember: { ...ember, radius: 0 } } : {}),
  };
};

const withoutHeavyHit = (card: CardDefinition, threshold: number): CardDefinition => {
  const spec = card.tower;
  if (!spec) {
    throw new Error(`heavy-hit のノックアウトを導出できません（tower を持たない）: ${card.id}`);
  }
  const factor = splitFactorFor(spec.damage, spec.cooldownTicks, threshold);
  if (factor === undefined) {
    throw new Error(
      `heavy-hit のノックアウトを導出できません（DPS を保った分割が無い）: ` +
        `${card.id} damage=${spec.damage} cooldownTicks=${spec.cooldownTicks}`
    );
  }
  return {
    ...asVariant(card, 'heavy-hit'),
    tower: { ...spec, damage: spec.damage / factor, cooldownTicks: spec.cooldownTicks / factor },
  };
};

const derivedFor = (
  card: CardDefinition,
  axis: DemandAxis,
  thresholds: KnockoutThresholds
): CardDefinition => {
  switch (axis) {
    case 'block':
      return withoutBlock(card, thresholds.blockHp);
    case 'anti-air':
      return withoutAntiAir(card);
    case 'mass-answer':
      return withoutMassAnswer(card);
    case 'heavy-hit':
      return withoutHeavyHit(card, thresholds.heavyHitDamage);
  }
};

/** 導出できなかった (カードID, 軸, 理由) の一覧と、導出できた変種の一覧 */
export interface KnockoutDerivation {
  variants: CardDefinition[];
  failures: readonly { cardId: string; axis: DemandAxis; reason: string }[];
}

/**
 * 基礎札の一覧から、軸ノックアウト変種をすべて導出する
 *
 * **変種を作るのは、その札が実際にその軸を持つときだけ。** 判定は `axesOfCard` に
 * 委ねるので、段階B で足す新カードも自動で拾われる（`axesOf` を ID 直書きに
 * しなかったのと同じ理由）。
 *
 * **失敗しても例外を投げない。** `card-pool.ts` はこの関数の結果をトップレベルで
 * 評価するので、ここで投げると本番バンドルの起動そのものが止まる（段階B で
 * カードを1枚足しただけで `damage`/`cooldownTicks` の公約数がたまたま無くなり、
 * feature 全体のテストが同時に赤くなる、という事態を避ける）。**導出できなかった
 * 分は `failures` に集め、呼び出し側が扱う。** 「静かに歪めない」という方針は
 * `failures` に載ることで守られる——欠落は消えず、`card-pool.test.ts` の
 * 1本が拾う。さらに `axis-knockout.ts` の `knockoutDeck` が、失敗した変種を
 * 実際にノックアウト腕へ差し込もうとした瞬間に例外で落とす（自己検査）。
 */
export const deriveKnockouts = (
  cards: readonly CardDefinition[],
  thresholds: KnockoutThresholds
): KnockoutDerivation => {
  const variants: CardDefinition[] = [];
  const failures: { cardId: string; axis: DemandAxis; reason: string }[] = [];
  cards.forEach((card) => {
    axesOfCard(card).forEach((axis) => {
      try {
        variants.push(derivedFor(card, axis, thresholds));
      } catch (error) {
        failures.push({
          cardId: card.id,
          axis,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    });
  });
  return { variants, failures };
};
