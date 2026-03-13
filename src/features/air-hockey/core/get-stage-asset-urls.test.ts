/**
 * getStageAssetUrls のテスト
 * ステージに必要な画像アセットURLを収集する関数
 */
import type { Character } from './types';
import type { StageDefinition } from './story';
import { getStageAssetUrls } from './get-stage-asset-urls';

// テスト用キャラクターデータ
const createTestCharacters = (): Record<string, Character> => ({
  player: {
    id: 'player',
    name: 'アキラ',
    icon: '/assets/characters/akira.png',
    color: '#3498db',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    portrait: {
      normal: '/assets/portraits/akira-normal.png',
      happy: '/assets/portraits/akira-happy.png',
    },
  },
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: '/assets/characters/hiro.png',
    color: '#e67e22',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
    portrait: {
      normal: '/assets/portraits/hiro-normal.png',
      happy: '/assets/portraits/hiro-happy.png',
    },
  },
  // portrait なしのキャラ
  noPortrait: {
    id: 'noPortrait',
    name: 'ノーポートレート',
    icon: '/assets/characters/no-portrait.png',
    color: '#000000',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  },
});

// テスト用ステージデータ
const createTestStage = (overrides: Partial<StageDefinition> = {}): StageDefinition => ({
  id: '1-1',
  chapter: 1,
  stageNumber: 1,
  name: 'テストステージ',
  characterId: 'hiro',
  fieldId: 'classic',
  difficulty: 'easy',
  winScore: 3,
  preDialogue: [],
  postWinDialogue: [],
  postLoseDialogue: [],
  ...overrides,
});

describe('getStageAssetUrls', () => {
  const characters = createTestCharacters();

  describe('背景画像の収集', () => {
    it('backgroundId がある場合、背景画像URLを含む', () => {
      const stage = createTestStage({ backgroundId: 'bg-clubroom' });
      const urls = getStageAssetUrls(stage, characters);
      expect(urls).toContain('/assets/backgrounds/bg-clubroom.webp');
    });

    it('backgroundId がない場合、背景画像URLを含まない', () => {
      const stage = createTestStage();
      const urls = getStageAssetUrls(stage, characters);
      const bgUrls = urls.filter(u => u.includes('/backgrounds/'));
      expect(bgUrls).toHaveLength(0);
    });

    it('未知の backgroundId の場合、背景画像URLを含まない', () => {
      const stage = createTestStage({ backgroundId: 'unknown-bg' });
      const urls = getStageAssetUrls(stage, characters);
      const bgUrls = urls.filter(u => u.includes('/backgrounds/'));
      expect(bgUrls).toHaveLength(0);
    });
  });

  describe('キャラ立ち絵の収集', () => {
    it('プレイヤーキャラの立ち絵（normal, happy）を含む', () => {
      const stage = createTestStage();
      const urls = getStageAssetUrls(stage, characters);
      expect(urls).toContain('/assets/portraits/akira-normal.png');
      expect(urls).toContain('/assets/portraits/akira-happy.png');
    });

    it('対戦相手キャラの立ち絵（normal, happy）を含む', () => {
      const stage = createTestStage({ characterId: 'hiro' });
      const urls = getStageAssetUrls(stage, characters);
      expect(urls).toContain('/assets/portraits/hiro-normal.png');
      expect(urls).toContain('/assets/portraits/hiro-happy.png');
    });

    it('portrait がないキャラの場合、立ち絵URLを含まない', () => {
      const stage = createTestStage({ characterId: 'noPortrait' });
      const urls = getStageAssetUrls(stage, characters);
      // プレイヤーの立ち絵は含む
      expect(urls).toContain('/assets/portraits/akira-normal.png');
      // 対戦相手の立ち絵は含まない
      expect(urls).not.toContain(expect.stringContaining('noPortrait'));
    });

    it('characters に存在しない characterId の場合、エラーにならない', () => {
      const stage = createTestStage({ characterId: 'unknown' });
      const urls = getStageAssetUrls(stage, characters);
      // プレイヤーの立ち絵のみ含む
      expect(urls).toContain('/assets/portraits/akira-normal.png');
    });
  });

  describe('勝利カットイン画像の収集', () => {
    it('isChapterFinale が true の場合、カットイン画像URLを含む', () => {
      const stage = createTestStage({ isChapterFinale: true, chapter: 1 });
      const urls = getStageAssetUrls(stage, characters);
      expect(urls).toContain('/assets/cutins/victory-ch1.png');
    });

    it('isChapterFinale が false の場合、カットイン画像URLを含まない', () => {
      const stage = createTestStage({ isChapterFinale: false });
      const urls = getStageAssetUrls(stage, characters);
      const cutinUrls = urls.filter(u => u.includes('/cutins/'));
      expect(cutinUrls).toHaveLength(0);
    });

    it('isChapterFinale が未定義の場合、カットイン画像URLを含まない', () => {
      const stage = createTestStage();
      const urls = getStageAssetUrls(stage, characters);
      const cutinUrls = urls.filter(u => u.includes('/cutins/'));
      expect(cutinUrls).toHaveLength(0);
    });
  });

  describe('重複排除', () => {
    it('返されるURLに重複がない', () => {
      const stage = createTestStage({ backgroundId: 'bg-clubroom', isChapterFinale: true, chapter: 1 });
      const urls = getStageAssetUrls(stage, characters);
      const uniqueUrls = [...new Set(urls)];
      expect(urls).toHaveLength(uniqueUrls.length);
    });
  });

  describe('総合テスト', () => {
    it('全要素を含むステージで正しいURL数を返す', () => {
      const stage = createTestStage({
        backgroundId: 'bg-clubroom',
        characterId: 'hiro',
        isChapterFinale: true,
        chapter: 1,
      });
      const urls = getStageAssetUrls(stage, characters);
      // 背景1 + プレイヤー立ち絵2 + 対戦相手立ち絵2 + カットイン1 = 6
      expect(urls).toHaveLength(6);
    });

    it('最小構成のステージで正しいURL数を返す', () => {
      const stage = createTestStage({ characterId: 'noPortrait' });
      const urls = getStageAssetUrls(stage, characters);
      // プレイヤー立ち絵2のみ
      expect(urls).toHaveLength(2);
    });
  });
});
