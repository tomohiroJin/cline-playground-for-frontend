/**
 * 迷宮の残響 - GameReducer テスト
 *
 * GameAction の全状態遷移をテストする。
 * Reducer は純粋関数であり、副作用を含まない。
 */
import {
  gameReducer,
  createInitialState,
  type GameReducerState,
  type UIPhase,
} from '../../../presentation/hooks/use-game-orchestrator';
import { createTestPlayer, createTestDifficulty, createTestEvent } from '../../helpers/factories';

/** テスト用のデフォルト状態を生成する */
const createTestState = (overrides: Partial<GameReducerState> = {}): GameReducerState => ({
  ...createInitialState(),
  ...overrides,
});

describe('gameReducer', () => {
  describe('初期状態', () => {
    it('createInitialState がタイトル画面の初期状態を返す', () => {
      // Act
      const state = createInitialState();

      // Assert
      expect(state.phase).toBe('title');
      expect(state.player).toBeNull();
      expect(state.diff).toBeNull();
      expect(state.event).toBeNull();
      expect(state.floor).toBe(1);
      expect(state.step).toBe(0);
      expect(state.usedIds).toEqual([]);
      expect(state.log).toEqual([]);
      expect(state.chainNext).toBeNull();
      expect(state.usedSecondLife).toBe(false);
      expect(state.ending).toBeNull();
      expect(state.isNewEnding).toBe(false);
      expect(state.isNewDiffClear).toBe(false);
      expect(state.showLog).toBe(false);
      expect(state.lastBought).toBeNull();
      expect(state.resTxt).toBe('');
      expect(state.resChg).toBeNull();
      expect(state.drainInfo).toBeNull();
    });
  });

  describe('START_RUN アクション', () => {
    it('タイトルから難易度選択画面に遷移する', () => {
      // Arrange
      const state = createTestState({ phase: 'title' });

      // Act
      const next = gameReducer(state, { type: 'START_RUN' });

      // Assert
      expect(next.phase).toBe('diff_select');
    });
  });

  describe('SELECT_DIFFICULTY アクション', () => {
    it('難易度選択後にフロア紹介画面に遷移する', () => {
      // Arrange
      const state = createTestState({ phase: 'diff_select' });
      const diff = createTestDifficulty();
      const player = createTestPlayer();

      // Act
      const next = gameReducer(state, {
        type: 'SELECT_DIFFICULTY',
        difficulty: diff,
        player,
      });

      // Assert
      expect(next.phase).toBe('floor_intro');
      expect(next.diff).toBe(diff);
      expect(next.player).toBe(player);
      expect(next.floor).toBe(1);
      expect(next.step).toBe(0);
      expect(next.usedIds).toEqual([]);
      expect(next.log).toEqual([]);
      expect(next.chainNext).toBeNull();
      expect(next.usedSecondLife).toBe(false);
      expect(next.ending).toBeNull();
      expect(next.drainInfo).toBeNull();
    });
  });

  describe('SET_EVENT アクション', () => {
    it('イベントをセットしてイベント画面に遷移する', () => {
      // Arrange
      const event = createTestEvent();
      const state = createTestState({ phase: 'floor_intro' });

      // Act
      const next = gameReducer(state, { type: 'SET_EVENT', event });

      // Assert
      expect(next.phase).toBe('event');
      expect(next.event).toBe(event);
    });
  });

  describe('APPLY_CHOICE アクション', () => {
    it('選択結果を適用して結果画面に遷移する', () => {
      // Arrange
      const player = createTestPlayer({ hp: 50 });
      const event = createTestEvent();
      const state = createTestState({
        phase: 'event',
        player: createTestPlayer(),
        event,
        floor: 1,
        step: 0,
      });
      const logEntry = { fl: 1, step: 1, ch: 'テスト', hp: -5, mn: 0, inf: 3 };

      // Act
      const next = gameReducer(state, {
        type: 'APPLY_CHOICE',
        player,
        resTxt: 'テスト結果テキスト',
        resChg: { hp: -5, mn: 0, inf: 3 },
        drainInfo: { hp: -1, mn: -1 },
        logEntry,
        chainNext: null,
        usedSecondLife: false,
      });

      // Assert
      expect(next.phase).toBe('result');
      expect(next.player).toBe(player);
      expect(next.resTxt).toBe('テスト結果テキスト');
      expect(next.resChg).toEqual({ hp: -5, mn: 0, inf: 3 });
      expect(next.drainInfo).toEqual({ hp: -1, mn: -1 });
      expect(next.log).toEqual([logEntry]);
    });

    it('チェインイベントIDを設定できる', () => {
      // Arrange
      const state = createTestState({ phase: 'event', player: createTestPlayer(), event: createTestEvent() });

      // Act
      const next = gameReducer(state, {
        type: 'APPLY_CHOICE',
        player: createTestPlayer(),
        resTxt: '結果',
        resChg: { hp: 0, mn: 0, inf: 0 },
        drainInfo: null,
        logEntry: { fl: 1, step: 1, ch: 'テスト', hp: 0, mn: 0, inf: 0 },
        chainNext: 'chain001',
        usedSecondLife: false,
      });

      // Assert
      expect(next.chainNext).toBe('chain001');
    });

    it('SecondLife 使用フラグを設定できる', () => {
      // Arrange
      const state = createTestState({ phase: 'event', player: createTestPlayer(), event: createTestEvent() });

      // Act
      const next = gameReducer(state, {
        type: 'APPLY_CHOICE',
        player: createTestPlayer(),
        resTxt: '結果',
        resChg: { hp: 0, mn: 0, inf: 0 },
        drainInfo: null,
        logEntry: { fl: 1, step: 1, ch: 'テスト', hp: 0, mn: 0, inf: 0 },
        chainNext: null,
        usedSecondLife: true,
      });

      // Assert
      expect(next.usedSecondLife).toBe(true);
    });
  });

  describe('SET_VICTORY アクション', () => {
    it('勝利画面に遷移してエンディング情報をセットする', () => {
      // Arrange
      const state = createTestState({ phase: 'result' });
      const ending = {
        id: 'end001',
        name: 'テストエンディング',
        sub: 'テスト',
        desc: 'テスト説明',
        subtitle: 'テスト',
        description: 'テスト説明',
        cond: () => true,
        color: '#fff',
        icon: '🏆',
        bonusKp: 5,
        gradient: 'linear-gradient(#000, #fff)',
      };

      // Act
      const next = gameReducer(state, {
        type: 'SET_VICTORY',
        ending,
        isNewEnding: true,
        isNewDiffClear: false,
      });

      // Assert
      expect(next.phase).toBe('victory');
      expect(next.ending).toBe(ending);
      expect(next.isNewEnding).toBe(true);
      expect(next.isNewDiffClear).toBe(false);
    });
  });

  describe('SET_GAME_OVER アクション', () => {
    it('ゲームオーバー画面に遷移する', () => {
      // Arrange
      const state = createTestState({ phase: 'result' });

      // Act
      const next = gameReducer(state, { type: 'SET_GAME_OVER' });

      // Assert
      expect(next.phase).toBe('gameover');
    });
  });

  describe('ADVANCE_STEP アクション', () => {
    it('次のイベントに進む', () => {
      // Arrange
      const event = createTestEvent({ id: 'ev002' });
      const state = createTestState({
        phase: 'result',
        step: 0,
        usedIds: ['ev001'],
      });

      // Act
      const next = gameReducer(state, {
        type: 'ADVANCE_STEP',
        event,
        step: 1,
        usedIds: ['ev001', 'ev002'],
      });

      // Assert
      expect(next.phase).toBe('event');
      expect(next.event).toBe(event);
      expect(next.step).toBe(1);
      expect(next.usedIds).toEqual(['ev001', 'ev002']);
      expect(next.drainInfo).toBeNull();
    });
  });

  describe('CHANGE_FLOOR アクション', () => {
    it('フロア変更してフロア紹介画面に遷移する', () => {
      // Arrange
      const state = createTestState({ phase: 'result', floor: 1, step: 3 });

      // Act
      const next = gameReducer(state, { type: 'CHANGE_FLOOR', floor: 2 });

      // Assert
      expect(next.phase).toBe('floor_intro');
      expect(next.floor).toBe(2);
      expect(next.step).toBe(0);
    });
  });

  describe('NAVIGATE_MENU アクション', () => {
    const menuScreens: UIPhase[] = ['unlocks', 'titles', 'records', 'settings', 'reset_confirm1', 'reset_confirm2'];

    menuScreens.forEach(screen => {
      it(`${screen} 画面に遷移する`, () => {
        // Arrange
        const state = createTestState({ phase: 'title' });

        // Act
        const next = gameReducer(state, { type: 'NAVIGATE_MENU', screen });

        // Assert
        expect(next.phase).toBe(screen);
      });
    });
  });

  describe('BACK_TO_TITLE アクション', () => {
    it('タイトル画面に戻りゲーム状態をリセットする', () => {
      // Arrange
      const state = createTestState({
        phase: 'gameover',
        player: createTestPlayer(),
        diff: createTestDifficulty(),
        event: createTestEvent(),
        floor: 3,
        step: 2,
      });

      // Act
      const next = gameReducer(state, { type: 'BACK_TO_TITLE' });

      // Assert
      expect(next.phase).toBe('title');
      expect(next.player).toBeNull();
      expect(next.diff).toBeNull();
      expect(next.event).toBeNull();
      expect(next.floor).toBe(1);
      expect(next.step).toBe(0);
      expect(next.usedIds).toEqual([]);
      expect(next.log).toEqual([]);
    });
  });

  describe('TOGGLE_LOG アクション', () => {
    it('ログ表示を切り替える（false → true）', () => {
      // Arrange
      const state = createTestState({ showLog: false });

      // Act
      const next = gameReducer(state, { type: 'TOGGLE_LOG' });

      // Assert
      expect(next.showLog).toBe(true);
    });

    it('ログ表示を切り替える（true → false）', () => {
      // Arrange
      const state = createTestState({ showLog: true });

      // Act
      const next = gameReducer(state, { type: 'TOGGLE_LOG' });

      // Assert
      expect(next.showLog).toBe(false);
    });
  });

  describe('SET_LAST_BOUGHT アクション', () => {
    it('最後に購入したアイテムIDをセットする', () => {
      // Arrange
      const state = createTestState();

      // Act
      const next = gameReducer(state, { type: 'SET_LAST_BOUGHT', id: 'unlock001' });

      // Assert
      expect(next.lastBought).toBe('unlock001');
    });

    it('null でクリアできる', () => {
      // Arrange
      const state = createTestState({ lastBought: 'unlock001' });

      // Act
      const next = gameReducer(state, { type: 'SET_LAST_BOUGHT', id: null });

      // Assert
      expect(next.lastBought).toBeNull();
    });
  });

  describe('不変性', () => {
    it('状態オブジェクトを変更せず新しいオブジェクトを返す', () => {
      // Arrange
      const state = createTestState();

      // Act
      const next = gameReducer(state, { type: 'START_RUN' });

      // Assert
      expect(next).not.toBe(state);
      expect(state.phase).toBe('title');
    });

    it('変更がない場合でも新しいオブジェクトを返す', () => {
      // Arrange
      const state = createTestState({ showLog: false });

      // Act
      const next = gameReducer(state, { type: 'TOGGLE_LOG' });
      const next2 = gameReducer(next, { type: 'TOGGLE_LOG' });

      // Assert
      expect(next2).not.toBe(state);
      expect(next2.showLog).toBe(false);
    });
  });

  describe('フェーズ遷移の整合性', () => {
    it('通常のゲームフロー全体を正しく遷移する', () => {
      // Arrange
      let state = createInitialState();
      const diff = createTestDifficulty();
      const player = createTestPlayer();
      const event = createTestEvent();

      // Act & Assert: title → diff_select
      state = gameReducer(state, { type: 'START_RUN' });
      expect(state.phase).toBe('diff_select');

      // diff_select → floor_intro
      state = gameReducer(state, { type: 'SELECT_DIFFICULTY', difficulty: diff, player });
      expect(state.phase).toBe('floor_intro');

      // floor_intro → event
      state = gameReducer(state, { type: 'SET_EVENT', event });
      expect(state.phase).toBe('event');

      // event → result
      state = gameReducer(state, {
        type: 'APPLY_CHOICE',
        player: createTestPlayer({ hp: 50 }),
        resTxt: '結果',
        resChg: { hp: -5, mn: 0, inf: 3 },
        drainInfo: null,
        logEntry: { fl: 1, step: 1, ch: 'テスト', hp: -5, mn: 0, inf: 3 },
        chainNext: null,
        usedSecondLife: false,
      });
      expect(state.phase).toBe('result');

      // result → event (次イベント)
      const nextEvent = createTestEvent({ id: 'ev002' });
      state = gameReducer(state, { type: 'ADVANCE_STEP', event: nextEvent, step: 1, usedIds: ['test001', 'ev002'] });
      expect(state.phase).toBe('event');
    });
  });
});
