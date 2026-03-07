/**
 * Agile Quiz Sugoroku - キャラクターリアクションのテスト
 */
import {
  REACTION_COMMENTS,
  QUIZ_CHARACTERS,
  getRandomReaction,
  getRandomCharacter,
  getHintForTags,
  getExpertCharacterForTags,
  CHARACTER_TAG_MAP,
  HINT_COMMENTS,
  ReactionSituation,
  CharacterComment,
  QuizCharacter,
} from '../character-reactions';

/** すべてのリアクション状況 */
const ALL_SITUATIONS: ReactionSituation[] = [
  'idle',
  'timeMild',
  'correct',
  'incorrect',
  'combo',
  'timeWarning',
  'emergency',
];

/** クイズに登場する3キャラのID */
const QUIZ_CHARACTER_IDS = ['neko', 'inu', 'usagi'];

describe('Agile Quiz Sugoroku - キャラクターリアクション', () => {
  // ── QUIZ_CHARACTERS ────────────────────────────────────

  describe('QUIZ_CHARACTERS', () => {
    it('ネコ・イヌ・ウサギの3体が定義されている', () => {
      expect(QUIZ_CHARACTERS).toHaveLength(3);

      const ids = QUIZ_CHARACTERS.map((c) => c.id);
      expect(ids).toContain('neko');
      expect(ids).toContain('inu');
      expect(ids).toContain('usagi');
    });

    it('各キャラクターに id, name, emoji が設定されている', () => {
      QUIZ_CHARACTERS.forEach((character) => {
        expect(character.id).toBeDefined();
        expect(character.name).toBeDefined();
        expect(character.emoji).toBeDefined();
        expect(character.id.length).toBeGreaterThan(0);
        expect(character.name.length).toBeGreaterThan(0);
        expect(character.emoji.length).toBeGreaterThan(0);
      });
    });
  });

  // ── REACTION_COMMENTS ──────────────────────────────────

  describe('REACTION_COMMENTS', () => {
    it('すべての状況のコメントデータを持つ', () => {
      ALL_SITUATIONS.forEach((situation) => {
        expect(REACTION_COMMENTS[situation]).toBeDefined();
      });
    });

    it('各状況でネコ・イヌ・ウサギの3キャラ分のコメントがある', () => {
      ALL_SITUATIONS.forEach((situation) => {
        const comments = REACTION_COMMENTS[situation];

        QUIZ_CHARACTER_IDS.forEach((characterId) => {
          const characterComments = comments.filter(
            (c) => c.characterId === characterId
          );
          expect(characterComments.length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('各状況につき各キャラ3つ以上のバリエーションがある', () => {
      ALL_SITUATIONS.forEach((situation) => {
        const comments = REACTION_COMMENTS[situation];

        QUIZ_CHARACTER_IDS.forEach((characterId) => {
          const characterComments = comments.filter(
            (c) => c.characterId === characterId
          );
          expect(characterComments.length).toBeGreaterThanOrEqual(3);
        });
      });
    });

    it('すべてのコメントに characterId と text が設定されている', () => {
      ALL_SITUATIONS.forEach((situation) => {
        REACTION_COMMENTS[situation].forEach((comment) => {
          expect(comment.characterId).toBeDefined();
          expect(comment.text).toBeDefined();
          expect(comment.text.length).toBeGreaterThan(0);
        });
      });
    });
  });

  // ── getRandomReaction ──────────────────────────────────

  describe('getRandomReaction', () => {
    it('指定したキャラのコメントを返す', () => {
      const result: CharacterComment = getRandomReaction('correct', 'neko');

      expect(result.characterId).toBe('neko');
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('返されるコメントが該当状況のデータに含まれている', () => {
      const result = getRandomReaction('incorrect', 'inu');

      const validTexts = REACTION_COMMENTS.incorrect
        .filter((c) => c.characterId === 'inu')
        .map((c) => c.text);
      expect(validTexts).toContain(result.text);
    });

    it('存在しないキャラの場合はランダムなキャラのコメントを返す', () => {
      const result = getRandomReaction('combo', 'unknown_character');

      expect(result.characterId).toBeDefined();
      const allTexts = REACTION_COMMENTS.combo.map((c) => c.text);
      expect(allTexts).toContain(result.text);
    });

    it('characterId を省略した場合もコメントを返す', () => {
      const result = getRandomReaction('timeWarning');

      expect(result.characterId).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });
  });

  // ── CHARACTER_TAG_MAP / getExpertCharacterForTags ────────

  describe('CHARACTER_TAG_MAP', () => {
    it('3キャラ分のタグマッピングが定義されている', () => {
      expect(Object.keys(CHARACTER_TAG_MAP)).toHaveLength(3);
      expect(CHARACTER_TAG_MAP.neko).toBeDefined();
      expect(CHARACTER_TAG_MAP.inu).toBeDefined();
      expect(CHARACTER_TAG_MAP.usagi).toBeDefined();
    });

    it('各キャラに少なくとも3つの得意タグがある', () => {
      QUIZ_CHARACTER_IDS.forEach((id) => {
        expect(CHARACTER_TAG_MAP[id].length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('getExpertCharacterForTags', () => {
    it('ネコの得意タグに対して neko を返す', () => {
      expect(getExpertCharacterForTags(['design-principles'])).toBe('neko');
      expect(getExpertCharacterForTags(['programming'])).toBe('neko');
    });

    it('イヌの得意タグに対して inu を返す', () => {
      expect(getExpertCharacterForTags(['scrum'])).toBe('inu');
      expect(getExpertCharacterForTags(['backlog'])).toBe('inu');
    });

    it('ウサギの得意タグに対して usagi を返す', () => {
      expect(getExpertCharacterForTags(['testing'])).toBe('usagi');
      expect(getExpertCharacterForTags(['ci-cd'])).toBe('usagi');
    });

    it('どのキャラにもマッチしないタグの場合 undefined を返す', () => {
      expect(getExpertCharacterForTags(['data-structures'])).toBeUndefined();
      expect(getExpertCharacterForTags([])).toBeUndefined();
    });
  });

  // ── HINT_COMMENTS / getHintForTags ──────────────────────

  describe('HINT_COMMENTS', () => {
    it('各キャラの得意タグにヒントが定義されている', () => {
      QUIZ_CHARACTER_IDS.forEach((charId) => {
        const tags = CHARACTER_TAG_MAP[charId];
        tags.forEach((tag) => {
          expect(HINT_COMMENTS[tag]).toBeDefined();
          expect(HINT_COMMENTS[tag].length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('各ヒントに characterId と text が設定されている', () => {
      Object.values(HINT_COMMENTS).forEach((comments) => {
        comments.forEach((comment) => {
          expect(comment.characterId).toBeDefined();
          expect(comment.text).toBeDefined();
          expect(comment.text.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getHintForTags', () => {
    it('得意キャラ指定でマッチするヒントを返す', () => {
      const result = getHintForTags(['design-principles'], 'neko');

      expect(result.characterId).toBe('neko');
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('キャラ指定なしでもタグにマッチするヒントを返す', () => {
      const result = getHintForTags(['testing']);

      expect(result.text.length).toBeGreaterThan(0);
    });

    it('マッチしないタグの場合は汎用ヒントを返す', () => {
      const result = getHintForTags(['data-structures']);

      expect(result.characterId).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('空のタグ配列の場合は汎用ヒントを返す', () => {
      const result = getHintForTags([]);

      expect(result.characterId).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });
  });

  // ── getRandomCharacter ─────────────────────────────────

  describe('getRandomCharacter', () => {
    it('3体のいずれかを返す', () => {
      const result: QuizCharacter = getRandomCharacter();

      expect(QUIZ_CHARACTER_IDS).toContain(result.id);
    });

    it('返されるキャラクターが QUIZ_CHARACTERS に含まれている', () => {
      const result = getRandomCharacter();

      const matchingCharacter = QUIZ_CHARACTERS.find(
        (c) => c.id === result.id
      );
      expect(matchingCharacter).toBeDefined();
      expect(matchingCharacter?.name).toBe(result.name);
      expect(matchingCharacter?.emoji).toBe(result.emoji);
    });
  });
});
