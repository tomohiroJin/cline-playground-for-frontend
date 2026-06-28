import { TITLES } from '../../../domain/constants/title-defs';
import { createMetaState } from '../../../domain/models/meta-state';

describe('真エンディング称号', () => {
  it('真END称号4種が存在する', () => {
    const ids = TITLES.map(t => t.id);
    for (const id of ['t_te_inheritor', 't_te_liberator', 't_te_inheritor_true', 't_te_liberator_true']) {
      expect(ids).toContain(id);
    }
  });

  it('t_te_inheritor は te_inheritor エンディングで解禁される', () => {
    const t = TITLES.find(x => x.id === 't_te_inheritor')!;
    expect(t.cond(createMetaState({ endings: [] }))).toBe(false);
    expect(t.cond(createMetaState({ endings: ['te_inheritor'] }))).toBe(true);
  });

  it('t_te_liberator は te_liberator エンディングで解禁される', () => {
    const t = TITLES.find(x => x.id === 't_te_liberator')!;
    expect(t.cond(createMetaState({ endings: [] }))).toBe(false);
    expect(t.cond(createMetaState({ endings: ['te_liberator'] }))).toBe(true);
  });

  it('t_te_inheritor_true は te_inheritor_true エンディングで解禁される', () => {
    const t = TITLES.find(x => x.id === 't_te_inheritor_true')!;
    expect(t.cond(createMetaState({ endings: [] }))).toBe(false);
    expect(t.cond(createMetaState({ endings: ['te_inheritor_true'] }))).toBe(true);
  });

  it('t_te_liberator_true は te_liberator_true エンディングで解禁される', () => {
    const t = TITLES.find(x => x.id === 't_te_liberator_true')!;
    expect(t.cond(createMetaState({ endings: [] }))).toBe(false);
    expect(t.cond(createMetaState({ endings: ['te_liberator_true'] }))).toBe(true);
  });
});
