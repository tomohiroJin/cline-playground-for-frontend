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

// 剰余計算の法。素数で gcd(100000, SEED_MODULUS) = 1 なので
// (now * 100000) % SEED_MODULUS は全単射。フォールバック値は値域 [0, SEED_MODULUS) 外に
// 設定することで自然出力との衝突を原理的に回避する。
const SEED_MODULUS = 2147483647;

export const createSeed = (): number => {
  // 同一ミリ秒での連続呼び出しでも衝突しないようカウンタを混ぜる。
  // Date.now() だけだとタイトなループで同じ値が返り、
  // 「毎ラン新しいシード」が成立しない。
  seedCounter = (seedCounter + 1) % 100000;
  const seed = ((Date.now() % SEED_MODULUS) * 100000 + seedCounter) % SEED_MODULUS;
  // seed が 0 になることはほぼないが、0 の場合は SeededRandom に渡せないため
  // フォールバックを返す。フォールバック値 SEED_MODULUS は自然出力の値域外なので衝突しない。
  return seed || SEED_MODULUS;
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
