/**
 * 灰燼の城壁 - 遠征の開始とステージの開始（反復6・設計書 §4.4）
 *
 * **乱数はここでしか作らない。** そして単一ストリームではなく
 * 目的ごとの派生シードを使う——獲得する腕としない腕で、
 * 同じステージのシャッフルを共有させるため（設計書 §8.2 の G1）。
 *
 * 乱数オブジェクトを React の state / ref に置かないこと。
 * `StrictMode` で初期化子が二重に呼ばれ、ストリームが2回分進む。
 * ここは呼ばれるたびに派生シードから作り直すので冪等である。
 */
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { shuffle, INITIAL_HAND_SIZE, type DeckState } from '../../domain/cards/deck';
import { validateDeck, validateRuntimeDeck } from '../../domain/cards/deck-builder';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { drawStages } from '../../domain/expedition/stage-draw';
import {
  createExpedition, currentStage, type ExpeditionState,
} from '../../domain/expedition/expedition-state';

/**
 * 獲得した札を山札の末尾から数えて何枚目に挿すか
 *
 * 3 にしてあるのは「必ず引かれるが、序盤には来ない」位置にするため。
 * 12枚デッキなら山札は9枚で、獲得札は末尾から4枚目（残り3枚の手前）に入り、
 * ドロー間隔40 で tick 240 前後に手札へ来る。
 */
export const ACQUIRED_INSERT_OFFSET = 3;

/** 獲得札を山札の固定位置へ挿す。獲得が複数なら1枚ずつ手前へずらす */
const insertAcquired = (drawPile: readonly string[], acquired: readonly string[]): string[] => {
  let pile = [...drawPile];
  acquired.forEach((cardId, i) => {
    const position = Math.max(0, pile.length - ACQUIRED_INSERT_OFFSET - i);
    pile = [...pile.slice(0, position), cardId, ...pile.slice(position)];
  });
  return pile;
};

/** 遠征を開始する。構築規則を満たさないデッキは契約違反 */
export const startExpedition = (
  initialDeck: readonly string[],
  seed: number
): ExpeditionState => {
  const validation = validateDeck(initialDeck);
  if (!validation.isValid) {
    throw new Error(`デッキが構築規則を満たしていません: ${validation.errors.join(' / ')}`);
  }
  const drawRandom = new SeededRandom(derivedSeed(seed, 'stage-draw'));
  return createExpedition(seed, initialDeck, drawStages(() => drawRandom.random()));
};

/**
 * 現在のステージの戦闘状態を作る
 *
 * 検証は `validateRuntimeDeck`——`validateDeck` は枚数ちょうどを要求するため、
 * 獲得で13枚になった時点で必ず落ちる（初版の設計が落ちた箇所）。
 */
export const startStage = (exp: ExpeditionState): CombatState => {
  const stage = currentStage(exp);
  // `phase === 'ended'` を明示的にチェックする理由:
  // 敗北による終了は `stageIndex` を進めない（`completeStage` 参照）ため、
  // `currentStage` は負けた直後のステージ定義をそのまま返し続け、
  // `!stage` だけでは「敗北で終了した遠征」を検出できない
  // （クリアによる終了は `stageIndex` が範囲外になるため `!stage` で検出できるが、
  // 敗北による終了はそうならない）。ブリーフ Step 3 の元コードはこの分岐を
  // 見落としており、Step 4 のテスト「終了した遠征では契約違反」が RED のまま
  // だった。ここで契約を明文化する。
  if (exp.phase === 'ended' || !stage) {
    throw new Error('挑むステージがありません');
  }
  const validation = validateRuntimeDeck(exp.deckCards);
  if (!validation.isValid) {
    throw new Error(`遠征中のデッキが不正です: ${validation.errors.join(' / ')}`);
  }
  const shuffleRandom = new SeededRandom(derivedSeed(exp.seed, 'shuffle', exp.stageIndex));
  // **基底（構築時の12枚）だけをシャッフルし、獲得札は山札の固定位置へ挿入する。**
  // 獲得を含めた配列をシャッフルすると、枚数が変わるだけで並びが全面的に変わり、
  // 獲得する腕としない腕を比較できなくなる（設計書 §8.2。G1 が反転した初版の欠陥）。
  const shuffled = shuffle(exp.initialDeckCards, () => shuffleRandom.random());
  const deck: DeckState = {
    hand: shuffled.slice(0, INITIAL_HAND_SIZE),
    drawPile: insertAcquired(shuffled.slice(INITIAL_HAND_SIZE), exp.acquired),
    graveyard: [],
  };
  return createCombatState(deck, stage.waves, exp.life);
};
