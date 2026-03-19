/**
 * 迷宮の残響 - GameRouter テスト
 *
 * フェーズに応じた画面コンポーネントの切り替えをテストする。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameRouter, LoadingScreen } from '../../../presentation/components/GameRouter';
import type { GameRouterProps, GameState, UIState } from '../../../presentation/components/GameRouter';
import { createTestPlayer, createTestDifficulty, createTestMeta, createTestFx, createTestEvent } from '../../helpers/factories';
import { FLOOR_META } from '../../../domain/constants/floor-meta';

// モック
jest.mock('../../../audio', () => ({
  AudioEngine: { init: jest.fn(), resume: jest.fn(), sfx: {}, bgm: { startFloorBgm: jest.fn(), stopBgm: jest.fn(), setEventMood: jest.fn(), updateCrisis: jest.fn(), setBgmVolume: jest.fn() } },
  loadAudioSettings: () => ({ sfxEnabled: false, bgmEnabled: false, bgmVolume: 0.5, sfxVolume: 1 }),
  saveAudioSettings: jest.fn(),
}));

/** デフォルトのゲーム状態 */
const DEFAULT_GAME: GameState = {
  player: null,
  diff: null,
  event: null,
  floor: 1,
  step: 0,
  ending: null,
  isNewEnding: false,
  isNewDiffClear: false,
  usedSecondLife: false,
  chainNext: null,
  log: [],
  resTxt: '',
  resChg: null,
  drainInfo: null,
};

/** デフォルトのUI状態 */
const DEFAULT_UI: UIState = {
  showLog: false,
  audioSettings: { sfxEnabled: false, bgmEnabled: false, bgmVolume: 0.5, sfxVolume: 1 },
  lastBought: null,
  shake: false,
  overlay: null,
  revealed: '',
  done: false,
  ready: false,
};

/** テスト用のデフォルトProps（ネストされたオブジェクトの部分上書きをサポート） */
const createDefaultProps = (overrides: {
  phase?: GameRouterProps['phase'];
  game?: Partial<GameState>;
  ui?: Partial<UIState>;
  [key: string]: unknown;
} = {}): GameRouterProps => {
  const { phase, game, ui, ...rest } = overrides;
  return {
    phase: phase ?? 'title',
    game: { ...DEFAULT_GAME, ...game },
    derived: {
      meta: createTestMeta(),
      fx: createTestFx(),
      progressPct: 0,
      floorMeta: FLOOR_META[1],
      floorColor: FLOOR_META[1].color,
      vignette: {},
      lowMental: false,
    },
    ui: { ...DEFAULT_UI, ...ui },
    handlers: {
      startRun: jest.fn(),
      enableAudio: jest.fn(),
      selectDiff: jest.fn(),
      enterFloor: jest.fn(),
      handleChoice: jest.fn(),
      proceed: jest.fn(),
      doUnlock: jest.fn(),
      toggleAudio: jest.fn(),
      setShowLog: jest.fn(),
      setPhase: jest.fn(),
      updateMeta: jest.fn(),
      resetMeta: jest.fn(),
      handleAudioSettingsChange: jest.fn(),
      skip: jest.fn(),
    },
    Particles: <div data-testid="particles" />,
    eventCount: 100,
    ...rest,
  };
};

describe('GameRouter', () => {
  describe('フェーズルーティング', () => {
    it('タイトル画面を表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({ phase: 'title' })} />);

      // Assert
      expect(screen.getByText('迷宮の残響')).toBeTruthy();
    });

    it('難易度選択画面を表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({ phase: 'diff_select' })} />);

      // Assert
      expect(screen.getByText('難易度選択')).toBeTruthy();
    });

    it('フロア紹介画面を表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({
        phase: 'floor_intro',
        game: { player: createTestPlayer(), diff: createTestDifficulty() },
      })} />);

      // Assert
      expect(screen.getByText(/迷宮に踏み込む/)).toBeTruthy();
    });

    it('ゲームオーバー画面を表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({
        phase: 'gameover',
        game: { player: createTestPlayer({ hp: 0 }), diff: createTestDifficulty() },
      })} />);

      // Assert
      expect(screen.getByText(/探索失敗/)).toBeTruthy();
    });

    it('設定画面を表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({ phase: 'settings' })} />);

      // Assert
      expect(screen.getByText('設定')).toBeTruthy();
    });
  });

  describe('イベント画面', () => {
    it('プレイヤーとイベントが存在する場合にイベント画面を表示する', () => {
      // Arrange
      const event = createTestEvent({ sit: 'テストシチュエーション' });

      // Act
      render(<GameRouter {...createDefaultProps({
        phase: 'event',
        game: { player: createTestPlayer(), diff: createTestDifficulty(), event },
        ui: { revealed: 'テストシチュエーション', done: true, ready: true },
      })} />);

      // Assert
      expect(screen.getByText('テストシチュエーション')).toBeTruthy();
    });
  });

  describe('結果画面', () => {
    it('結果テキストを表示する', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({
        phase: 'result',
        game: {
          player: createTestPlayer(),
          diff: createTestDifficulty(),
          event: createTestEvent(),
          resTxt: 'テスト結果テキスト',
          resChg: { hp: -5, mn: 0, inf: 3 },
        },
        ui: { revealed: 'テスト結果テキスト', done: true, ready: true },
      })} />);

      // Assert
      expect(screen.getByText('テスト結果テキスト')).toBeTruthy();
    });
  });
});

describe('LoadingScreen', () => {
  it('ローディング画面を表示する', () => {
    // Arrange & Act
    render(<LoadingScreen Particles={<div />} />);

    // Assert
    expect(screen.getByText('迷宮の残響')).toBeTruthy();
    expect(screen.getByText('loading...')).toBeTruthy();
  });
});
