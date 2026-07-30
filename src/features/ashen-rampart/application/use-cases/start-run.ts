/**
 * 灰燼の城壁 - ラン開始
 *
 * 乱数を使うのはここだけ。以後 stepTick は決定的に進むため、
 * シードを記録すればランを完全に再現できる。
 */
import type { RandomPort } from '../ports/random-port';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { validateDeck } from '../../domain/cards/deck-builder';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { PLAINS_WAVES } from '../../domain/combat/waves';

/**
 * 毎ラン新しいシードを作る
 *
 * PoC ではシード既定値が 1 に固定されており、明示的に変えない限り
 * 毎ラン同じドロー順になっていた（計測のための仕様が遊びを壊していた）。
 * 判定が終わったので既定を可変にする。固定はデバッグと反証条件の検証用に残す。
 */
let seedCounter = 0;

export const createSeed = (): number => {
  // 同一ミリ秒での連続呼び出しでも衝突しないようカウンタを混ぜる。
  // Date.now() だけだとタイトなループで同じ値が返り、
  // 「毎ラン新しいシード」が成立しない。
  seedCounter = (seedCounter + 1) % 100000;
  return ((Date.now() % 2147483647) * 100000 + seedCounter) % 2147483647 || 1;
};

/** 任意のカード配列からランを開始する。構築規則を満たさないデッキは契約違反 */
export const startRunWithDeck = (
  cards: readonly string[],
  random: RandomPort
): CombatState => {
  const validation = validateDeck(cards);
  if (!validation.isValid) {
    throw new Error(`デッキが構築規則を満たしていません: ${validation.errors.join(' / ')}`);
  }
  const deck = createDeck(cards, () => random.random());
  return createCombatState(deck, PLAINS_WAVES);
};

/** プリセットIDからランを開始する */
export const startRun = (presetId: string, random: RandomPort): CombatState => {
  const preset = PRESET_DECKS[presetId];
  if (!preset) {
    throw new Error(`未知のプリセットデッキです: ${presetId}`);
  }
  return startRunWithDeck(preset.cards, random);
};
