import { drawStages } from './stage-draw';
import { stagesOfTier } from './stage-pool';

/** 決められた値を順に返す rng（決定性の検査用） */
const scriptedRng = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};

describe('drawStages', () => {
  it('層1→2→3 の順に3つ返す', () => {
    const stages = drawStages(scriptedRng([0]));
    expect(stages).toHaveLength(3);
    expect(stages.map((s) => s.tier)).toEqual([1, 2, 3]);
  });

  it('rng が 0 に近い値を返すと各層の1つ目を選ぶ', () => {
    const stages = drawStages(scriptedRng([0]));
    expect(stages[0]?.id).toBe(stagesOfTier(1)[0]?.id);
    expect(stages[1]?.id).toBe(stagesOfTier(2)[0]?.id);
    expect(stages[2]?.id).toBe(stagesOfTier(3)[0]?.id);
  });

  it('rng が 1 に近い値を返すと各層の2つ目を選ぶ', () => {
    const stages = drawStages(scriptedRng([0.999]));
    expect(stages[0]?.id).toBe(stagesOfTier(1)[1]?.id);
    expect(stages[1]?.id).toBe(stagesOfTier(2)[1]?.id);
    expect(stages[2]?.id).toBe(stagesOfTier(3)[1]?.id);
  });

  it('層ごとに1回ずつ rng を引く（消費数が固定＝再生可能性の前提）', () => {
    let calls = 0;
    drawStages(() => {
      calls++;
      return 0.5;
    });
    expect(calls).toBe(3);
  });

  it('同じ rng 列からは同じ結果（決定的）', () => {
    const a = drawStages(scriptedRng([0.1, 0.9, 0.4]));
    const b = drawStages(scriptedRng([0.1, 0.9, 0.4]));
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
  });

  it('8通りすべてが出うる（2×2×2）', () => {
    const combos = new Set<string>();
    [0, 0.999].forEach((a) =>
      [0, 0.999].forEach((b) =>
        [0, 0.999].forEach((c) => {
          combos.add(drawStages(scriptedRng([a, b, c])).map((s) => s.id).join('|'));
        })
      )
    );
    expect(combos.size).toBe(8);
  });
});
