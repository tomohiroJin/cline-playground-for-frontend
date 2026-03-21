/**
 * Phase 2: キャラクター基盤のテスト
 * US-2.1（CPUキャラクター）、US-2.7（キャラクターアイコン）に対応
 */
import {
  PLAYER_CHARACTER,
  FREE_BATTLE_CHARACTERS,
  STORY_CHARACTERS,
  getCharacterByDifficulty,
  getRandomReaction,
  findCharacterById,
  getAllCharacters,
} from './characters';
import type { Character, CharacterReaction } from './types';

describe('Phase 2: キャラクター基盤', () => {
  // ── P2-01: キャラクター型定義 ──────────────────────
  describe('P2-01: Character 型定義', () => {
    it('Character 型が必要なフィールドを持つ', () => {
      const character: Character = {
        id: 'test',
        name: 'テスト',
        icon: '/assets/characters/test.png',
        color: '#ff0000',
        reactions: {
          onScore: ['得点！'],
          onConcede: ['失点…'],
          onWin: ['勝利！'],
          onLose: ['敗北…'],
        },
      };
      expect(character.id).toBe('test');
      expect(character.name).toBe('テスト');
      expect(character.icon).toBe('/assets/characters/test.png');
      expect(character.color).toBe('#ff0000');
      expect(character.reactions.onScore).toHaveLength(1);
    });

    it('CharacterReaction 型が4種類のリアクションを持つ', () => {
      const reactions: CharacterReaction = {
        onScore: ['a', 'b'],
        onConcede: ['c'],
        onWin: ['d'],
        onLose: ['e'],
      };
      expect(reactions.onScore).toHaveLength(2);
      expect(reactions.onConcede).toHaveLength(1);
      expect(reactions.onWin).toHaveLength(1);
      expect(reactions.onLose).toHaveLength(1);
    });
  });

  // ── P2-02: キャラクターデータ定義 ─────────────────
  describe('P2-02: キャラクターデータ定義', () => {
    describe('主人公キャラクター', () => {
      it('PLAYER_CHARACTER が定義されている', () => {
        expect(PLAYER_CHARACTER).toBeDefined();
        expect(PLAYER_CHARACTER.id).toBe('player');
        expect(PLAYER_CHARACTER.name).toBe('アキラ');
      });

      it('主人公のリアクションに空配列がない', () => {
        const { reactions } = PLAYER_CHARACTER;
        expect(reactions.onScore.length).toBeGreaterThan(0);
        expect(reactions.onConcede.length).toBeGreaterThan(0);
        expect(reactions.onWin.length).toBeGreaterThan(0);
        expect(reactions.onLose.length).toBeGreaterThan(0);
      });
    });

    describe('フリー対戦用キャラクター', () => {
      it('easy, normal, hard の3キャラが定義されている', () => {
        expect(FREE_BATTLE_CHARACTERS.easy).toBeDefined();
        expect(FREE_BATTLE_CHARACTERS.normal).toBeDefined();
        expect(FREE_BATTLE_CHARACTERS.hard).toBeDefined();
      });

      it.each(['easy', 'normal', 'hard'] as const)(
        '%s キャラのリアクションに空配列がない',
        (difficulty) => {
          const char = FREE_BATTLE_CHARACTERS[difficulty];
          expect(char.reactions.onScore.length).toBeGreaterThan(0);
          expect(char.reactions.onConcede.length).toBeGreaterThan(0);
          expect(char.reactions.onWin.length).toBeGreaterThan(0);
          expect(char.reactions.onLose.length).toBeGreaterThan(0);
        }
      );

      it('各キャラに一意の ID がある', () => {
        const ids = Object.values(FREE_BATTLE_CHARACTERS).map(c => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('各キャラに名前とアイコンパスがある', () => {
        Object.values(FREE_BATTLE_CHARACTERS).forEach(char => {
          expect(char.name).toBeTruthy();
          expect(char.icon).toMatch(/^\/assets\/characters\/.+\.png$/);
          expect(char.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });
    });

    describe('ストーリー用キャラクター', () => {
      it('hiro, misaki, takuma の3キャラが定義されている', () => {
        expect(STORY_CHARACTERS.hiro).toBeDefined();
        expect(STORY_CHARACTERS.misaki).toBeDefined();
        expect(STORY_CHARACTERS.takuma).toBeDefined();
      });

      it.each(['hiro', 'misaki', 'takuma'] as const)(
        '%s キャラのリアクションに空配列がない',
        (charId) => {
          const char = STORY_CHARACTERS[charId];
          expect(char.reactions.onScore.length).toBeGreaterThan(0);
          expect(char.reactions.onConcede.length).toBeGreaterThan(0);
          expect(char.reactions.onWin.length).toBeGreaterThan(0);
          expect(char.reactions.onLose.length).toBeGreaterThan(0);
        }
      );

      it('各キャラに一意の ID がある', () => {
        const ids = Object.values(STORY_CHARACTERS).map(c => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });

  // ── キャラクター取得ヘルパー ──────────────────────
  describe('getCharacterByDifficulty', () => {
    it('easy で ルーキー を返す', () => {
      const char = getCharacterByDifficulty('easy');
      expect(char.name).toBe('ルーキー');
    });

    it('normal で レギュラー を返す', () => {
      const char = getCharacterByDifficulty('normal');
      expect(char.name).toBe('レギュラー');
    });

    it('hard で エース を返す', () => {
      const char = getCharacterByDifficulty('hard');
      expect(char.name).toBe('エース');
    });
  });

  // ── リアクション選択ヘルパー ──────────────────────
  describe('getRandomReaction', () => {
    it('リアクション配列からランダムに1つ選択する', () => {
      const reactions = ['a', 'b', 'c'];
      const result = getRandomReaction(reactions);
      expect(reactions).toContain(result);
    });

    it('1要素の配列ではその要素を返す', () => {
      expect(getRandomReaction(['唯一'])).toBe('唯一');
    });
  });

  // ── キャラクター検索 ───────────────────────────────
  describe('findCharacterById', () => {
    it('主人公を ID で検索できる', () => {
      const char = findCharacterById('player');
      expect(char?.name).toBe('アキラ');
    });

    it('ストーリーキャラを ID で検索できる', () => {
      expect(findCharacterById('hiro')?.name).toBe('ヒロ');
      expect(findCharacterById('misaki')?.name).toBe('ミサキ');
      expect(findCharacterById('takuma')?.name).toBe('タクマ');
    });

    it('フリー対戦キャラを ID で検索できる', () => {
      expect(findCharacterById('rookie')?.name).toBe('ルーキー');
    });

    it('存在しない ID は undefined を返す', () => {
      expect(findCharacterById('nonexistent')).toBeUndefined();
    });
  });

  // ── 全キャラの ID 一意性 ──────────────────────────
  describe('全キャラクターの整合性', () => {
    it('全キャラの ID がグローバルに一意である', () => {
      const allCharacters: Character[] = [
        PLAYER_CHARACTER,
        ...Object.values(FREE_BATTLE_CHARACTERS),
        ...Object.values(STORY_CHARACTERS),
      ];
      const ids = allCharacters.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getAllCharacters', () => {
    it('全キャラクター（主人公 + ストーリー + フリー対戦）を返す', () => {
      const all = getAllCharacters();

      // 主人公 1 + ストーリー 4 + フリー対戦 3 = 8
      expect(all.length).toBe(8);
    });

    it('主人公（アキラ）が含まれる', () => {
      const all = getAllCharacters();
      expect(all.find(c => c.id === 'player')).toBeDefined();
    });

    it('ストーリーキャラクターが含まれる', () => {
      const all = getAllCharacters();
      expect(all.find(c => c.id === 'hiro')).toBeDefined();
      expect(all.find(c => c.id === 'misaki')).toBeDefined();
      expect(all.find(c => c.id === 'takuma')).toBeDefined();
      expect(all.find(c => c.id === 'yuu')).toBeDefined();
    });

    it('フリー対戦キャラクターが含まれる', () => {
      const all = getAllCharacters();
      expect(all.find(c => c.id === 'rookie')).toBeDefined();
      expect(all.find(c => c.id === 'regular')).toBeDefined();
      expect(all.find(c => c.id === 'ace')).toBeDefined();
    });

    it('重複がない', () => {
      const all = getAllCharacters();
      const ids = all.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
