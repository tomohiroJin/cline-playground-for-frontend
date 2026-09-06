import { startExpedition, startStage } from './start-expedition';
import { advanceStage } from './advance-stage';
import { PRESET_DECKS, DECK_SIZE } from '../../domain/cards/card-pool';
import { shuffle, INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { COUNTDOWN_TICKS, LIFE_INITIAL } from '../../domain/combat/combat-state';
import {
  currentStage, completeStage, declineOffer, chooseAcquisition,
} from '../../domain/expedition/expedition-state';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { ACQUIRED_INSERT_OFFSET } from './start-expedition';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import type { SeededRandomFactory } from '../ports/random-port';

const preset = PRESET_DECKS.swift.cards;
// テストは application 層ではないので infrastructure を直接使ってよい。
// 本番の呼び出し元（将来の presentation 側の結線）と同じ factory 実装。
const randomFactory: SeededRandomFactory = createSeededRandom;

describe('startExpedition', () => {
  it('3ステージが層1→2→3 の順に決まる', () => {
    const exp = startExpedition(preset, 42, randomFactory);
    expect(exp.stages.map((s) => s.tier)).toEqual([1, 2, 3]);
  });

  it('同じシードからは同じ遠征（決定的）', () => {
    const a = startExpedition(preset, 42, randomFactory);
    const b = startExpedition(preset, 42, randomFactory);
    expect(a.stages.map((s) => s.id)).toEqual(b.stages.map((s) => s.id));
  });

  it('シードが違えば少なくとも一部のシードで別の並びになる', () => {
    const combos = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      combos.add(startExpedition(preset, seed, randomFactory).stages.map((s) => s.id).join('|'));
    }
    expect(combos.size).toBeGreaterThan(1);
  });

  it('構築規則を満たさないデッキは契約違反', () => {
    expect(() => startExpedition(['reactor'], 1, randomFactory)).toThrow(
      'デッキが構築規則を満たしていません'
    );
  });
});

describe('startStage', () => {
  it('現在のステージの台本で戦闘状態を作る', () => {
    const exp = startExpedition(preset, 42, randomFactory);
    const combat = startStage(exp, randomFactory);
    // 長さだけの比較だと「常に stages[0].waves を渡す」変異が生き残るため、
    // 内容そのものを比較する（レビュー指摘 M4）。
    // `createCombatState` が startTick を COUNTDOWN_TICKS ぶんずらすのは
    // 意図した変換（開始カウントダウンの間は敵を出現させないため）なので、
    // 期待値側にも同じ変換をかけたうえで比較する。
    const expectedWaves = currentStage(exp)!.waves.map((w) => ({
      ...w,
      startTick: w.startTick + COUNTDOWN_TICKS,
    }));
    expect(combat.waves).toEqual(expectedWaves);
  });

  it('遠征のライフで始まる（持ち越し）', () => {
    let exp = startExpedition(preset, 42, randomFactory);
    exp = completeStage(exp, { won: true, lifeLeft: 5 });
    // `completeStage` の直後は 'offer' フェーズ（獲得未解決）で、
    // startStage は 'stage' フェーズしか受け付けない（反復6 最終レビュー指摘 I8）。
    // 獲得を断って 'stage' へ進めてから呼ぶ。
    exp = declineOffer(exp);
    expect(startStage(exp, randomFactory).life).toBe(exp.life);
    expect(exp.life).toBeLessThan(LIFE_INITIAL);
  });

  it('山札は デッキ枚数 − 初期手札 で始まる', () => {
    const combat = startStage(startExpedition(preset, 42, randomFactory), randomFactory);
    expect(combat.deck.drawPile).toHaveLength(DECK_SIZE - INITIAL_HAND_SIZE);
  });

  it('同じ遠征・同じステージなら毎回同じシャッフル（決定的）', () => {
    const exp = startExpedition(preset, 42, randomFactory);
    expect(startStage(exp, randomFactory).deck.drawPile).toEqual(startStage(exp, randomFactory).deck.drawPile);
  });

  it('獲得しても初期手札は変わらない（基底のシャッフルを共有する）', () => {
    const base = startExpedition(preset, 42, randomFactory);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    expect(startStage(withCard, randomFactory).deck.hand).toEqual(startStage(base, randomFactory).deck.hand);
  });

  it('獲得した札は山札に入り、末尾から ACQUIRED_INSERT_OFFSET の位置にある', () => {
    const base = startExpedition(preset, 42, randomFactory);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const pile = startStage(withCard, randomFactory).deck.drawPile;
    expect(pile).toContain('beacon');
    expect(pile).toHaveLength(base.deckCards.length + 1 - INITIAL_HAND_SIZE);
    expect(pile[pile.length - 1 - ACQUIRED_INSERT_OFFSET]).toBe('beacon');
  });

  it('獲得札を除いた山札の並びは、獲得していない場合と一致する', () => {
    const base = startExpedition(preset, 42, randomFactory);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const withoutAcquired = startStage(withCard, randomFactory).deck.drawPile.filter((_, i, arr) =>
      i !== arr.length - 1 - ACQUIRED_INSERT_OFFSET
    );
    expect(withoutAcquired).toEqual(startStage(base, randomFactory).deck.drawPile);
  });

  it('獲得札は設計値どおり「末尾から3枚目」に入る（定数を経由せず直接検査する）', () => {
    // レビュー指摘 M1: 上の「末尾から ACQUIRED_INSERT_OFFSET の位置にある」テストは
    // 実装から ACQUIRED_INSERT_OFFSET を import して期待値を組み立てているため、
    // 定数自体を書き換える変異（例: 0 にする）を検出できない。
    //
    // 実際に `> pile.length / 2` という「後半に入る」検査も試したが、
    // OFFSET を 0 にすると獲得札は山札の**最後尾**（末尾から0枚目）に挿さり、
    // 最後尾は当然「後半」の範囲内にも入るため、この検査もすり抜けた
    // （0 と 3 のどちらでも `indexOf > length/2` は真になる。実測で確認済み）。
    // 後半かどうかではなく、設計値 3 そのものを定数を介さず埋め込んで検査する。
    const DESIGNED_OFFSET = 3;
    const base = startExpedition(preset, 42, randomFactory);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const pile = startStage(withCard, randomFactory).deck.drawPile;
    expect(pile[pile.length - 1 - DESIGNED_OFFSET]).toBe('beacon');
  });

  it('複数獲得でも両方が山札に入り、位置が決定的である', () => {
    // acquired が1枚だけだと insertAcquired の `i` の項（2枚目以降のずらし）と
    // `Math.max(0, ...)` の下限 clamp が一度も通らない（レビュー指摘 M2）。
    // Task 15 の完全再生テストは獲得2回を回すため、ここで先に検査しておく。
    //
    // レビュー指摘 I4: 上のコメントは「ここで先に検査しておく」と言いつつ、
    // 実際の assertion は `toContain` 2本と決定性だけで、`- i` の項や
    // clamp を経由しない変異（例: `- i` を落とす）でも緑のままだった。
    // 挿入位置そのものを直接検査する（`ACQUIRED_INSERT_OFFSET` = 3・
    // 実測で確認済み: 1枚目は末尾から3枚目、2枚目はさらに1つ手前に入る）。
    const base = startExpedition(preset, 42, randomFactory);
    const withCards = {
      ...base,
      deckCards: [...base.deckCards, 'beacon', 'forge'],
      acquired: ['beacon', 'forge'],
    };
    const pileA = startStage(withCards, randomFactory).deck.drawPile;
    const pileB = startStage(withCards, randomFactory).deck.drawPile;
    expect(pileA).toContain('beacon');
    expect(pileA).toContain('forge');
    expect(pileA).toEqual(pileB);
    expect(pileA[pileA.length - 1 - ACQUIRED_INSERT_OFFSET]).toBe('beacon');
    expect(pileA[pileA.length - 2 - ACQUIRED_INSERT_OFFSET]).toBe('forge');
  });

  it('ステージが違えばシャッフルも違う', () => {
    const exp = startExpedition(preset, 42, randomFactory);
    const first = startStage(exp, randomFactory).deck.drawPile;
    // completeStage 直後は 'offer' フェーズ。startStage は 'stage' しか
    // 受け付けないため、断って進めてから呼ぶ（反復6 最終レビュー指摘 I8）。
    const advanced = declineOffer(completeStage(exp, { won: true, lifeLeft: 9 }));
    const second = startStage(advanced, randomFactory).deck.drawPile;
    expect(second).not.toEqual(first);
  });

  it('終了した遠征では契約違反', () => {
    const ended = completeStage(startExpedition(preset, 42, randomFactory), { won: false, lifeLeft: 0 });
    expect(() => startStage(ended, randomFactory)).toThrow('挑むステージがありません');
  });

  // 設計書 §8.2.6(g) の P1: 「両腕の基底12枚のシャッフルが全ステージで同一」。
  // 検査方法として ground truth（shuffle(initialDeckCards, derivedSeed(...)) を
  // 独立に計算して照合すること）が指定されている。上のテスト群はどれも
  // 「結果が一致する」という間接証拠しか出しておらず、この方法を
  // 実行していない。ここで直接検査する。
  describe('P1（ground truth 照合）: 基底シャッフルは獲得内容に依存しない', () => {
    it('ground truth と一致する（獲得なしのステージ1・手札と山札の両方）', () => {
      const seed = 42;
      const exp = startExpedition(preset, seed, randomFactory);
      const combat = startStage(exp, randomFactory);

      // shuffle・derivedSeed・createSeededRandom を実装から独立に組み立て、
      // startStage の結果と照合する（実装内部の呼び出しを覗くのではなく、
      // 同じ入力から同じ計算を再現して比較する）。
      const groundTruthRandom = createSeededRandom(derivedSeed(seed, 'shuffle', exp.stageIndex));
      const groundTruthShuffled = shuffle(preset, () => groundTruthRandom.random());

      expect(combat.deck.hand).toEqual(groundTruthShuffled.slice(0, INITIAL_HAND_SIZE));
      // ステージ1（stageIndex 0）は獲得がまだ無いため、山札も
      // 残り9枚（12 − INITIAL_HAND_SIZE）と完全一致するはずである。
      expect(combat.deck.drawPile).toEqual(groundTruthShuffled.slice(INITIAL_HAND_SIZE));
    });

    it('ground truth と一致する（獲得ありのステージ2・基底12枚のみで計算した ground truth）', () => {
      // 上のテストは獲得が無いステージでしか検査していない。
      // `exp.deckCards`（獲得を含む13枚）を誤ってシャッフルする変異は、
      // 獲得が無いステージでは deckCards === initialDeckCards になるため
      // 検出できない。獲得後のステージで、ground truth 側は必ず
      // `exp.initialDeckCards`（基底12枚固定）から計算し、実装の出力と
      // 照合することで、この変異を確実に検出する。
      const seed = 42;
      let exp = startExpedition(preset, seed, randomFactory);
      exp = advanceStage(exp, { won: true, lifeLeft: 9 }, randomFactory);
      const offeredCard = exp.offer[0];
      if (offeredCard === undefined) {
        throw new Error('テストの前提が崩れている: 3択が空であってはならない');
      }
      exp = chooseAcquisition(exp, offeredCard);
      expect(exp.deckCards.length).toBe(preset.length + 1); // 前提: 獲得済みで13枚

      const combat = startStage(exp, randomFactory);
      const groundTruthRandom = createSeededRandom(derivedSeed(seed, 'shuffle', exp.stageIndex));
      const groundTruthShuffled = shuffle(exp.initialDeckCards, () => groundTruthRandom.random());

      expect(combat.deck.hand).toEqual(groundTruthShuffled.slice(0, INITIAL_HAND_SIZE));
    });

    it('獲得した札だけが違う2つの遠征でも、同じステージの初期手札は同一である', () => {
      // シード99など一部のシードでは、シャッフル後に獲得札が並びのどこへ
      // 落ちるかという偶然の位置関係により、`exp.deckCards`（獲得を含む配列）を
      // 誤ってシャッフルする変異でも手札3枚がたまたま一致してしまい、
      // この検査だけでは変異を検出できないことを実測で確認した
      // （上の ground truth テストは初期手札を独立に計算するためこの偶然に
      // 左右されず、その変異を確実に検出する）。ここでは実測で変異を
      // 確実に検出できると確認済みのシード5を使う。
      const seed = 5;
      const won = { won: true, lifeLeft: 9 };

      // 腕A・腕Bは同じシードから同じステージ1をクリアし、同じ3択を提示される
      // （advanceStage の派生シードは stageIndex にのみ依存するため）。
      const offeredA = advanceStage(startExpedition(preset, seed, randomFactory), won, randomFactory);
      const offeredB = advanceStage(startExpedition(preset, seed, randomFactory), won, randomFactory);
      expect(offeredA.offer).toEqual(offeredB.offer); // 前提: 同じ3択が出ている

      const firstChoice = offeredA.offer[0];
      const secondChoice = offeredA.offer[1];
      if (firstChoice === undefined || secondChoice === undefined) {
        throw new Error('テストの前提が崩れている: 3択に2種類以上の候補が必要');
      }

      // 腕Aと腕Bで、実際の獲得経路（chooseAcquisition）を通して
      // 違う札を獲得させる。これで「獲得した札だけが違う2つの遠征」になる。
      const expA = chooseAcquisition(offeredA, firstChoice);
      const expB = chooseAcquisition(offeredB, secondChoice);
      expect(expA.acquired).not.toEqual(expB.acquired); // 前提: 獲得内容が実際に違う
      expect(expA.deckCards.length).toBe(expB.deckCards.length); // 前提: 枚数の違いによる交絡ではない

      // P1 本体: 基底のシャッフルは獲得内容に依存しないので、
      // 次ステージの初期手札は腕A・腕Bで同一のはずである。
      const handA = startStage(expA, randomFactory).deck.hand;
      const handB = startStage(expB, randomFactory).deck.hand;
      expect(handA).toEqual(handB);
    });
  });
});
