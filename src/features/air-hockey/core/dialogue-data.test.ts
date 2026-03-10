/**
 * ダイアログデータの整合性テスト
 */
import { CHAPTER_1_STAGES } from './dialogue-data';
import { STORY_CHARACTERS } from './characters';
import { FIELDS } from './config';

describe('ダイアログデータ整合性', () => {
  it('第1章は3ステージある', () => {
    expect(CHAPTER_1_STAGES).toHaveLength(3);
  });

  it('ステージ ID が "1-1", "1-2", "1-3" である', () => {
    const ids = CHAPTER_1_STAGES.map(s => s.id);
    expect(ids).toEqual(['1-1', '1-2', '1-3']);
  });

  it.each(CHAPTER_1_STAGES)('ステージ $id の characterId がストーリーキャラに存在する', (stage) => {
    const validIds = [...Object.values(STORY_CHARACTERS).map(c => c.id), 'player'];
    // preDialogue の characterId も確認
    stage.preDialogue.forEach(d => {
      expect(validIds).toContain(d.characterId);
    });
    stage.postWinDialogue.forEach(d => {
      expect(validIds).toContain(d.characterId);
    });
    stage.postLoseDialogue.forEach(d => {
      expect(validIds).toContain(d.characterId);
    });
  });

  it.each(CHAPTER_1_STAGES)('ステージ $id の fieldId が FIELDS に存在する', (stage) => {
    const fieldIds = FIELDS.map(f => f.id);
    expect(fieldIds).toContain(stage.fieldId);
  });

  it.each(CHAPTER_1_STAGES)('ステージ $id にダイアログがある', (stage) => {
    expect(stage.preDialogue.length).toBeGreaterThan(0);
    expect(stage.postWinDialogue.length).toBeGreaterThan(0);
    expect(stage.postLoseDialogue.length).toBeGreaterThan(0);
  });

  it('難易度が easy → normal → hard の順になっている', () => {
    expect(CHAPTER_1_STAGES[0].difficulty).toBe('easy');
    expect(CHAPTER_1_STAGES[1].difficulty).toBe('normal');
    expect(CHAPTER_1_STAGES[2].difficulty).toBe('hard');
  });
});
