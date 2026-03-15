/**
 * P2-01: データ層整備 — 図鑑データのテスト
 * 型定義の検証、図鑑データの整合性、ヘルパー関数のテスト
 */
import type {
  CharacterProfile,
  UnlockCondition,
  DexEntry,
  DexProgress,
} from './types';
import {
  DEX_ENTRIES,
  getDexEntryById,
  getAllDexEntries,
} from './dex-data';
import { findCharacterById } from './characters';
import { CHAPTER_1_STAGES } from './dialogue-data';

describe('P2-01: データ層整備', () => {
  // ── 型定義の検証 ──────────────────────────────

  describe('型定義', () => {
    it('CharacterProfile 型が必要なフィールドを持つ', () => {
      const profile: CharacterProfile = {
        characterId: 'test',
        fullName: 'テスト キャラ',
        reading: 'てすと きゃら',
        grade: '1年生',
        age: 15,
        birthday: '4月1日',
        height: '170cm',
        school: 'テスト高校',
        club: 'テスト部',
        personality: ['明るい'],
        quote: 'テストセリフ',
        playStyle: 'テストスタイル',
        specialMove: 'テスト技',
        specialMoveDesc: 'テスト技の説明',
        description: 'テストキャラの説明',
      };

      expect(profile.characterId).toBe('test');
      expect(profile.fullName).toBe('テスト キャラ');
      expect(profile.personality).toHaveLength(1);
    });

    it('UnlockCondition が default 型を持てる', () => {
      const condition: UnlockCondition = { type: 'default' };
      expect(condition.type).toBe('default');
    });

    it('UnlockCondition が story-clear 型を持てる', () => {
      const condition: UnlockCondition = {
        type: 'story-clear',
        stageId: '1-1',
      };
      expect(condition.type).toBe('story-clear');
      if (condition.type === 'story-clear') {
        expect(condition.stageId).toBe('1-1');
      }
    });

    it('DexEntry がプロフィールとアンロック条件を持つ', () => {
      const entry: DexEntry = {
        profile: {
          characterId: 'test',
          fullName: 'テスト',
          reading: 'てすと',
          grade: '1年生',
          age: 15,
          birthday: '4月1日',
          height: '170cm',
          school: 'テスト高校',
          club: 'テスト部',
          personality: ['明るい'],
          quote: 'セリフ',
          playStyle: 'スタイル',
          specialMove: '技',
          specialMoveDesc: '説明',
          description: '紹介文',
        },
        unlockCondition: { type: 'default' },
      };

      expect(entry.profile.characterId).toBe('test');
      expect(entry.unlockCondition.type).toBe('default');
    });

    it('DexProgress がアンロック状態を管理する', () => {
      const progress: DexProgress = {
        unlockedCharacterIds: ['player', 'yuu'],
        newlyUnlockedIds: ['hiro'],
      };

      expect(progress.unlockedCharacterIds).toContain('player');
      expect(progress.newlyUnlockedIds).toContain('hiro');
    });
  });

  // ── 図鑑データの検証 ──────────────────────────────

  describe('図鑑データ（DEX_ENTRIES）', () => {
    it('全8キャラクターのエントリが存在する', () => {
      expect(DEX_ENTRIES).toHaveLength(8);
    });

    it('characterId が characters.ts の ID と一致する', () => {
      const dexIds = DEX_ENTRIES.map((e) => e.profile.characterId);

      // プレイヤー
      expect(dexIds).toContain('player');
      // ストーリーキャラクター
      expect(dexIds).toContain('hiro');
      expect(dexIds).toContain('misaki');
      expect(dexIds).toContain('takuma');
      expect(dexIds).toContain('yuu');
      // フリー対戦キャラクター
      expect(dexIds).toContain('rookie');
      expect(dexIds).toContain('regular');
      expect(dexIds).toContain('ace');
    });

    it('characterId が characters.ts に実在する', () => {
      for (const entry of DEX_ENTRIES) {
        const character = findCharacterById(entry.profile.characterId);
        expect(character).toBeDefined();
      }
    });

    it('必須フィールドがすべて入力されている', () => {
      for (const entry of DEX_ENTRIES) {
        const { profile } = entry;

        // 全フィールドが空でないことを確認
        expect(profile.characterId).toBeTruthy();
        expect(profile.fullName).toBeTruthy();
        expect(profile.reading).toBeTruthy();
        expect(profile.grade).toBeTruthy();
        expect(profile.age).toBeGreaterThan(0);
        expect(profile.birthday).toBeTruthy();
        expect(profile.height).toBeTruthy();
        expect(profile.school).toBeTruthy();
        expect(profile.club).toBeTruthy();
        expect(profile.personality.length).toBeGreaterThan(0);
        expect(profile.quote).toBeTruthy();
        expect(profile.playStyle).toBeTruthy();
        expect(profile.specialMove).toBeTruthy();
        expect(profile.specialMoveDesc).toBeTruthy();
        expect(profile.description).toBeTruthy();
      }
    });

    describe('アンロック条件', () => {
      it('アキラとユウは初期解放（default）', () => {
        const akira = getDexEntryById('player');
        const yuu = getDexEntryById('yuu');

        expect(akira?.unlockCondition.type).toBe('default');
        expect(yuu?.unlockCondition.type).toBe('default');
      });

      it('ヒロ・ミサキ・タクマはストーリークリアで解放', () => {
        const hiro = getDexEntryById('hiro');
        const misaki = getDexEntryById('misaki');
        const takuma = getDexEntryById('takuma');

        expect(hiro?.unlockCondition).toEqual({
          type: 'story-clear',
          stageId: '1-1',
        });
        expect(misaki?.unlockCondition).toEqual({
          type: 'story-clear',
          stageId: '1-2',
        });
        expect(takuma?.unlockCondition).toEqual({
          type: 'story-clear',
          stageId: '1-3',
        });
      });

      it('フリー対戦キャラは初期解放（default）', () => {
        const rookie = getDexEntryById('rookie');
        const regular = getDexEntryById('regular');
        const ace = getDexEntryById('ace');

        expect(rookie?.unlockCondition.type).toBe('default');
        expect(regular?.unlockCondition.type).toBe('default');
        expect(ace?.unlockCondition.type).toBe('default');
      });

      it('story-clear の stageId が dialogue-data.ts のステージ ID と一致する', () => {
        const storyStageIds = CHAPTER_1_STAGES.map((s) => s.id);

        for (const entry of DEX_ENTRIES) {
          if (entry.unlockCondition.type === 'story-clear') {
            expect(storyStageIds).toContain(entry.unlockCondition.stageId);
          }
        }
      });
    });

    describe('character-profiles.md との整合性', () => {
      it('蒼風館メンバーのプロフィールが設定と一致する', () => {
        const akira = getDexEntryById('player')!.profile;
        expect(akira.fullName).toBe('蒼葉 アキラ');
        expect(akira.reading).toBe('あおば あきら');
        expect(akira.grade).toBe('1年生');
        expect(akira.age).toBe(15);
        expect(akira.birthday).toBe('4月8日');
        expect(akira.height).toBe('165cm');
        expect(akira.school).toBe('蒼風館高校');
        expect(akira.personality).toEqual(['素直', '負けず嫌い', '行動派']);
        expect(akira.playStyle).toBe('オールラウンダー');
        expect(akira.specialMove).toBe('ライジングショット');
      });

      it('ヒロのプロフィールが設定と一致する', () => {
        const hiro = getDexEntryById('hiro')!.profile;
        expect(hiro.fullName).toBe('日向 ヒロ');
        expect(hiro.reading).toBe('ひなた ひろ');
        expect(hiro.grade).toBe('2年生');
        expect(hiro.age).toBe(16);
        expect(hiro.birthday).toBe('7月22日');
        expect(hiro.height).toBe('172cm');
        expect(hiro.personality).toEqual(['明るい', '面倒見がいい', 'お調子者']);
        expect(hiro.playStyle).toBe('ストレートシューター');
        expect(hiro.specialMove).toBe('バレットストレート');
      });

      it('ミサキのプロフィールが設定と一致する', () => {
        const misaki = getDexEntryById('misaki')!.profile;
        expect(misaki.fullName).toBe('水瀬 ミサキ');
        expect(misaki.reading).toBe('みなせ みさき');
        expect(misaki.grade).toBe('2年生');
        expect(misaki.age).toBe(16);
        expect(misaki.birthday).toBe('11月15日');
        expect(misaki.height).toBe('162cm');
        expect(misaki.personality).toEqual([
          '知的',
          '負けず嫌い',
          '世話焼き',
        ]);
        expect(misaki.playStyle).toBe('テクニシャン');
        expect(misaki.specialMove).toBe('ファントムカーブ');
      });

      it('タクマのプロフィールが設定と一致する', () => {
        const takuma = getDexEntryById('takuma')!.profile;
        expect(takuma.fullName).toBe('鷹見 タクマ');
        expect(takuma.reading).toBe('たかみ たくま');
        expect(takuma.grade).toBe('3年生');
        expect(takuma.age).toBe(17);
        expect(takuma.birthday).toBe('2月3日');
        expect(takuma.height).toBe('180cm');
        expect(takuma.personality).toEqual([
          '威厳',
          '責任感',
          '不器用な優しさ',
        ]);
        expect(takuma.playStyle).toBe('パワーバウンサー');
        expect(takuma.specialMove).toBe('サンダーウォール');
      });

      it('ユウのプロフィールが設定と一致する', () => {
        const yuu = getDexEntryById('yuu')!.profile;
        expect(yuu.fullName).toBe('柊 ユウ');
        expect(yuu.reading).toBe('ひいらぎ ゆう');
        expect(yuu.grade).toBe('1年生');
        expect(yuu.age).toBe(15);
        expect(yuu.birthday).toBe('9月12日');
        expect(yuu.height).toBe('160cm');
        expect(yuu.personality).toEqual(['分析的', '控えめ', '芯が強い']);
        expect(yuu.playStyle).toBe('アナライザー');
        expect(yuu.specialMove).toBe('データドライブ');
      });

      it('フリー対戦キャラのプロフィールが設定と一致する', () => {
        const rookie = getDexEntryById('rookie')!.profile;
        expect(rookie.fullName).toBe('春日 ソウタ');
        expect(rookie.reading).toBe('かすが そうた');
        expect(rookie.school).toBe('風見丘高校');
        expect(rookie.personality).toEqual(['のんびり', '楽天的']);

        const regular = getDexEntryById('regular')!.profile;
        expect(regular.fullName).toBe('秋山 ケンジ');
        expect(regular.reading).toBe('あきやま けんじ');
        expect(regular.school).toBe('翠嶺学園');
        expect(regular.personality).toEqual(['真面目', '努力家']);

        const ace = getDexEntryById('ace')!.profile;
        expect(ace.fullName).toBe('氷室 レン');
        expect(ace.reading).toBe('ひむろ れん');
        expect(ace.school).toBe('黒鉄高校');
        expect(ace.personality).toEqual(['クール', '実力主義']);
      });
    });
  });

  // ── ヘルパー関数 ──────────────────────────────

  describe('getDexEntryById()', () => {
    it('存在するキャラIDでエントリを取得できる', () => {
      const entry = getDexEntryById('player');
      expect(entry).toBeDefined();
      expect(entry!.profile.characterId).toBe('player');
    });

    it('存在しないキャラIDでundefinedを返す', () => {
      const entry = getDexEntryById('nonexistent');
      expect(entry).toBeUndefined();
    });
  });

  describe('getAllDexEntries()', () => {
    it('全エントリを返す', () => {
      const entries = getAllDexEntries();
      expect(entries).toHaveLength(8);
    });

    it('返される配列はDEX_ENTRIESと同じ内容を持つ', () => {
      const entries = getAllDexEntries();
      expect(entries).toEqual(DEX_ENTRIES);
    });
  });
});
