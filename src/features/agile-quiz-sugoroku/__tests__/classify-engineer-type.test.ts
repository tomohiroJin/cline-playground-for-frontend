/**
 * classifyEngineerType のテスト
 */
import { ENGINEER_TYPES } from '../constants';
import { EngineerType, ClassifyStats } from '../types';

/** classifyEngineerType を再現（engineer-classifier.ts と同じロジック） */
function classifyEngineerType(data: ClassifyStats): EngineerType {
  return ENGINEER_TYPES.find((t) => t.condition(data)) ?? ENGINEER_TYPES[ENGINEER_TYPES.length - 1];
}

describe('classifyEngineerType', () => {
  // ── 各タイプへの分類 ────────────────────────────

  it('安定運用型: stab>=65, debt<=20, tp>=60', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 15, emSuc: 0, sc: [60, 70], tp: 65, spd: 7,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('stable');
    expect(type.name).toBe('安定運用型エンジニア');
  });

  it('火消し職人: emSuc>=2', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('firefighter');
  });

  it('成長曲線型: sc[0]<50, sc[last]>=65', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [40, 55, 70], tp: 55, spd: 8,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('growth');
  });

  it('高速レスポンス型: spd<=5.5, tp>=50', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [60, 60], tp: 60, spd: 4.0,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('speed');
  });

  it('技術的負債と共に生きる人: debt>=35', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 40, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('debt');
  });

  it('デフォルト: どの条件にも合わない場合', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 55, spd: 7,
    };
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('default');
  });

  // ── 境界値テスト ──────────────────────────────

  it('安定運用型の境界値: stab=65, debt=20, tp=60 → 安定運用型', () => {
    const stats: ClassifyStats = {
      stab: 65, debt: 20, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyEngineerType(stats).id).toBe('stable');
  });

  it('安定運用型の境界外: stab=64 → 安定運用型にならない', () => {
    const stats: ClassifyStats = {
      stab: 64, debt: 20, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyEngineerType(stats).id).not.toBe('stable');
  });

  it('安定運用型の境界外: debt=21 → 安定運用型にならない', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 21, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyEngineerType(stats).id).not.toBe('stable');
  });

  it('火消し職人の境界値: emSuc=2 → 火消し', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 30, emSuc: 2, sc: [40], tp: 40, spd: 8,
    };
    expect(classifyEngineerType(stats).id).toBe('firefighter');
  });

  it('火消し職人の境界外: emSuc=1 → 火消しにならない', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 30, emSuc: 1, sc: [40], tp: 40, spd: 8,
    };
    expect(classifyEngineerType(stats).id).not.toBe('firefighter');
  });

  it('高速レスポンスの境界値: spd=5.5, tp=50', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 50, spd: 5.5,
    };
    expect(classifyEngineerType(stats).id).toBe('speed');
  });

  it('高速レスポンスの境界外: spd=5.6 → 高速にならない', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 50, spd: 5.6,
    };
    expect(classifyEngineerType(stats).id).not.toBe('speed');
  });

  it('技術的負債の境界値: debt=35 → 負債タイプ', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 35, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    expect(classifyEngineerType(stats).id).toBe('debt');
  });

  it('技術的負債の境界外: debt=34 → 負債タイプにならない', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 34, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    expect(classifyEngineerType(stats).id).not.toBe('debt');
  });

  // ── 優先順位テスト ────────────────────────────

  it('安定運用型が火消し職人より優先される', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 15, emSuc: 3, sc: [70, 70], tp: 70, spd: 7,
    };
    // Both stable and firefighter conditions met
    expect(classifyEngineerType(stats).id).toBe('stable');
  });

  it('火消し職人が成長曲線型より優先される', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 2, sc: [40, 70], tp: 55, spd: 8,
    };
    // Both firefighter and growth conditions met
    expect(classifyEngineerType(stats).id).toBe('firefighter');
  });

  it('成長曲線型にはsc.length>=2が必要', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [40], tp: 55, spd: 8,
    };
    expect(classifyEngineerType(stats).id).not.toBe('growth');
  });

  it('デフォルトは常に最後のフォールバック', () => {
    const defaultType = ENGINEER_TYPES[ENGINEER_TYPES.length - 1];
    expect(defaultType.id).toBe('default');
    expect(defaultType.condition({} as ClassifyStats)).toBe(true);
  });
});
