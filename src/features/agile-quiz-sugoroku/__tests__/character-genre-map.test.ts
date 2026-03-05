/**
 * Agile Quiz Sugoroku - キャラクター×ジャンルマッピングのテスト
 */
import {
  CHARACTER_GENRE_MAP,
  getGenresForCharacters,
  CharacterGenreMapping,
} from '../character-genre-map';
import { VALID_TAG_IDS } from '../questions/tag-master';
import { CHARACTER_PROFILES } from '../character-profiles';

describe('Agile Quiz Sugoroku - キャラクター×ジャンルマッピング', () => {
  // ── マッピング定義 ──────────────────────────────────────

  describe('マッピング定義', () => {
    it('5キャラクター分のマッピングが定義されている', () => {
      expect(CHARACTER_GENRE_MAP).toHaveLength(5);
    });

    it('全キャラクターのIDがCHARACTER_PROFILESに存在する', () => {
      const profileIds = CHARACTER_PROFILES.map((p) => p.id);
      CHARACTER_GENRE_MAP.forEach((mapping) => {
        expect(profileIds).toContain(mapping.characterId);
      });
    });

    it('キャラクターIDが一意である', () => {
      const ids = CHARACTER_GENRE_MAP.map((m) => m.characterId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('各マッピングに必須プロパティが存在する', () => {
      CHARACTER_GENRE_MAP.forEach((mapping) => {
        expect(mapping.characterId).toBeDefined();
        expect(mapping.characterName).toBeDefined();
        expect(mapping.characterName.length).toBeGreaterThan(0);
        expect(mapping.emoji).toBeDefined();
        expect(mapping.role).toBeDefined();
        expect(mapping.role.length).toBeGreaterThan(0);
        expect(mapping.genres).toBeDefined();
        expect(mapping.genres.length).toBeGreaterThan(0);
      });
    });

    it('全ジャンルIDがTAG_MASTERに存在する', () => {
      CHARACTER_GENRE_MAP.forEach((mapping) => {
        mapping.genres.forEach((genreId) => {
          expect(VALID_TAG_IDS).toContain(genreId);
        });
      });
    });
  });

  // ── 各キャラクターのマッピング ──────────────────────────

  describe('タカ（BO）のマッピング', () => {
    let taka: CharacterGenreMapping | undefined;

    beforeEach(() => {
      taka = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'taka');
    });

    it('タカのマッピングが存在する', () => {
      expect(taka).toBeDefined();
    });

    it('agile, scrum, team, release が含まれる', () => {
      expect(taka?.genres).toContain('agile');
      expect(taka?.genres).toContain('scrum');
      expect(taka?.genres).toContain('team');
      expect(taka?.genres).toContain('release');
    });
  });

  describe('イヌ（PO）のマッピング', () => {
    let inu: CharacterGenreMapping | undefined;

    beforeEach(() => {
      inu = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'inu');
    });

    it('イヌのマッピングが存在する', () => {
      expect(inu).toBeDefined();
    });

    it('scrum, backlog, estimation, agile が含まれる', () => {
      expect(inu?.genres).toContain('scrum');
      expect(inu?.genres).toContain('backlog');
      expect(inu?.genres).toContain('estimation');
      expect(inu?.genres).toContain('agile');
    });
  });

  describe('ペンギン（SM）のマッピング', () => {
    let penguin: CharacterGenreMapping | undefined;

    beforeEach(() => {
      penguin = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'penguin');
    });

    it('ペンギンのマッピングが存在する', () => {
      expect(penguin).toBeDefined();
    });

    it('scrum, agile, team, estimation が含まれる', () => {
      expect(penguin?.genres).toContain('scrum');
      expect(penguin?.genres).toContain('agile');
      expect(penguin?.genres).toContain('team');
      expect(penguin?.genres).toContain('estimation');
    });
  });

  describe('ネコ（Dev）のマッピング', () => {
    let neko: CharacterGenreMapping | undefined;

    beforeEach(() => {
      neko = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'neko');
    });

    it('ネコのマッピングが存在する', () => {
      expect(neko).toBeDefined();
    });

    it('design-principles, design-patterns, programming, data-structures, refactoring が含まれる', () => {
      expect(neko?.genres).toContain('design-principles');
      expect(neko?.genres).toContain('design-patterns');
      expect(neko?.genres).toContain('programming');
      expect(neko?.genres).toContain('data-structures');
      expect(neko?.genres).toContain('refactoring');
    });
  });

  describe('ウサギ（QA）のマッピング', () => {
    let usagi: CharacterGenreMapping | undefined;

    beforeEach(() => {
      usagi = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'usagi');
    });

    it('ウサギのマッピングが存在する', () => {
      expect(usagi).toBeDefined();
    });

    it('testing, code-quality, ci-cd, sre, incident が含まれる', () => {
      expect(usagi?.genres).toContain('testing');
      expect(usagi?.genres).toContain('code-quality');
      expect(usagi?.genres).toContain('ci-cd');
      expect(usagi?.genres).toContain('sre');
      expect(usagi?.genres).toContain('incident');
    });
  });

  // ── getGenresForCharacters ─────────────────────────────

  describe('getGenresForCharacters', () => {
    it('単一キャラクター選択時にそのキャラクターのジャンルを返す', () => {
      const result = getGenresForCharacters(['taka']);
      const taka = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'taka');
      expect(result).toEqual(expect.arrayContaining(taka!.genres));
      expect(result.length).toBe(taka!.genres.length);
    });

    it('複数キャラクター選択時に和集合を返す', () => {
      const result = getGenresForCharacters(['taka', 'neko']);
      const taka = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'taka');
      const neko = CHARACTER_GENRE_MAP.find((m) => m.characterId === 'neko');

      // タカとネコの両方のジャンルが含まれる
      for (const genre of taka!.genres) {
        expect(result).toContain(genre);
      }
      for (const genre of neko!.genres) {
        expect(result).toContain(genre);
      }
    });

    it('重複するジャンルが排除される', () => {
      // タカとイヌは 'scrum' と 'agile' が共通
      const result = getGenresForCharacters(['taka', 'inu']);
      const uniqueResult = [...new Set(result)];
      expect(result.length).toBe(uniqueResult.length);
    });

    it('空のキャラクター配列では空配列を返す', () => {
      const result = getGenresForCharacters([]);
      expect(result).toEqual([]);
    });

    it('存在しないキャラクターIDは無視される', () => {
      const result = getGenresForCharacters(['unknown']);
      expect(result).toEqual([]);
    });

    it('全キャラクター選択時に全ジャンルの和集合を返す', () => {
      const allIds = CHARACTER_GENRE_MAP.map((m) => m.characterId);
      const result = getGenresForCharacters(allIds);
      const allGenres = new Set(CHARACTER_GENRE_MAP.flatMap((m) => m.genres));
      expect(result.length).toBe(allGenres.size);
      for (const genre of allGenres) {
        expect(result).toContain(genre);
      }
    });
  });
});
