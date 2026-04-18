/**
 * Chapter 2 ダイアログデータ整合性テスト（S8-3-5h〜5j）
 */
import { CHAPTER_2_STAGES } from './chapter2-dialogue-data';
import { findCharacterById } from './characters';
import type { Dialogue } from './story';

describe('Chapter 2 ダイアログデータ', () => {
  describe('ステージ定義の基本検証', () => {
    it('4 ステージが定義されている', () => {
      expect(CHAPTER_2_STAGES).toHaveLength(4);
    });

    it('ステージ ID が 2-1 〜 2-4 である', () => {
      expect(CHAPTER_2_STAGES.map(s => s.id)).toEqual(['2-1', '2-2', '2-3', '2-4']);
    });

    it('全ステージが chapter: 2 である', () => {
      for (const stage of CHAPTER_2_STAGES) {
        expect(stage.chapter).toBe(2);
      }
    });

    it('最終ステージ（2-4）のみ isChapterFinale が true', () => {
      const finale = CHAPTER_2_STAGES.find(s => s.id === '2-4');
      const nonFinale = CHAPTER_2_STAGES.filter(s => s.id !== '2-4');
      expect(finale?.isChapterFinale).toBe(true);
      for (const stage of nonFinale) {
        expect(stage.isChapterFinale).toBeFalsy();
      }
    });

    it('Stage 2-1 に chapterTitle が設定されている', () => {
      const stage = CHAPTER_2_STAGES.find(s => s.id === '2-1');
      expect(stage?.chapterTitle).toBeTruthy();
    });
  });

  describe('ダイアログの characterId が有効なキャラ ID であること（S8-3-5h）', () => {
    const allDialogues: { stageId: string; type: string; dialogue: Dialogue }[] = [];
    for (const stage of CHAPTER_2_STAGES) {
      for (const d of stage.preDialogue) allDialogues.push({ stageId: stage.id, type: 'pre', dialogue: d });
      for (const d of stage.postWinDialogue) allDialogues.push({ stageId: stage.id, type: 'postWin', dialogue: d });
      for (const d of stage.postLoseDialogue) allDialogues.push({ stageId: stage.id, type: 'postLose', dialogue: d });
    }

    it.each(allDialogues.map(d => [`${d.stageId} ${d.type}: ${d.dialogue.characterId}`, d]))(
      '%s が有効なキャラ ID',
      (_label, { dialogue }) => {
        expect(findCharacterById(dialogue.characterId)).toBeDefined();
      }
    );
  });

  describe('全ステージに pre / postWin / postLose が存在し空でないこと（S8-3-5i）', () => {
    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の preDialogue が空でない',
      (_id, stage) => { expect(stage.preDialogue.length).toBeGreaterThan(0); }
    );

    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の postWinDialogue が空でない',
      (_id, stage) => { expect(stage.postWinDialogue.length).toBeGreaterThan(0); }
    );

    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の postLoseDialogue が空でない',
      (_id, stage) => { expect(stage.postLoseDialogue.length).toBeGreaterThan(0); }
    );
  });

  describe('連続する同一 characterId の台詞がないこと（S8-3-5j）', () => {
    const checkNoConsecutiveSameCharacter = (dialogues: Dialogue[], label: string) => {
      for (let i = 1; i < dialogues.length; i++) {
        if (dialogues[i].characterId === dialogues[i - 1].characterId) {
          throw new Error(`${label}: 行 ${i - 1} と ${i} で ${dialogues[i].characterId} が連続`);
        }
      }
    };

    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の preDialogue に連続同一話者がない',
      (_id, stage) => { checkNoConsecutiveSameCharacter(stage.preDialogue, `${stage.id} pre`); }
    );

    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の postWinDialogue に連続同一話者がない',
      (_id, stage) => { checkNoConsecutiveSameCharacter(stage.postWinDialogue, `${stage.id} postWin`); }
    );

    it.each(CHAPTER_2_STAGES.map(s => [s.id, s]))(
      'Stage %s の postLoseDialogue に連続同一話者がない',
      (_id, stage) => { checkNoConsecutiveSameCharacter(stage.postLoseDialogue, `${stage.id} postLose`); }
    );
  });
});
