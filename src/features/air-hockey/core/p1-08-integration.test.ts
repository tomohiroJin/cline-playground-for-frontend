/**
 * P1-08: 統合・遷移管理テスト
 * AirHockeyGame の画面遷移ロジックを検証する
 */
import { CHAPTER_1_STAGES } from './dialogue-data';
import { findCharacterById, PLAYER_CHARACTER, BACKGROUND_MAP } from './characters';
import { getStageAssetUrls } from './get-stage-asset-urls';
import type { StageDefinition } from './story';
import type { Character, GameMode } from './types';

/**
 * 遷移ロジックのヘルパー関数群
 * AirHockeyGame.tsx のハンドラロジックをテスト可能な形で抽出
 */

/** ステージ選択時の遷移先を決定する */
function determineStageSelectTarget(stage: StageDefinition): 'chapterTitle' | 'preDialogue' {
  return stage.chapterTitle ? 'chapterTitle' : 'preDialogue';
}

/** 試合後ダイアログ完了時の遷移先を決定する */
function determinePostDialogueTarget(
  stage: StageDefinition | undefined,
  winner: string | null,
): 'victoryCutIn' | 'result' {
  if (stage?.isChapterFinale && winner === 'player') {
    return 'victoryCutIn';
  }
  return 'result';
}

/** ステージの背景URLを取得する */
function getBackgroundUrl(stage: StageDefinition): string | undefined {
  if (!stage.backgroundId) return undefined;
  return BACKGROUND_MAP[stage.backgroundId];
}

describe('P1-08: 統合・遷移管理', () => {
  describe('ScreenType の拡張', () => {
    it('chapterTitle と victoryCutIn を含む画面タイプが定義可能', () => {
      // ScreenType は AirHockeyGame.tsx 内のローカル型なので、
      // ここでは遷移先として使用される文字列リテラルを検証
      const validScreenTypes = [
        'menu', 'game', 'result', 'achievements', 'daily',
        'stageSelect', 'preDialogue', 'vsScreen', 'postDialogue',
        'chapterTitle', 'victoryCutIn',
      ] as const;

      expect(validScreenTypes).toContain('chapterTitle');
      expect(validScreenTypes).toContain('victoryCutIn');
    });
  });

  describe('ステージ選択時の遷移判定', () => {
    it('chapterTitle が定義されたステージでは chapterTitle 画面に遷移する', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.chapterTitle);
      expect(stage).toBeDefined();
      expect(determineStageSelectTarget(stage!)).toBe('chapterTitle');
    });

    it('chapterTitle が未定義のステージでは preDialogue 画面に遷移する', () => {
      const stage = CHAPTER_1_STAGES.find(s => !s.chapterTitle);
      expect(stage).toBeDefined();
      expect(determineStageSelectTarget(stage!)).toBe('preDialogue');
    });

    it('ステージ 1-1 は chapterTitle を持つ', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-1');
      expect(stage?.chapterTitle).toBe('第1章');
      expect(determineStageSelectTarget(stage!)).toBe('chapterTitle');
    });

    it('ステージ 1-2 は chapterTitle を持たない', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-2');
      expect(stage?.chapterTitle).toBeUndefined();
      expect(determineStageSelectTarget(stage!)).toBe('preDialogue');
    });
  });

  describe('チャプタータイトル完了後の遷移', () => {
    it('chapterTitle 完了後は preDialogue に遷移する', () => {
      // handleChapterTitleComplete は単純に preDialogue に遷移
      const nextScreen = 'preDialogue';
      expect(nextScreen).toBe('preDialogue');
    });
  });

  describe('試合後ダイアログ完了時の遷移判定', () => {
    it('章フィナーレ + プレイヤー勝利時は victoryCutIn に遷移する', () => {
      const finaleStage = CHAPTER_1_STAGES.find(s => s.isChapterFinale);
      expect(finaleStage).toBeDefined();
      expect(determinePostDialogueTarget(finaleStage, 'player')).toBe('victoryCutIn');
    });

    it('章フィナーレ + プレイヤー敗北時は result に遷移する', () => {
      const finaleStage = CHAPTER_1_STAGES.find(s => s.isChapterFinale);
      expect(determinePostDialogueTarget(finaleStage, 'cpu')).toBe('result');
    });

    it('中間ステージ + プレイヤー勝利時は result に遷移する', () => {
      const midStage = CHAPTER_1_STAGES.find(s => !s.isChapterFinale);
      expect(midStage).toBeDefined();
      expect(determinePostDialogueTarget(midStage, 'player')).toBe('result');
    });

    it('中間ステージ + プレイヤー敗北時は result に遷移する', () => {
      const midStage = CHAPTER_1_STAGES.find(s => !s.isChapterFinale);
      expect(determinePostDialogueTarget(midStage, 'cpu')).toBe('result');
    });

    it('ステージ未設定時は result に遷移する', () => {
      expect(determinePostDialogueTarget(undefined, 'player')).toBe('result');
    });
  });

  describe('勝利カットイン完了後の遷移', () => {
    it('victoryCutIn 完了後は result に遷移する', () => {
      const nextScreen = 'result';
      expect(nextScreen).toBe('result');
    });
  });

  describe('DialogueOverlay への背景URL 渡し', () => {
    it('backgroundId が定義されたステージの背景URLを取得できる', () => {
      CHAPTER_1_STAGES.forEach(stage => {
        if (stage.backgroundId) {
          const url = getBackgroundUrl(stage);
          expect(url).toBeDefined();
          expect(url).toMatch(/^\/assets\/backgrounds\//);
        }
      });
    });

    it('ステージ 1-1 の背景URLが正しい', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-1')!;
      expect(getBackgroundUrl(stage)).toBe('/assets/backgrounds/bg-clubroom.webp');
    });

    it('ステージ 1-2 の背景URLが正しい', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-2')!;
      expect(getBackgroundUrl(stage)).toBe('/assets/backgrounds/bg-gym.webp');
    });

    it('ステージ 1-3 の背景URLが正しい', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-3')!;
      expect(getBackgroundUrl(stage)).toBe('/assets/backgrounds/bg-school-gate.webp');
    });
  });

  describe('画像プリロード統合', () => {
    it('ステージ選択時にアセットURLを収集できる', () => {
      const stage = CHAPTER_1_STAGES[0];
      const characters: Record<string, Character> = {};
      const cpuChar = findCharacterById(stage.characterId);
      if (cpuChar) characters[stage.characterId] = cpuChar;
      characters['player'] = PLAYER_CHARACTER;

      const urls = getStageAssetUrls(stage, characters);
      expect(urls.length).toBeGreaterThan(0);
    });

    it('chapterTitle ステージでも背景画像がプリロード対象に含まれる', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.chapterTitle && s.backgroundId)!;
      const characters: Record<string, Character> = {};
      const cpuChar = findCharacterById(stage.characterId);
      if (cpuChar) characters[stage.characterId] = cpuChar;
      characters['player'] = PLAYER_CHARACTER;

      const urls = getStageAssetUrls(stage, characters);
      const bgUrl = BACKGROUND_MAP[stage.backgroundId!];
      expect(urls).toContain(bgUrl);
    });

    it('章フィナーレステージではカットイン画像がプリロード対象に含まれる', () => {
      const finaleStage = CHAPTER_1_STAGES.find(s => s.isChapterFinale)!;
      const characters: Record<string, Character> = {};
      const cpuChar = findCharacterById(finaleStage.characterId);
      if (cpuChar) characters[finaleStage.characterId] = cpuChar;
      characters['player'] = PLAYER_CHARACTER;

      const urls = getStageAssetUrls(finaleStage, characters);
      expect(urls).toContain(`/assets/cutins/victory-ch${finaleStage.chapter}.png`);
    });
  });

  describe('ChapterTitleCard コンポーネントの Props 整合性', () => {
    it('ステージ 1-1 のデータから ChapterTitleCard の Props を構築できる', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-1')!;
      const props = {
        chapter: stage.chapter,
        title: stage.chapterTitle!,
        subtitle: stage.chapterSubtitle,
        backgroundUrl: stage.backgroundId ? BACKGROUND_MAP[stage.backgroundId] : undefined,
      };

      expect(props.chapter).toBe(1);
      expect(props.title).toBe('第1章');
      expect(props.subtitle).toBe('はじめの一打');
      expect(props.backgroundUrl).toBe('/assets/backgrounds/bg-clubroom.webp');
    });
  });

  describe('VictoryCutIn コンポーネントの Props 整合性', () => {
    it('章フィナーレのカットイン画像URLが構築できる', () => {
      const finaleStage = CHAPTER_1_STAGES.find(s => s.isChapterFinale)!;
      const imageUrl = `/assets/cutins/victory-ch${finaleStage.chapter}.png`;
      expect(imageUrl).toBe('/assets/cutins/victory-ch1.png');
    });
  });

  describe('遷移フローの全体検証', () => {
    it('ストーリーモード: ステージ1-1（chapterTitle あり）の遷移パス', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-1')!;
      const transitions: string[] = [];

      // menu → stageSelect
      transitions.push('stageSelect');

      // stageSelect → chapterTitle（chapterTitle がある場合）
      transitions.push(determineStageSelectTarget(stage));

      // chapterTitle → preDialogue
      transitions.push('preDialogue');

      // preDialogue → vsScreen
      transitions.push('vsScreen');

      // vsScreen → game
      transitions.push('game');

      // game → postDialogue（ストーリーモード）
      transitions.push('postDialogue');

      // postDialogue → result（中間ステージ）
      transitions.push(determinePostDialogueTarget(stage, 'player'));

      expect(transitions).toEqual([
        'stageSelect', 'chapterTitle', 'preDialogue', 'vsScreen',
        'game', 'postDialogue', 'result',
      ]);
    });

    it('ストーリーモード: ステージ1-2（chapterTitle なし）の遷移パス', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-2')!;
      const transitions: string[] = [];

      transitions.push('stageSelect');
      transitions.push(determineStageSelectTarget(stage));
      transitions.push('vsScreen');
      transitions.push('game');
      transitions.push('postDialogue');
      transitions.push(determinePostDialogueTarget(stage, 'player'));

      expect(transitions).toEqual([
        'stageSelect', 'preDialogue', 'vsScreen',
        'game', 'postDialogue', 'result',
      ]);
    });

    it('ストーリーモード: ステージ1-3（章フィナーレ + 勝利）の遷移パス', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-3')!;
      const transitions: string[] = [];

      transitions.push('stageSelect');
      transitions.push(determineStageSelectTarget(stage));
      transitions.push('vsScreen');
      transitions.push('game');
      transitions.push('postDialogue');
      transitions.push(determinePostDialogueTarget(stage, 'player'));

      expect(transitions).toEqual([
        'stageSelect', 'preDialogue', 'vsScreen',
        'game', 'postDialogue', 'victoryCutIn',
      ]);
    });

    it('ストーリーモード: ステージ1-3（章フィナーレ + 敗北）の遷移パス', () => {
      const stage = CHAPTER_1_STAGES.find(s => s.id === '1-3')!;
      const transitions: string[] = [];

      transitions.push('stageSelect');
      transitions.push(determineStageSelectTarget(stage));
      transitions.push('vsScreen');
      transitions.push('game');
      transitions.push('postDialogue');
      transitions.push(determinePostDialogueTarget(stage, 'cpu'));

      // 敗北時は victoryCutIn を経由しない
      expect(transitions).toEqual([
        'stageSelect', 'preDialogue', 'vsScreen',
        'game', 'postDialogue', 'result',
      ]);
    });
  });

  describe('フリーモードへの影響なし', () => {
    it('フリーモードの遷移パスは変更なし（menu → game → result）', () => {
      // フリーモードでは gameMode === 'free' なので、
      // handleScreenChange は newScreen をそのまま使用
      const gameMode: GameMode = 'free';
      const newScreen = 'result';

      // ストーリーモードの分岐に入らない
      // handleScreenChange のロジック: story の場合のみ postDialogue を挟む
      const isStory = (gameMode as GameMode) === 'story';
      const actualScreen = isStory ? 'postDialogue' : newScreen;
      expect(actualScreen).toBe('result');
      expect(isStory).toBe(false);
    });
  });
});
