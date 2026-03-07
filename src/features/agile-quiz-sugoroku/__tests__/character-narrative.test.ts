/**
 * キャラクターナラティブのテスト
 */
import {
  getNarrativeComment,
  NARRATIVE_COMMENTS,
  NarrativeSituation,
} from '../character-narrative';

describe('character-narrative', () => {
  describe('NARRATIVE_COMMENTS', () => {
    const situations: NarrativeSituation[] = [
      'sprintStart1',
      'sprintStartGood',
      'sprintStartBad',
      'retroGood',
      'retroBad',
    ];

    it.each(situations)('状況 "%s" にコメントが3件以上存在する', (situation) => {
      expect(NARRATIVE_COMMENTS[situation].length).toBeGreaterThanOrEqual(3);
    });

    it.each(situations)('状況 "%s" に3キャラ分のコメントが含まれる', (situation) => {
      const charIds = new Set(
        NARRATIVE_COMMENTS[situation].map((c) => c.characterId)
      );
      expect(charIds.has('neko')).toBe(true);
      expect(charIds.has('inu')).toBe(true);
      expect(charIds.has('usagi')).toBe(true);
    });
  });

  describe('getNarrativeComment', () => {
    it('Sprint 1開始時は sprintStart1 のコメントを返す', () => {
      const comment = getNarrativeComment({
        sprintNumber: 1,
        phase: 'sprintStart',
      });
      const validTexts = NARRATIVE_COMMENTS.sprintStart1.map((c) => c.text);
      expect(validTexts).toContain(comment.text);
    });

    it('Sprint 2以降、正答率70%以上では sprintStartGood のコメントを返す', () => {
      const comment = getNarrativeComment({
        sprintNumber: 2,
        phase: 'sprintStart',
        correctRate: 80,
        debt: 5,
      });
      const validTexts = NARRATIVE_COMMENTS.sprintStartGood.map((c) => c.text);
      expect(validTexts).toContain(comment.text);
    });

    it('Sprint 2以降、負債15超では sprintStartBad のコメントを返す', () => {
      const comment = getNarrativeComment({
        sprintNumber: 2,
        phase: 'sprintStart',
        correctRate: 50,
        debt: 20,
      });
      const validTexts = NARRATIVE_COMMENTS.sprintStartBad.map((c) => c.text);
      expect(validTexts).toContain(comment.text);
    });

    it('振り返り時、正答率70%以上では retroGood のコメントを返す', () => {
      const comment = getNarrativeComment({
        sprintNumber: 1,
        phase: 'retro',
        correctRate: 80,
      });
      const validTexts = NARRATIVE_COMMENTS.retroGood.map((c) => c.text);
      expect(validTexts).toContain(comment.text);
    });

    it('振り返り時、正答率70%未満では retroBad のコメントを返す', () => {
      const comment = getNarrativeComment({
        sprintNumber: 1,
        phase: 'retro',
        correctRate: 50,
      });
      const validTexts = NARRATIVE_COMMENTS.retroBad.map((c) => c.text);
      expect(validTexts).toContain(comment.text);
    });

    it('返されるコメントに characterId と text が含まれる', () => {
      const comment = getNarrativeComment({
        sprintNumber: 1,
        phase: 'sprintStart',
      });
      expect(comment).toHaveProperty('characterId');
      expect(comment).toHaveProperty('text');
      expect(typeof comment.characterId).toBe('string');
      expect(typeof comment.text).toBe('string');
    });
  });
});
