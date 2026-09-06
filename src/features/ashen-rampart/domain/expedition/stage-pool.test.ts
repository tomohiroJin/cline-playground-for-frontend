import { PROVISIONAL_STAGES, stagesOfTier } from './stage-pool';
import { PLAINS_MAP } from '../board/stage-map';

describe('暫定ステージプール（段階A。段階B で置き換える）', () => {
  it('6ステージある', () => {
    expect(PROVISIONAL_STAGES).toHaveLength(6);
  });

  it('各層にちょうど2つある', () => {
    expect(stagesOfTier(1)).toHaveLength(2);
    expect(stagesOfTier(2)).toHaveLength(2);
    expect(stagesOfTier(3)).toHaveLength(2);
  });

  it('ID が一意', () => {
    const ids = PROVISIONAL_STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('要求軸の本数が層番号と一致する（設計書 §5.2 の A案）', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.demands).toHaveLength(stage.tier);
    });
  });

  it('同じ層の2ステージは要求軸の組み合わせが異なる（抽選に意味を持たせる）', () => {
    ([1, 2, 3] as const).forEach((tier) => {
      const [a, b] = stagesOfTier(tier);
      expect([...(a?.demands ?? [])].sort()).not.toEqual([...(b?.demands ?? [])].sort());
    });
  });

  it('凍結した PLAINS_MAP をそのまま参照している（改変していない）', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.map).toBe(PLAINS_MAP);
    });
  });

  it('ウェーブは空でなく、開始tick が昇順', () => {
    PROVISIONAL_STAGES.forEach((stage) => {
      expect(stage.waves.length).toBeGreaterThan(0);
      const ticks = stage.waves.map((w) => w.startTick);
      expect(ticks).toEqual([...ticks].sort((x, y) => x - y));
    });
  });
});
