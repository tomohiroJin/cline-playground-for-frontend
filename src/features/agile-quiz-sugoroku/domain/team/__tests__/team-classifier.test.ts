/**
 * チームタイプ・エンジニアタイプ分類テスト
 */
import { classifyEngineerType } from '../team-classifier';
import { classifyTeamType, TEAM_TYPES } from '../../../team-classifier';
import { ENGINEER_TYPES } from '../../../constants';
import { createClassifyStats } from '../../testing/test-factories';

describe('classifyTeamType - チームタイプ分類', () => {
  // ── 各チームタイプへの分類 ────────────────────────────

  it('シナジーチーム: stab>=65, debt<=20, tp>=60', () => {
    const stats = createClassifyStats({ stab: 70, debt: 15, sc: [60, 70], tp: 65 });
    const type = classifyTeamType(stats);
    expect(type.id).toBe('synergy');
    expect(type.name).toBe('シナジーチーム');
    expect(type.emoji).toBe('🌟');
  });

  it('レジリエントチーム: emSuc>=2', () => {
    const stats = createClassifyStats({ stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8 });
    const type = classifyTeamType(stats);
    expect(type.id).toBe('resilient');
  });

  it('成長するチーム: sc[0]<50, sc[last]>=65', () => {
    const stats = createClassifyStats({ sc: [40, 55, 70], spd: 8 });
    const type = classifyTeamType(stats);
    expect(type.id).toBe('evolving');
  });

  it('アジャイルチーム: spd<=5.5, tp>=50', () => {
    const stats = createClassifyStats({ sc: [60, 60], tp: 60, spd: 4.0 });
    const type = classifyTeamType(stats);
    expect(type.id).toBe('agile');
  });

  it('もがくチーム: debt>=35', () => {
    const stats = createClassifyStats({ stab: 10, debt: 40, sc: [30, 30], tp: 30, spd: 10 });
    const type = classifyTeamType(stats);
    expect(type.id).toBe('struggling');
  });

  it('結成したてのチーム: どの条件にも合わない場合', () => {
    const stats = createClassifyStats();
    const type = classifyTeamType(stats);
    expect(type.id).toBe('forming');
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

  it('シナジーチームの境界値: stab=65, debt=20, tp=60', () => {
    const stats = createClassifyStats({ stab: 65, debt: 20, sc: [60], tp: 60 });
    expect(classifyTeamType(stats).id).toBe('synergy');
  });

  it('シナジーチームの境界外: stab=64', () => {
    const stats = createClassifyStats({ stab: 64, debt: 20, sc: [60], tp: 60 });
    expect(classifyTeamType(stats).id).not.toBe('synergy');
  });

  it('シナジーチームの境界外: debt=21', () => {
    const stats = createClassifyStats({ stab: 70, debt: 21, sc: [60], tp: 60 });
    expect(classifyTeamType(stats).id).not.toBe('synergy');
  });

  it('レジリエントチームの境界値: emSuc=2', () => {
    const stats = createClassifyStats({ stab: 30, debt: 30, emSuc: 2, sc: [40], tp: 40, spd: 8 });
    expect(classifyTeamType(stats).id).toBe('resilient');
  });

  it('レジリエントチームの境界外: emSuc=1', () => {
    const stats = createClassifyStats({ stab: 30, debt: 30, emSuc: 1, sc: [40], tp: 40, spd: 8 });
    expect(classifyTeamType(stats).id).not.toBe('resilient');
  });

  it('アジャイルチームの境界値: spd=5.5, tp=50', () => {
    const stats = createClassifyStats({ tp: 50, spd: 5.5 });
    expect(classifyTeamType(stats).id).toBe('agile');
  });

  it('アジャイルチームの境界外: spd=5.6', () => {
    const stats = createClassifyStats({ tp: 50, spd: 5.6 });
    expect(classifyTeamType(stats).id).not.toBe('agile');
  });

  it('もがくチームの境界値: debt=35', () => {
    const stats = createClassifyStats({ stab: 10, debt: 35, sc: [30, 30], tp: 30, spd: 10 });
    expect(classifyTeamType(stats).id).toBe('struggling');
  });

  it('もがくチームの境界外: debt=34', () => {
    const stats = createClassifyStats({ stab: 10, debt: 34, sc: [30, 30], tp: 30, spd: 10 });
    expect(classifyTeamType(stats).id).not.toBe('struggling');
  });

  // ── 優先順位テスト ────────────────────────────

  it('シナジーがレジリエントより優先される', () => {
    const stats = createClassifyStats({ stab: 70, debt: 15, emSuc: 3, sc: [70, 70], tp: 70 });
    expect(classifyTeamType(stats).id).toBe('synergy');
  });

  it('レジリエントが成長するチームより優先される', () => {
    const stats = createClassifyStats({ emSuc: 2, sc: [40, 70], spd: 8 });
    expect(classifyTeamType(stats).id).toBe('resilient');
  });

  it('成長するチームにはsc.length>=2が必要', () => {
    const stats = createClassifyStats({ sc: [40], spd: 8 });
    expect(classifyTeamType(stats).id).not.toBe('evolving');
  });

  // ── TEAM_TYPES配列の整合性 ────────────────────

  it('TEAM_TYPESは6種類定義されている', () => {
    expect(TEAM_TYPES).toHaveLength(6);
  });

  it('各チームタイプのIDがユニーク', () => {
    const ids = TEAM_TYPES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('結成したてのチームは常に最後のフォールバック', () => {
    const defaultType = TEAM_TYPES[TEAM_TYPES.length - 1];
    expect(defaultType.id).toBe('forming');
    expect(defaultType.condition(createClassifyStats({ stab: 0, debt: 0, sc: [], tp: 0, spd: 0 }))).toBe(true);
  });
});

describe('classifyEngineerType - エンジニアタイプ分類', () => {
  // ── 各タイプへの分類 ────────────────────────────

  it('安定運用型: stab>=65, debt<=20, tp>=60', () => {
    const stats = createClassifyStats({ stab: 70, debt: 15, sc: [60, 70], tp: 65 });
    const type = classifyEngineerType(stats);
    expect(type.id).toBe('stable');
    expect(type.name).toBe('安定運用型エンジニア');
  });

  it('火消し職人: emSuc>=2', () => {
    const stats = createClassifyStats({ stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8 });
    expect(classifyEngineerType(stats).id).toBe('firefighter');
  });

  it('成長曲線型: sc[0]<50, sc[last]>=65', () => {
    const stats = createClassifyStats({ sc: [40, 55, 70], spd: 8 });
    expect(classifyEngineerType(stats).id).toBe('growth');
  });

  it('高速レスポンス型: spd<=5.5, tp>=50', () => {
    const stats = createClassifyStats({ sc: [60, 60], tp: 60, spd: 4.0 });
    expect(classifyEngineerType(stats).id).toBe('speed');
  });

  it('技術的負債と共に生きる人: debt>=35', () => {
    const stats = createClassifyStats({ stab: 10, debt: 40, sc: [30, 30], tp: 30, spd: 10 });
    expect(classifyEngineerType(stats).id).toBe('debt');
  });

  it('デフォルト: どの条件にも合わない場合', () => {
    const stats = createClassifyStats();
    expect(classifyEngineerType(stats).id).toBe('default');
  });

  // ── 境界値テスト ──────────────────────────────

  it('安定運用型の境界値: stab=65, debt=20, tp=60', () => {
    const stats = createClassifyStats({ stab: 65, debt: 20, sc: [60], tp: 60 });
    expect(classifyEngineerType(stats).id).toBe('stable');
  });

  it('安定運用型の境界外: stab=64', () => {
    const stats = createClassifyStats({ stab: 64, debt: 20, sc: [60], tp: 60 });
    expect(classifyEngineerType(stats).id).not.toBe('stable');
  });

  it('安定運用型の境界外: debt=21', () => {
    const stats = createClassifyStats({ stab: 70, debt: 21, sc: [60], tp: 60 });
    expect(classifyEngineerType(stats).id).not.toBe('stable');
  });

  it('火消し職人の境界値: emSuc=2', () => {
    const stats = createClassifyStats({ stab: 30, debt: 30, emSuc: 2, sc: [40], tp: 40, spd: 8 });
    expect(classifyEngineerType(stats).id).toBe('firefighter');
  });

  it('火消し職人の境界外: emSuc=1', () => {
    const stats = createClassifyStats({ stab: 30, debt: 30, emSuc: 1, sc: [40], tp: 40, spd: 8 });
    expect(classifyEngineerType(stats).id).not.toBe('firefighter');
  });

  it('高速レスポンスの境界値: spd=5.5, tp=50', () => {
    const stats = createClassifyStats({ tp: 50, spd: 5.5 });
    expect(classifyEngineerType(stats).id).toBe('speed');
  });

  it('高速レスポンスの境界外: spd=5.6', () => {
    const stats = createClassifyStats({ tp: 50, spd: 5.6 });
    expect(classifyEngineerType(stats).id).not.toBe('speed');
  });

  it('技術的負債の境界値: debt=35', () => {
    const stats = createClassifyStats({ stab: 10, debt: 35, sc: [30, 30], tp: 30, spd: 10 });
    expect(classifyEngineerType(stats).id).toBe('debt');
  });

  it('技術的負債の境界外: debt=34', () => {
    const stats = createClassifyStats({ stab: 10, debt: 34, sc: [30, 30], tp: 30, spd: 10 });
    expect(classifyEngineerType(stats).id).not.toBe('debt');
  });

  // ── 優先順位テスト ────────────────────────────

  it('安定運用型が火消し職人より優先される', () => {
    const stats = createClassifyStats({ stab: 70, debt: 15, emSuc: 3, sc: [70, 70], tp: 70 });
    expect(classifyEngineerType(stats).id).toBe('stable');
  });

  it('火消し職人が成長曲線型より優先される', () => {
    const stats = createClassifyStats({ emSuc: 2, sc: [40, 70], spd: 8 });
    expect(classifyEngineerType(stats).id).toBe('firefighter');
  });

  it('成長曲線型にはsc.length>=2が必要', () => {
    const stats = createClassifyStats({ sc: [40], spd: 8 });
    expect(classifyEngineerType(stats).id).not.toBe('growth');
  });

  it('デフォルトは常に最後のフォールバック', () => {
    const defaultType = ENGINEER_TYPES[ENGINEER_TYPES.length - 1];
    expect(defaultType.id).toBe('default');
    expect(defaultType.condition(createClassifyStats({ stab: 0, debt: 0, sc: [], tp: 0, spd: 0 }))).toBe(true);
  });
});
