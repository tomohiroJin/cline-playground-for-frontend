/**
 * 迷宮の残響 - GameRouter 終章フェーズ テスト
 *
 * phase='finale' のとき FinaleScreen が描画され、
 * ハンドラが正しく配線されていることを検証する。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameRouter } from '../../../presentation/components/GameRouter';
import type { GameRouterProps, GameState, UIState } from '../../../presentation/components/GameRouter';
import { createTestMeta, createTestFx } from '../../helpers/factories';
import { FLOOR_META } from '../../../domain/constants/floor-meta';

// モック（既存 game-router.test.tsx と同一設定）
jest.mock('../../../audio', () => ({
  AudioEngine: { init: jest.fn(), resume: jest.fn(), sfx: {}, bgm: { startFloorBgm: jest.fn(), stopBgm: jest.fn(), setEventMood: jest.fn(), updateCrisis: jest.fn(), setBgmVolume: jest.fn() } },
  loadAudioSettings: () => ({ sfxEnabled: false, bgmEnabled: false, bgmVolume: 0.5, sfxVolume: 1 }),
  saveAudioSettings: jest.fn(),
}));

/** デフォルトのゲーム状態（finaleStep を含む） */
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
  legacyId: null,
  finaleStep: 0,
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

/** テスト用デフォルトProps（ネストされたオブジェクトの部分上書きをサポート） */
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
      finaleEscape: jest.fn(),
      finaleAdvance: jest.fn(),
      finaleDecide: jest.fn(),
    },
    Particles: <div data-testid="particles" />,
    eventCount: 100,
    ...rest,
  };
};

describe('GameRouter — 終章フェーズ', () => {
  describe('finaleStep=0（オファー画面）', () => {
    it('phase=finale, finaleStep=0 でオファー画面が描画される', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({
        phase: 'finale',
        game: { finaleStep: 0 },
      })} />);

      // Assert: FinaleScreen の offer テキスト
      expect(screen.getByText('さらなる深淵')).toBeInTheDocument();
    });
  });

  describe('finaleStep=1（第1ビート）', () => {
    it('phase=finale, finaleStep=1 で終章ビート「集う残響」が描画される', () => {
      // Arrange & Act
      render(<GameRouter {...createDefaultProps({
        phase: 'finale',
        game: { finaleStep: 1 },
      })} />);

      // Assert: FINALE_BEATS[0].title = '集う残響'
      expect(screen.getByText('集う残響')).toBeInTheDocument();
    });
  });

  describe('ハンドラ配線', () => {
    it('onEscape ボタンクリックで finaleEscape ハンドラが呼ばれる', () => {
      // Arrange
      const finaleEscape = jest.fn();
      const props = createDefaultProps({ phase: 'finale', game: { finaleStep: 0 } });
      props.handlers.finaleEscape = finaleEscape;
      render(<GameRouter {...props} />);

      // Act
      fireEvent.click(screen.getByText('ここで脱出する'));

      // Assert
      expect(finaleEscape).toHaveBeenCalledTimes(1);
    });

    it('「さらに深く潜る」クリックで finaleAdvance ハンドラが呼ばれる', () => {
      // Arrange
      const finaleAdvance = jest.fn();
      const props = createDefaultProps({ phase: 'finale', game: { finaleStep: 0 } });
      props.handlers.finaleAdvance = finaleAdvance;
      render(<GameRouter {...props} />);

      // Act: オファー画面の「さらに深く」ボタンをクリック
      fireEvent.click(screen.getByText(/さらに深く/));

      // Assert
      expect(finaleAdvance).toHaveBeenCalledTimes(1);
    });

    it('最終ビートで決断ボタンクリックすると finaleDecide ハンドラが呼ばれる', () => {
      // Arrange
      const finaleDecide = jest.fn();
      const props = createDefaultProps({ phase: 'finale', game: { finaleStep: 3 } });
      props.handlers.finaleDecide = finaleDecide;
      render(<GameRouter {...props} />);

      // Act: 「願いを継ぐ」をクリック → 'inherit' で呼ばれる
      fireEvent.click(screen.getByText('願いを継ぐ'));

      // Assert
      expect(finaleDecide).toHaveBeenCalledWith('inherit');
    });
  });
});
