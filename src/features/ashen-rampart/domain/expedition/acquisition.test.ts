import { OFFER_SIZE, buildOffer, applyAcquisition } from './acquisition';
import { ACQUIRABLE_CARD_IDS, maxCopiesOf } from '../cards/card-pool';

const rngOf = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('buildOffer', () => {
  it('OFFER_SIZE は 3', () => {
    expect(OFFER_SIZE).toBe(3);
  });

  it('3枚を提示する', () => {
    expect(buildOffer([], rngOf([0.1, 0.5, 0.9]))).toHaveLength(OFFER_SIZE);
  });

  it('提示の3枚は互いに異なる', () => {
    const offer = buildOffer([], rngOf([0.1, 0.5, 0.9]));
    expect(new Set(offer).size).toBe(OFFER_SIZE);
  });

  it('獲得できない札（retired）は提示しない', () => {
    for (let i = 0; i < 50; i++) {
      const offer = buildOffer([], rngOf([i / 50, (i + 7) / 50, (i + 13) / 50]));
      offer.forEach((id) => expect(ACQUIRABLE_CARD_IDS).toContain(id));
    }
  });

  it('同名上限まで持っている札は提示しない', () => {
    const limit = maxCopiesOf('arrow-tower');
    const full = Array.from({ length: limit }, () => 'arrow-tower');
    for (let i = 0; i < 50; i++) {
      const offer = buildOffer(full, rngOf([i / 50, (i + 7) / 50, (i + 13) / 50]));
      expect(offer).not.toContain('arrow-tower');
    }
  });

  it('上限に1枚足りない札は提示されうる（境界）', () => {
    const limit = maxCopiesOf('arrow-tower');
    const nearlyFull = Array.from({ length: limit - 1 }, () => 'arrow-tower');
    const offered = new Set<string>();
    for (let i = 0; i < 200; i++) {
      buildOffer(nearlyFull, rngOf([i / 200, (i + 31) / 200, (i + 67) / 200])).forEach((id) =>
        offered.add(id)
      );
    }
    expect(offered).toContain('arrow-tower');
  });

  it('候補が OFFER_SIZE 未満なら、あるだけ返す（例外にしない）', () => {
    // すべての獲得可能カードを上限まで持っているデッキ
    const everything = ACQUIRABLE_CARD_IDS.flatMap((id) =>
      Array.from({ length: maxCopiesOf(id) }, () => id)
    );
    expect(buildOffer(everything, rngOf([0.5]))).toEqual([]);
  });

  it('同じ rng 列からは同じ提示（決定的）', () => {
    const a = buildOffer([], rngOf([0.2, 0.6, 0.8]));
    const b = buildOffer([], rngOf([0.2, 0.6, 0.8]));
    expect(a).toEqual(b);
  });

  it('rng が 1 を返しても提示が壊れない（丸めのガード）', () => {
    // RandomFn の契約は 0 以上 1 未満だが、テスト用スタブや将来の実装が 1 を
    // 返しても添字が範囲外にならないこと。clamp が無いと splice が空を返し、
    // 提示が OFFER_SIZE に満たなくなる。
    // **Task 8 のレビューで、同じ形の clamp がどのテストでも突かれておらず
    // 外しても全テストが緑のままだったことが判明したため、ここでは先に検査する。**
    const offer = buildOffer([], rngOf([1]));
    expect(offer).toHaveLength(OFFER_SIZE);
    offer.forEach((id) => expect(id).toBeDefined());
  });
});

describe('applyAcquisition', () => {
  it('選んだ札がデッキの末尾に加わる', () => {
    expect(applyAcquisition(['reactor'], ['arrow-tower', 'ballista', 'beacon'], 'ballista')).toEqual([
      'reactor',
      'ballista',
    ]);
  });

  it('元のデッキを変更しない（不変）', () => {
    const deck = ['reactor'];
    applyAcquisition(deck, ['arrow-tower'], 'arrow-tower');
    expect(deck).toEqual(['reactor']);
  });

  it('提示に無い札を選ぶと契約違反として例外', () => {
    expect(() => applyAcquisition([], ['arrow-tower'], 'catapult')).toThrow(
      '提示されていないカードです'
    );
  });
});
