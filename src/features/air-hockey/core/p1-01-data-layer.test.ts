/**
 * P1-01: データ層整備のテスト
 * Phase 1: ストーリービジュアル強化
 */
import type { Character } from './types';
import {
  PLAYER_CHARACTER,
  FREE_BATTLE_CHARACTERS,
  STORY_CHARACTERS,
  BACKGROUND_MAP,
  findCharacterById,
} from './characters';
import { CHAPTER_1_STAGES } from './dialogue-data';
import type { Dialogue } from './story';

// ── 型定義の拡張テスト ────────────────────────────

describe('P1-01: 型定義の拡張', () => {
  describe('PortraitSet 型', () => {
    it('Character に portrait フィールドが存在する', () => {
      // portrait はオプショナルなので、定義されているキャラで確認
      const akira = PLAYER_CHARACTER;
      expect(akira.portrait).toBeDefined();
      expect(akira.portrait?.normal).toMatch(/\.png$/);
      expect(akira.portrait?.happy).toMatch(/\.png$/);
    });
  });

  describe('Dialogue.expression フィールド', () => {
    it('expression フィールドがオプショナルで使える', () => {
      const dialogue: Dialogue = {
        characterId: 'player',
        text: 'テスト',
        expression: 'happy',
      };
      expect(dialogue.expression).toBe('happy');
    });

    it('expression を省略しても有効', () => {
      const dialogue: Dialogue = {
        characterId: 'player',
        text: 'テスト',
      };
      expect(dialogue.expression).toBeUndefined();
    });
  });

  describe('StageDefinition の拡張', () => {
    it('backgroundId フィールドが使える', () => {
      const stage = CHAPTER_1_STAGES[0];
      expect(stage.backgroundId).toBeDefined();
    });

    it('chapterTitle フィールドが使える', () => {
      const stage = CHAPTER_1_STAGES[0];
      expect(stage.chapterTitle).toBeDefined();
    });

    it('chapterSubtitle フィールドが使える', () => {
      const stage = CHAPTER_1_STAGES[0];
      expect(stage.chapterSubtitle).toBeDefined();
    });

    it('isChapterFinale フィールドが使える', () => {
      const stage = CHAPTER_1_STAGES[2];
      expect(stage.isChapterFinale).toBe(true);
    });
  });
});

// ── characters.ts のテスト ────────────────────────

describe('P1-01: キャラクターデータ更新', () => {
  describe('フリー対戦キャラのカラー更新', () => {
    it('rookie（ソウタ）のカラーが #27ae60 である', () => {
      expect(FREE_BATTLE_CHARACTERS.easy.color).toBe('#27ae60');
    });

    it('regular（ケンジ）のカラーが #2c3e50 である', () => {
      expect(FREE_BATTLE_CHARACTERS.normal.color).toBe('#2c3e50');
    });

    it('ace（レン）のカラーが #2c3e50 である', () => {
      expect(FREE_BATTLE_CHARACTERS.hard.color).toBe('#2c3e50');
    });
  });

  describe('全キャラクターに portrait が設定されている', () => {
    it('主人公（アキラ）に portrait がある', () => {
      expect(PLAYER_CHARACTER.portrait).toBeDefined();
      expect(PLAYER_CHARACTER.portrait?.normal).toBe('/assets/portraits/akira-normal.png');
      expect(PLAYER_CHARACTER.portrait?.happy).toBe('/assets/portraits/akira-happy.png');
    });

    it.each(['easy', 'normal', 'hard'] as const)(
      'フリー対戦 %s キャラに portrait がある',
      (difficulty) => {
        const char = FREE_BATTLE_CHARACTERS[difficulty];
        expect(char.portrait).toBeDefined();
        expect(char.portrait?.normal).toMatch(/^\/assets\/portraits\/.+-normal\.png$/);
        expect(char.portrait?.happy).toMatch(/^\/assets\/portraits\/.+-happy\.png$/);
      }
    );

    it.each(['hiro', 'misaki', 'takuma', 'yuu'] as const)(
      'ストーリーキャラ %s に portrait がある',
      (charId) => {
        const char = STORY_CHARACTERS[charId];
        expect(char.portrait).toBeDefined();
        expect(char.portrait?.normal).toMatch(/^\/assets\/portraits\/.+-normal\.png$/);
        expect(char.portrait?.happy).toMatch(/^\/assets\/portraits\/.+-happy\.png$/);
      }
    );
  });

  describe('ユウ（yuu）の追加', () => {
    it('STORY_CHARACTERS にユウが存在する', () => {
      expect(STORY_CHARACTERS.yuu).toBeDefined();
    });

    it('ユウの基本情報が正しい', () => {
      const yuu = STORY_CHARACTERS.yuu;
      expect(yuu.id).toBe('yuu');
      expect(yuu.name).toBe('ユウ');
      expect(yuu.icon).toBe('/assets/characters/yuu.png');
      expect(yuu.color).toBe('#2ecc71');
    });

    it('ユウのリアクションに空配列がない', () => {
      const { reactions } = STORY_CHARACTERS.yuu;
      expect(reactions.onScore.length).toBeGreaterThan(0);
      expect(reactions.onConcede.length).toBeGreaterThan(0);
      expect(reactions.onWin.length).toBeGreaterThan(0);
      expect(reactions.onLose.length).toBeGreaterThan(0);
    });

    it('ユウの portrait が正しいパスを持つ', () => {
      const yuu = STORY_CHARACTERS.yuu;
      expect(yuu.portrait?.normal).toBe('/assets/portraits/yuu-normal.png');
      expect(yuu.portrait?.happy).toBe('/assets/portraits/yuu-happy.png');
    });

    it('findCharacterById でユウを検索できる', () => {
      const char = findCharacterById('yuu');
      expect(char?.name).toBe('ユウ');
    });
  });

  describe('BACKGROUND_MAP', () => {
    it('BACKGROUND_MAP が定義されている', () => {
      expect(BACKGROUND_MAP).toBeDefined();
    });

    it('3つの背景がマッピングされている', () => {
      expect(Object.keys(BACKGROUND_MAP)).toHaveLength(3);
    });

    it('各背景IDが正しいパスにマッピングされている', () => {
      expect(BACKGROUND_MAP['bg-clubroom']).toBe('/assets/backgrounds/bg-clubroom.webp');
      expect(BACKGROUND_MAP['bg-gym']).toBe('/assets/backgrounds/bg-gym.webp');
      expect(BACKGROUND_MAP['bg-school-gate']).toBe('/assets/backgrounds/bg-school-gate.webp');
    });
  });

  describe('全キャラの ID 一意性（yuu追加後）', () => {
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
});

// ── dialogue-data.ts のテスト ────────────────────────

describe('P1-01: ダイアログデータ更新', () => {
  describe('ステージ 1-1', () => {
    const stage = CHAPTER_1_STAGES[0];

    it('backgroundId が bg-clubroom である', () => {
      expect(stage.backgroundId).toBe('bg-clubroom');
    });

    it('chapterTitle が "第1章" である', () => {
      expect(stage.chapterTitle).toBe('第1章');
    });

    it('chapterSubtitle が "はじめの一打" である', () => {
      expect(stage.chapterSubtitle).toBe('はじめの一打');
    });
  });

  describe('ステージ 1-2', () => {
    const stage = CHAPTER_1_STAGES[1];

    it('backgroundId が bg-gym である', () => {
      expect(stage.backgroundId).toBe('bg-gym');
    });

    it('chapterTitle が未定義', () => {
      expect(stage.chapterTitle).toBeUndefined();
    });
  });

  describe('ステージ 1-3', () => {
    const stage = CHAPTER_1_STAGES[2];

    it('backgroundId が bg-school-gate である', () => {
      expect(stage.backgroundId).toBe('bg-school-gate');
    });

    it('isChapterFinale が true である', () => {
      expect(stage.isChapterFinale).toBe(true);
    });
  });

  describe('ダイアログの expression', () => {
    it('勝利・励まし系のダイアログに expression: happy がある', () => {
      // 1-1 の勝利後ダイアログに少なくとも1つ happy がある
      const stage1Win = CHAPTER_1_STAGES[0].postWinDialogue;
      const hasHappy = stage1Win.some(d => d.expression === 'happy');
      expect(hasHappy).toBe(true);
    });

    it('expression が設定されていないダイアログも存在する（通常会話）', () => {
      const stage1Pre = CHAPTER_1_STAGES[0].preDialogue;
      const hasNoExpression = stage1Pre.some(d => d.expression === undefined);
      expect(hasNoExpression).toBe(true);
    });
  });

  describe('backgroundId が BACKGROUND_MAP に存在する', () => {
    it.each(CHAPTER_1_STAGES)('ステージ $id の backgroundId が有効', (stage) => {
      if (stage.backgroundId) {
        expect(BACKGROUND_MAP[stage.backgroundId]).toBeDefined();
      }
    });
  });
});
