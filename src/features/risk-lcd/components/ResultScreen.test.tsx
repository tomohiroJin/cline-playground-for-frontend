import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultScreen from './ResultScreen';
import type { GameState, PerkDef, MergedStyle } from '../types';

// テスト用の最小 GameState を生成
function createTestGameState(overrides?: Partial<GameState>): GameState {
  const defaultStyle: MergedStyle = {
    mu: [1, 2, 4],
    rs: [],
    sf: [],
    wm: 0,
    cm: 0,
    sh: 0,
    sp: 0,
    db: 0,
    cb: 0,
    bfSet: [0, 4, 6],
    autoBlock: 0,
  };

  return {
    lane: 1 as GameState['lane'],
    alive: false,
    shields: 0,
    frozen: 0,
    moveOk: true,
    moveCd: 0,
    revive: 0,
    shelterSaves: 2,
    score: 1200,
    total: 35,
    comboCount: 0,
    maxCombo: 8,
    nearMiss: 5,
    riskScore: 3,
    scoreMult: 1,
    comboBonus: 0,
    stage: 3,
    cycle: 0,
    maxStg: 5,
    curStgCfg: null,
    stageMod: null,
    slowMod: 0,
    speedMod: 0,
    bfAdj: 0,
    bfAdj_lane: 0,
    bfAdj_extra: 0,
    baseBonus: 0,
    artState: 'idle',
    walkFrame: 0,
    artFrame: 0,
    st: defaultStyle,
    phase: 'done',
    perks: [],
    perkChoices: null,
    curBf0: [4, 4, 4],
    dailyMode: false,
    practiceMode: false,
    ghostLog: [],
    ...overrides,
  } as GameState;
}

describe('ResultScreen', () => {
  const defaultProps = {
    active: true,
    game: createTestGameState(),
    hasGold: false,
    equippedStyles: ['standard'],
  };

  describe('タイトル表示', () => {
    it('ゲームオーバー時に「GAME OVER」が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });

    it('全クリア時に「ALL CLEAR!」が表示される', () => {
      const game = createTestGameState();
      const extra = game as GameState & { _cleared?: boolean };
      extra._cleared = true;
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('ALL CLEAR!')).toBeInTheDocument();
    });

    it('練習モード終了時に「PRACTICE OVER」が表示される', () => {
      const game = createTestGameState({ practiceMode: true });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('PRACTICE OVER')).toBeInTheDocument();
    });

    it('練習モードクリア時に「PRACTICE CLEAR!」が表示される', () => {
      const game = createTestGameState({ practiceMode: true });
      const extra = game as GameState & { _cleared?: boolean };
      extra._cleared = true;
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('PRACTICE CLEAR!')).toBeInTheDocument();
    });

    it('デイリーモード終了時に「DAILY OVER」が表示される', () => {
      const game = createTestGameState({ dailyMode: true });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('DAILY OVER')).toBeInTheDocument();
    });

    it('デイリーモードクリア時に「DAILY CLEAR!」が表示される', () => {
      const game = createTestGameState({ dailyMode: true });
      const extra = game as GameState & { _cleared?: boolean };
      extra._cleared = true;
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('DAILY CLEAR!')).toBeInTheDocument();
    });
  });

  describe('統計表示', () => {
    it('スコアが表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('SCORE')).toBeInTheDocument();
      expect(screen.getByText('1200')).toBeInTheDocument();
    });

    it('ステージ情報が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('STAGE')).toBeInTheDocument();
      expect(screen.getByText('4/6')).toBeInTheDocument();
    });

    it('サイクル数が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('CYCLES')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
    });

    it('最大コンボが表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('MAX COMBO')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('ニアミス回数が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('NEAR MISS')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('ハイリスク回数が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('PT獲得表示', () => {
    it('獲得PTが表示される', () => {
      const game = createTestGameState({ score: 1000 });
      const extra = game as GameState & { _earnedPt?: number };
      extra._earnedPt = 100;
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText(/\+100PT/)).toBeInTheDocument();
    });

    it('ゴールド所持時に (×2) が表示される', () => {
      const game = createTestGameState({ score: 1000 });
      const extra = game as GameState & { _earnedPt?: number };
      extra._earnedPt = 200;
      render(<ResultScreen {...defaultProps} game={game} hasGold={true} />);
      expect(screen.getByText(/×2/)).toBeInTheDocument();
    });

    it('練習モードでは「PT獲得なし」が表示される', () => {
      const game = createTestGameState({ practiceMode: true });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText('PT獲得なし')).toBeInTheDocument();
    });
  });

  describe('パーク・ビルド表示', () => {
    it('パークがある場合にビルド情報が表示される', () => {
      const perks: PerkDef[] = [
        { id: 'shield', nm: '緊急防壁', ds: 'シールド+1', tp: 'buff', ic: '◆', fn: () => {} },
        { id: 'slow', nm: '時の砂', ds: '速度-15%', tp: 'buff', ic: '◷', fn: () => {} },
      ];
      const game = createTestGameState({ perks });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.getByText(/BUILD:/)).toBeInTheDocument();
      expect(screen.getByText(/◆緊急防壁/)).toBeInTheDocument();
    });

    it('パークがない場合はビルド情報が非表示', () => {
      const game = createTestGameState({ perks: [] });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.queryByText(/BUILD:/)).not.toBeInTheDocument();
    });
  });

  describe('共有ボタン', () => {
    it('COPY ボタンが表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('COPY')).toBeInTheDocument();
    });

    it('練習モードでは共有ボタンが非表示', () => {
      const game = createTestGameState({ practiceMode: true });
      render(<ResultScreen {...defaultProps} game={game} />);
      expect(screen.queryByText('COPY')).not.toBeInTheDocument();
    });

    it('「PRESS ANY BUTTON」が表示される', () => {
      render(<ResultScreen {...defaultProps} />);
      expect(screen.getByText('PRESS ANY BUTTON')).toBeInTheDocument();
    });
  });

  describe('game が null の場合', () => {
    it('空のレイヤーが表示される', () => {
      const { container } = render(<ResultScreen active={true} game={null} hasGold={false} />);
      expect(screen.queryByText('GAME OVER')).not.toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
