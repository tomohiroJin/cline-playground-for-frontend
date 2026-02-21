import { themes } from './themes';

describe('themes', () => {
  it('6テーマが定義されていること', () => {
    expect(themes).toHaveLength(6);
  });

  it('テーマIDが一意であること', () => {
    const ids = themes.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('各テーマに画像が存在すること', () => {
    for (const theme of themes) {
      expect(theme.images.length).toBeGreaterThan(0);
    }
  });

  it('画像IDが一意であること', () => {
    const allImageIds = themes.flatMap(t => t.images.map(img => img.id));
    expect(new Set(allImageIds).size).toBe(allImageIds.length);
  });

  it('初期解放テーマが3つあること', () => {
    const alwaysThemes = themes.filter(t => t.unlockCondition.type === 'always');
    expect(alwaysThemes).toHaveLength(3);
  });

  it('ミステリーテーマの解放条件がthemesClearであること', () => {
    const mystery = themes.find(t => t.id === 'mystery');
    expect(mystery).toBeDefined();
    expect(mystery!.unlockCondition.type).toBe('themesClear');
  });
});
