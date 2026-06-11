/**
 * Agile Quiz Sugoroku - キャラクター×ジャンルマッピング
 *
 * 勉強会モードでキャラクター選択時に、関連ジャンルを自動選択するためのマッピング定義。
 */

export interface CharacterGenreMapping {
  characterId: string;
  characterName: string;
  emoji: string;
  role: string;
  genres: string[];
}

/** キャラクターと関連ジャンルのマッピング */
export const CHARACTER_GENRE_MAP: CharacterGenreMapping[] = [
  {
    characterId: 'taka',
    characterName: 'タカ',
    emoji: '🦅',
    role: 'BO',
    genres: ['agile', 'scrum', 'team', 'release'],
  },
  {
    characterId: 'inu',
    characterName: 'イヌ',
    emoji: '🐶',
    role: 'PO',
    genres: ['scrum', 'backlog', 'estimation', 'agile'],
  },
  {
    characterId: 'penguin',
    characterName: 'ペンギン',
    emoji: '🐧',
    role: 'SM',
    genres: ['scrum', 'agile', 'team', 'estimation'],
  },
  {
    characterId: 'neko',
    characterName: 'ネコ',
    emoji: '🐱',
    role: 'Dev',
    genres: ['design-principles', 'design-patterns', 'programming', 'data-structures', 'refactoring'],
  },
  {
    characterId: 'usagi',
    characterName: 'ウサギ',
    emoji: '🐰',
    role: 'QA',
    genres: ['testing', 'code-quality', 'ci-cd', 'sre', 'incident'],
  },
];

/** 指定キャラクターIDの関連ジャンルの和集合を返す */
export function getGenresForCharacters(characterIds: string[]): string[] {
  const genreSet = new Set<string>();
  for (const id of characterIds) {
    const mapping = CHARACTER_GENRE_MAP.find((m) => m.characterId === id);
    if (mapping) {
      for (const genre of mapping.genres) {
        genreSet.add(genre);
      }
    }
  }
  return [...genreSet];
}
