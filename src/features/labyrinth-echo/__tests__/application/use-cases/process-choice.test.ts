/**
 * 迷宮の残響 - ProcessChoiceUseCase テスト
 */
import { processChoice } from '../../../application/use-cases/process-choice';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { createMetaState } from '../../../domain/models/meta-state';
import type { GameState } from '../../../domain/models/game-state';
import type { GameEvent } from '../../../domain/events/game-event';

/** テスト用GameStateを生成する */
const createTestGameState = (overrides: Partial<GameState> = {}): GameState => ({
  phase: 'event',
  player: {
    hp: 55, maxHp: 55, mn: 35, maxMn: 35, inf: 5, statuses: [],
  },
  difficulty: DIFFICULTY.find(d => d.id === 'normal')!,
  floor: 1,
  step: 1,
  usedEventIds: [],
  log: [],
  chainNextId: null,
  usedSecondLife: false,
  ...overrides,
});

/** テスト用イベントを生成する */
const createTestEvent = (overrides: Partial<GameEvent> = {}): GameEvent => ({
  id: 'test001',
  fl: [1],
  tp: 'exploration',
  sit: 'テスト用のイベントです。',
  ch: [
    {
      t: 'テスト選択肢A',
      o: [{ c: 'default', r: 'テスト結果A', hp: -10, mn: 0, inf: 3 }],
    },
    {
      t: 'テスト選択肢B',
      o: [{ c: 'default', r: 'テスト結果B', hp: 5, mn: -5, inf: 0 }],
    },
  ],
  ...overrides,
});

describe('processChoice', () => {
  describe('通常選択の結果計算', () => {
    it('選択肢Aを選んだ場合にHP減少・情報値増加が適用される', () => {
      // Arrange
      const event = createTestEvent();
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      const player = result.gameState.player!;
      // normal難易度: dmgMult=1, drainMod=-1
      expect(player.hp).toBe(55 - 10); // HP -10
      expect(player.inf).toBe(5 + 3);  // 情報値 +3
    });

    it('選択肢Bを選んだ場合にHP回復・MN減少が適用される', () => {
      // Arrange
      const event = createTestEvent();
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 1,
        event,
        meta,
      });

      // Assert
      const player = result.gameState.player!;
      expect(player.hp).toBe(55);  // 回復+5だがmaxHpでクランプ → 55
      expect(player.mn).toBeLessThan(35); // MNが減少（ドレインも加算）
    });

    it('resultTextが設定される', () => {
      // Arrange
      const event = createTestEvent();
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.resultText).toBe('テスト結果A');
    });
  });

  describe('ドレイン処理', () => {
    it('normal難易度ではドレインが適用される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '何もしない', o: [{ c: 'default', r: '結果', hp: 0, mn: 0, inf: 0 }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      const player = result.gameState.player!;
      // drainMod = -1 → MN -1
      expect(player.mn).toBe(35 - 1);
      expect(result.feedback.drain).not.toBeNull();
    });
  });

  describe('死亡判定', () => {
    it('HPが0になった場合にgame_overフェーズに遷移する', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '致命的な選択', o: [{ c: 'default', r: '致命傷を受けた', hp: -100, mn: 0, inf: 0 }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.phase).toBe('game_over');
      expect(result.gameState.player!.hp).toBe(0);
    });

    it('MNが0になった場合にgame_overフェーズに遷移する', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '精神崩壊', o: [{ c: 'default', r: '精神が崩壊した', hp: 0, mn: -100, inf: 0 }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.phase).toBe('game_over');
      expect(result.gameState.player!.mn).toBe(0);
    });
  });

  describe('脱出判定', () => {
    it('escapeフラグがある場合にendingフェーズに遷移する', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '脱出', o: [{ c: 'default', r: '脱出に成功した', hp: 0, mn: 0, inf: 0, fl: 'escape' }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.phase).toBe('ending');
    });
  });

  describe('SecondLife', () => {
    it('secondLife効果があり未使用の場合に復活する', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '致命的な選択', o: [{ c: 'default', r: '致命傷', hp: -100, mn: 0, inf: 0 }] }],
      });
      // secondLife効果を持つアンロック u21
      const meta = createMetaState({ unlocked: ['u21'] });
      const gameState = createTestGameState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.phase).not.toBe('game_over');
      expect(result.gameState.player!.hp).toBeGreaterThan(0);
      expect(result.feedback.secondLifeActivated).toBe(true);
      expect(result.gameState.usedSecondLife).toBe(true);
    });

    it('secondLife既使用の場合は復活しない', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '致命的な選択', o: [{ c: 'default', r: '致命傷', hp: -100, mn: 0, inf: 0 }] }],
      });
      const meta = createMetaState({ unlocked: ['u21'] });
      const gameState = createTestGameState({ usedSecondLife: true });

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.phase).toBe('game_over');
    });
  });

  describe('チェインイベント', () => {
    it('chain:フラグがある場合にchainNextIdが設定される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: 'チェイン選択', o: [{ c: 'default', r: '連鎖発生', hp: 0, mn: 0, inf: 0, fl: 'chain:evt002' }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.chainTriggered).toBe(true);
      expect(result.gameState.chainNextId).toBe('evt002');
    });

    it('チェインイベント消化後にchainフラグがない場合はchainNextIdがクリアされる', () => {
      // Arrange: chainNextId が設定された状態で、chainフラグのないイベントを処理
      const event = createTestEvent({
        ch: [{ t: '通常選択', o: [{ c: 'default', r: '通常の結果', hp: -5, mn: 0, inf: 3 }] }],
      });
      const gameState = createTestGameState({ chainNextId: 'e141' });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert: チェインが終了したのでchainNextIdはnullになるべき
      expect(result.gameState.chainNextId).toBeNull();
    });

    it('チェインイベント消化後にadd:フラグがある場合もchainNextIdがクリアされる', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '呪いを受ける', o: [{ c: 'default', r: '呪いを受けた', hp: 0, mn: 0, inf: 0, fl: 'add:呪い' }] }],
      });
      const gameState = createTestGameState({ chainNextId: 'e166' });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.chainNextId).toBeNull();
    });

    it('チェインイベントから新しいチェインが発生した場合は新しいIDが設定される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: 'チェイン選択', o: [{ c: 'default', r: '連鎖発生', hp: 0, mn: 0, inf: 0, fl: 'chain:e168' }] }],
      });
      const gameState = createTestGameState({ chainNextId: 'e167' });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert: 古いIDではなく新しいIDが設定される
      expect(result.gameState.chainNextId).toBe('e168');
    });
  });

  describe('ChoiceFeedback', () => {
    it('大ダメージの場合にimpactがbigDmgになる', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '大ダメージ', o: [{ c: 'default', r: '大ダメージ', hp: -20, mn: 0, inf: 0 }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.impact).toBe('bigDmg');
    });

    it('回復の場合にimpactがhealになる', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '回復', o: [{ c: 'default', r: '回復した', hp: 10, mn: 0, inf: 0 }] }],
      });
      const gameState = createTestGameState({
        player: { hp: 30, maxHp: 55, mn: 35, maxMn: 35, inf: 5, statuses: [] },
      });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.impact).toBe('heal');
    });

    it('statChangesが正しく計算される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '選択', o: [{ c: 'default', r: '結果', hp: -10, mn: -5, inf: 3 }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.statChanges.hp).toBe(-10);
      expect(result.feedback.statChanges.mn).toBe(-5);
      expect(result.feedback.statChanges.inf).toBe(3);
    });
  });

  describe('ステータス効果', () => {
    it('add:フラグでステータスが追加される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '呪い', o: [{ c: 'default', r: '呪いを受けた', hp: 0, mn: 0, inf: 0, fl: 'add:呪い' }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.statusAdded).toBe('呪い');
    });

    it('remove:フラグでステータスが除去される', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '治療', o: [{ c: 'default', r: '治療した', hp: 0, mn: 0, inf: 0, fl: 'remove:出血' }] }],
      });
      const gameState = createTestGameState({
        player: { hp: 55, maxHp: 55, mn: 35, maxMn: 35, inf: 5, statuses: ['出血'] },
      });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.statusRemoved).toBe('出血');
    });
  });

  describe('ログ記録', () => {
    it('選択結果がログに記録される', () => {
      // Arrange
      const event = createTestEvent();
      const gameState = createTestGameState({ floor: 2, step: 3 });
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.gameState.log.length).toBe(1);
      const logEntry = result.gameState.log[0];
      expect(logEntry.fl).toBe(2);
      expect(logEntry.step).toBe(3);
    });
  });

  describe('未知のフラグ', () => {
    it('未知のフラグ文字列が渡された場合にステータス変更やチェインが発生しない', () => {
      // Arrange
      const event = createTestEvent({
        ch: [{ t: '未知フラグ', o: [{ c: 'default', r: '結果', hp: 0, mn: 0, inf: 0, fl: 'unknown_flag' }] }],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act
      const result = processChoice({
        gameState,
        choiceIndex: 0,
        event,
        meta,
      });

      // Assert
      expect(result.feedback.statusAdded).toBeNull();
      expect(result.feedback.statusRemoved).toBeNull();
      expect(result.feedback.chainTriggered).toBe(false);
      expect(result.gameState.phase).toBe('result');
    });
  });

  describe('境界チェック', () => {
    it('choiceIndexが選択肢の数以上の場合にエラーをスローする', () => {
      // Arrange: 選択肢が2つのイベントに対してインデックス2（範囲外）を指定
      const event = createTestEvent(); // ch が2つ（インデックス0, 1のみ有効）
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act & Assert — エラーメッセージに「範囲外」が含まれること
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() =>
        processChoice({
          gameState,
          choiceIndex: 2,
          event,
          meta,
        })
      ).toThrow(/範囲外/);
      consoleSpy.mockRestore();
    });

    it('choiceIndexが負の場合にエラーをスローする', () => {
      // Arrange: 負のインデックスを指定
      const event = createTestEvent();
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act & Assert — エラーメッセージに「範囲外」が含まれること
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() =>
        processChoice({
          gameState,
          choiceIndex: -1,
          event,
          meta,
        })
      ).toThrow(/範囲外/);
      consoleSpy.mockRestore();
    });

    it('アウトカムが空の選択肢でエラーをスローする', () => {
      // Arrange: アウトカムが空（o: []）の選択肢を持つイベント
      const event = createTestEvent({
        ch: [
          {
            t: 'アウトカムなし選択肢',
            // 型エラーを避けるためキャストで空配列を渡す
            o: [] as unknown as [{ c: string; r: string; hp: number; mn: number; inf: number }],
          },
        ],
      });
      const gameState = createTestGameState();
      const meta = createMetaState();

      // Act & Assert — エラーメッセージに「アウトカム」が含まれること
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      expect(() =>
        processChoice({
          gameState,
          choiceIndex: 0,
          event,
          meta,
        })
      ).toThrow(/アウトカム/);
      consoleSpy.mockRestore();
    });
  });
});
