/**
 * 灰燼の城壁 - カードの視覚表現マッピング（純粋）
 *
 * enemy-visual.ts の対称物。敵を「形 × サイズ × 色」で区別するのに対し、
 * カードは「形 × サイズ × 文字」で区別する。色を使わないのは theme.ts の
 * 6トークンを増やさないため（設計書 §9.4）。
 *
 * (役割, サイズ) の組が14種で一意になることをテストで保証している。
 * これによりグレースケールでも——文字が読めない小ささでも——識別できる。
 */
import type { CardDefinition } from '../domain/cards/card-definition';
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

export type UnitRole =
  | 'attacker'
  | 'support'
  | 'wall'
  | 'trap'
  | 'reactor'
  | 'ember'
  | 'spell'
  | 'levy';

export interface UnitVisual {
  name: string;
  role: UnitRole;
  /** 個体を表す1文字 */
  glyph: string;
  /** セル辺に対する台座の辺長（%） */
  sizePct: number;
  /**
   * 横長プレートにするか（石壁のみ）
   *
   * サイズはコスト＝投資額を表すため、コスト1でHP60の石壁は小さくなる。
   * 横長にして面積を稼ぎ「硬さ」の直感との乖離を緩和する（設計書 §4.3）。
   */
  isWide: boolean;
}

const GLYPHS: Readonly<Record<string, string>> = {
  reactor: '炉',
  'arrow-tower': '弓',
  ballista: '弩',
  'cannon-tower': '砲',
  piercer: '徹',
  catapult: '投',
  forge: '鍛',
  beacon: '篝',
  'stone-wall': '壁',
  'spike-trap': '棘',
  'snare-net': '網',
  'ember-blast': '燠',
  'mud-time': '泥',
  levy: '徴',
};

/** 文字が全カードを網羅していることを起動時に保証する（card-text.ts と同じ取り漏れ検出） */
export const MISSING_GLYPH_IDS: readonly string[] = CARD_IDS.filter(
  (id) => GLYPHS[id] === undefined
);

const SIZE_BASE_PCT = 45;
const SIZE_PER_COST_PCT = 8;

/** コスト（投資額）を台座の辺長（セル辺に対する%）へ写す */
export const sizePctOf = (cost: number): number => SIZE_BASE_PCT + SIZE_PER_COST_PCT * cost;

/**
 * カードの役割を導出する
 *
 * 3つの塔系（攻撃塔・支援塔・壁）は damage と aura の有無で排他に分かれる。
 * 篝火・鍛冶場・石壁はいずれも damage 0 で、石壁だけ aura を持たない。
 */
export const roleOf = (card: CardDefinition): UnitRole => {
  if (card.type === 'trap') return 'trap';
  if (card.type === 'reactor') return 'reactor';
  if (card.type === 'ember') return 'ember';
  if (card.type === 'spell') return 'spell';
  if (card.type === 'levy') return 'levy';
  const tower = card.tower;
  if (!tower) throw new Error(`塔の性能を持たないカードIDです: ${card.id}`);
  if (tower.damage > 0) return 'attacker';
  if (tower.aura) return 'support';
  return 'wall';
};

export const getUnitVisual = (cardId: string): UnitVisual => {
  const card = getCardDefinition(cardId);
  const glyph = GLYPHS[cardId];
  if (glyph === undefined) throw new Error(`文字が未定義のカードIDです: ${cardId}`);
  const role = roleOf(card);
  return { name: card.name, role, glyph, sizePct: sizePctOf(card.cost), isWide: role === 'wall' };
};

const CLIP_PATHS: Readonly<Partial<Record<UnitRole, string>>> = {
  attacker: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  trap: 'polygon(0% 0%, 100% 0%, 50% 100%)',
  reactor: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  ember: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
  spell: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  levy: 'polygon(50% 0%, 100% 100%, 0% 100%)',
};

/** CSS clip-path の値。円（支援塔）と横長長方形（壁）は border-radius で描くため持たない */
export const getRoleClipPath = (role: UnitRole): string | undefined => CLIP_PATHS[role];

const ROLE_LABELS: Readonly<Record<UnitRole, string>> = {
  attacker: '攻撃塔',
  support: '支援塔',
  wall: '壁',
  trap: '罠',
  reactor: '魔力炉',
  ember: '燠火',
  spell: '呪文',
  levy: '徴発',
};

/** 役割の日本語ラベル（aria-label と能力チップで使う） */
export const roleLabelOf = (role: UnitRole): string => ROLE_LABELS[role];
