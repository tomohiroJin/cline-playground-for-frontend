/**
 * Agile Quiz Sugoroku - キャラクタープロフィールのテスト
 */
import { CHARACTER_PROFILES, CharacterProfile } from '../character-profiles';
import { COLORS } from '../constants';
import { AQS_IMAGES } from '../images';

describe('Agile Quiz Sugoroku - キャラクタープロフィール', () => {
  // ── キャラクター数 ────────────────────────────────────

  describe('キャラクター数', () => {
    it('5人のキャラクターが存在する', () => {
      expect(CHARACTER_PROFILES).toHaveLength(5);
    });
  });

  // ── 配列順序 ──────────────────────────────────────────

  describe('配列順序', () => {
    it('タカ→イヌ→ペンギン→ネコ→ウサギの順で並んでいる', () => {
      const ids = CHARACTER_PROFILES.map((c) => c.id);
      expect(ids).toEqual(['taka', 'inu', 'penguin', 'neko', 'usagi']);
    });
  });

  // ── 共通プロパティ検証 ────────────────────────────────

  describe('共通プロパティ検証', () => {
    it('各キャラクターに必須プロパティが存在する', () => {
      CHARACTER_PROFILES.forEach((profile) => {
        expect(profile.id).toBeDefined();
        expect(profile.name).toBeDefined();
        expect(profile.animal).toBeDefined();
        expect(profile.role).toBeDefined();
        expect(profile.color).toBeDefined();
        expect(profile.emoji).toBeDefined();
        expect(profile.personality).toBeDefined();
        expect(profile.skills).toBeDefined();
        expect(profile.skills.length).toBeGreaterThan(0);
        expect(profile.catchphrase).toBeDefined();
        expect(profile.trivia).toBeDefined();
      });
    });

    it('キャラクターIDが一意である', () => {
      const ids = CHARACTER_PROFILES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ── ペンギン（スクラムマスター）────────────────────────

  describe('ペンギン（スクラムマスター）', () => {
    let penguin: CharacterProfile | undefined;

    beforeEach(() => {
      penguin = CHARACTER_PROFILES.find((c) => c.id === 'penguin');
    });

    it('ペンギンキャラクターが存在する', () => {
      expect(penguin).toBeDefined();
    });

    it('名前がペンギンである', () => {
      expect(penguin?.name).toBe('ペンギン');
    });

    it('動物はアデリーペンギンである', () => {
      expect(penguin?.animal).toBe('アデリーペンギン');
    });

    it('ロールはスクラムマスターである', () => {
      expect(penguin?.role).toBe('スクラムマスター');
    });

    it('カラーは COLORS.blue である', () => {
      expect(penguin?.color).toBe(COLORS.blue);
    });

    it('絵文字は🐧である', () => {
      expect(penguin?.emoji).toBe('🐧');
    });

    it('スキルにファシリテーション・障害除去・チームコーチングが含まれる', () => {
      expect(penguin?.skills).toContain('ファシリテーション');
      expect(penguin?.skills).toContain('障害除去');
      expect(penguin?.skills).toContain('チームコーチング');
    });

    it('キャッチフレーズが設定されている', () => {
      expect(penguin?.catchphrase).toContain('ペン');
    });
  });

  // ── イヌ（プロダクトオーナー専任）─────────────────────

  describe('イヌ（プロダクトオーナー専任）', () => {
    let inu: CharacterProfile | undefined;

    beforeEach(() => {
      inu = CHARACTER_PROFILES.find((c) => c.id === 'inu');
    });

    it('ロールがプロダクトオーナーである（SM兼任でない）', () => {
      expect(inu?.role).toBe('プロダクトオーナー');
      expect(inu?.role).not.toContain('スクラムマスター');
    });

    it('スキルがPO専任のものになっている', () => {
      expect(inu?.skills).toContain('バックログ管理');
      expect(inu?.skills).toContain('優先順位付け');
      expect(inu?.skills).toContain('ステークホルダー調整');
      expect(inu?.skills).toContain('受け入れ基準定義');
    });

    it('スキルにファシリテーションが含まれない（SM分離のため）', () => {
      expect(inu?.skills).not.toContain('ファシリテーション');
    });
  });

  // ── カラーテーマ ──────────────────────────────────────

  describe('カラーテーマ', () => {
    it('COLORS.blue が定義されている', () => {
      expect(COLORS.blue).toBe('#4FC3F7');
    });

    it('ペンギンとウサギの色が被らない', () => {
      const penguin = CHARACTER_PROFILES.find((c) => c.id === 'penguin');
      const usagi = CHARACTER_PROFILES.find((c) => c.id === 'usagi');
      expect(penguin?.color).not.toBe(usagi?.color);
    });

    it('全キャラクターの色が一意である', () => {
      const colors = CHARACTER_PROFILES.map((c) => c.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  // ── 画像定義 ──────────────────────────────────────────

  describe('画像定義', () => {
    it('AQS_IMAGES.characters にペンギンの画像が定義されている', () => {
      expect(AQS_IMAGES.characters.penguin).toBeDefined();
    });
  });
});
