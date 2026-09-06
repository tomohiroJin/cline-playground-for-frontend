import { startExpedition, startStage } from './start-expedition';
import { PRESET_DECKS, DECK_SIZE } from '../../domain/cards/card-pool';
import { INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { COUNTDOWN_TICKS, LIFE_INITIAL } from '../../domain/combat/combat-state';
import { currentStage, completeStage, declineOffer } from '../../domain/expedition/expedition-state';
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
});
