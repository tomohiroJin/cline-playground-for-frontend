import { axesOf } from './stage-definition';

describe('axesOf（カードが満たす要求軸）', () => {
  it('石壁は block（HP60 の壁）', () => {
    expect(axesOf('stone-wall')).toContain('block');
  });

  it('弓兵は block を満たさない（HP8）', () => {
    expect(axesOf('arrow-tower')).not.toContain('block');
  });

  it('弩砲は anti-air（hitsFlying）', () => {
    expect(axesOf('ballista')).toContain('anti-air');
  });

  it('落網は anti-air（飛行を地上化する罠）', () => {
    expect(axesOf('snare-net')).toContain('anti-air');
  });

  it('弓兵は anti-air を満たさない（hitsFlying: false）', () => {
    expect(axesOf('arrow-tower')).not.toContain('anti-air');
  });

  it('火砲台は mass-answer（範囲）と heavy-hit（12ダメージ）を両方満たす', () => {
    expect(axesOf('cannon-tower')).toEqual(expect.arrayContaining(['mass-answer', 'heavy-hit']));
  });

  it('徹甲弩は mass-answer（貫通）を満たす', () => {
    expect(axesOf('piercer')).toContain('mass-answer');
  });

  it('業火は mass-answer を満たす', () => {
    expect(axesOf('ember-blast')).toContain('mass-answer');
  });

  it('弩砲は heavy-hit を満たさない（9ダメージ・境界の下側）', () => {
    // heavy-hit の閾値は 12。弩砲は 9 なので通らない。
    // 火砲台(12)がちょうど通り、弩砲(9)が通らないことで境界を検査している。
    expect(axesOf('ballista')).not.toContain('heavy-hit');
  });

  it('魔力炉はどの軸も満たさない', () => {
    expect(axesOf('reactor')).toEqual([]);
  });
});
