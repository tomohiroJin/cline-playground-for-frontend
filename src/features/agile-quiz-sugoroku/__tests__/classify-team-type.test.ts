/**
 * classifyTeamType のテスト
 */
import { classifyTeamType, TEAM_TYPES } from '../team-classifier';
import { ClassifyStats } from '../types';

describe('classifyTeamType', () => {
  // ── 各チームタイプへの分類 ────────────────────────────

  it('シナジーチーム: stab>=65, debt<=20, tp>=60', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 15, emSuc: 0, sc: [60, 70], tp: 65, spd: 7,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('synergy');
    expect(type.name).toBe('シナジーチーム');
    expect(type.emoji).toBe('🌟');
  });

  it('レジリエントチーム: emSuc>=2', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('resilient');
    expect(type.name).toBe('レジリエントチーム');
    expect(type.emoji).toBe('🔥');
  });

  it('成長するチーム: sc[0]<50, sc[last]>=65', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [40, 55, 70], tp: 55, spd: 8,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('evolving');
    expect(type.name).toBe('成長するチーム');
    expect(type.emoji).toBe('📈');
  });

  it('アジャイルチーム: spd<=5.5, tp>=50', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [60, 60], tp: 60, spd: 4.0,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('agile');
    expect(type.name).toBe('アジャイルチーム');
    expect(type.emoji).toBe('⚡');
  });

  it('もがくチーム: debt>=35', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 40, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('struggling');
    expect(type.name).toBe('もがくチーム');
    expect(type.emoji).toBe('💪');
  });

  it('結成したてのチーム: どの条件にも合わない場合', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 55, spd: 7,
    };
    const type = classifyTeamType(stats);
    expect(type.id).toBe('forming');
    expect(type.name).toBe('結成したてのチーム');
    expect(type.emoji).toBe('🌱');
  });

  // ── フィードバック・nextStep が存在すること ────────────

  it('各チームタイプにfeedbackとnextStepが定義されている', () => {
    TEAM_TYPES.forEach(type => {
      expect(type.feedback).toBeTruthy();
      expect(type.nextStep).toBeTruthy();
      expect(type.description).toBeTruthy();
    });
  });

  // ── 境界値テスト ──────────────────────────────

  it('シナジーチームの境界値: stab=65, debt=20, tp=60 → シナジー', () => {
    const stats: ClassifyStats = {
      stab: 65, debt: 20, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyTeamType(stats).id).toBe('synergy');
  });

  it('シナジーチームの境界外: stab=64 → シナジーにならない', () => {
    const stats: ClassifyStats = {
      stab: 64, debt: 20, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyTeamType(stats).id).not.toBe('synergy');
  });

  it('シナジーチームの境界外: debt=21 → シナジーにならない', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 21, emSuc: 0, sc: [60], tp: 60, spd: 7,
    };
    expect(classifyTeamType(stats).id).not.toBe('synergy');
  });

  it('レジリエントチームの境界値: emSuc=2 → レジリエント', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 30, emSuc: 2, sc: [40], tp: 40, spd: 8,
    };
    expect(classifyTeamType(stats).id).toBe('resilient');
  });

  it('レジリエントチームの境界外: emSuc=1 → レジリエントにならない', () => {
    const stats: ClassifyStats = {
      stab: 30, debt: 30, emSuc: 1, sc: [40], tp: 40, spd: 8,
    };
    expect(classifyTeamType(stats).id).not.toBe('resilient');
  });

  it('アジャイルチームの境界値: spd=5.5, tp=50', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 50, spd: 5.5,
    };
    expect(classifyTeamType(stats).id).toBe('agile');
  });

  it('アジャイルチームの境界外: spd=5.6 → アジャイルにならない', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 50, spd: 5.6,
    };
    expect(classifyTeamType(stats).id).not.toBe('agile');
  });

  it('もがくチームの境界値: debt=35 → もがく', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 35, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    expect(classifyTeamType(stats).id).toBe('struggling');
  });

  it('もがくチームの境界外: debt=34 → もがくにならない', () => {
    const stats: ClassifyStats = {
      stab: 10, debt: 34, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
    };
    expect(classifyTeamType(stats).id).not.toBe('struggling');
  });

  // ── 優先順位テスト ────────────────────────────

  it('シナジーがレジリエントより優先される', () => {
    const stats: ClassifyStats = {
      stab: 70, debt: 15, emSuc: 3, sc: [70, 70], tp: 70, spd: 7,
    };
    expect(classifyTeamType(stats).id).toBe('synergy');
  });

  it('レジリエントが成長するチームより優先される', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 2, sc: [40, 70], tp: 55, spd: 8,
    };
    expect(classifyTeamType(stats).id).toBe('resilient');
  });

  it('成長するチームにはsc.length>=2が必要', () => {
    const stats: ClassifyStats = {
      stab: 50, debt: 25, emSuc: 0, sc: [40], tp: 55, spd: 8,
    };
    expect(classifyTeamType(stats).id).not.toBe('evolving');
  });

  it('結成したてのチームは常に最後のフォールバック', () => {
    const defaultType = TEAM_TYPES[TEAM_TYPES.length - 1];
    expect(defaultType.id).toBe('forming');
    expect(defaultType.condition({} as ClassifyStats)).toBe(true);
  });

  // ── TEAM_TYPES配列の整合性 ────────────────────

  it('TEAM_TYPESは6種類定義されている', () => {
    expect(TEAM_TYPES).toHaveLength(6);
  });

  it('各チームタイプのIDがユニーク', () => {
    const ids = TEAM_TYPES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
