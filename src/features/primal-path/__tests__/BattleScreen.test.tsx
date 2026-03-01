/**
 * 原始進化録 - PRIMAL PATH - バトル画面コンポーネントテスト（Phase 6-2）
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BattleScreen } from '../components/BattleScreen';
import type { RunState, Enemy, SfxType } from '../types';
import { makeRun } from './test-helpers';
import type { GameAction } from '../hooks';

/* ===== テスト用データ ===== */

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    n: 'マンモス',
    hp: 50,
    mhp: 50,
    atk: 5,
    def: 2,
    bone: 10,
    ...overrides,
  };
}

/* ===== テスト ===== */

describe('BattleScreen', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();
  const mockPlaySfx = jest.fn<void, [SfxType]>();

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPlaySfx.mockClear();
    // window.confirm のモック
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('基本レンダリング', () => {
    it('敵の名前が表示される', () => {
      // Arrange
      const run = makeRun({ en: makeEnemy() });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText(/マンモス/)).toBeInTheDocument();
    });

    it('プレイヤーHPが表示される', () => {
      // Arrange
      const run = makeRun({ en: makeEnemy(), hp: 60, mhp: 80 });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert: HpBar は "60/80 (75%)" の形式で表示
      expect(screen.getByText('60/80 (75%)')).toBeInTheDocument();
    });

    it('Canvas要素が存在する', () => {
      // Arrange
      const run = makeRun({ en: makeEnemy() });

      // Act
      const { container } = render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert: 敵スプライト用とプレイヤースプライト用の2つの Canvas
      const canvases = container.querySelectorAll('canvas');
      expect(canvases.length).toBeGreaterThanOrEqual(2);
    });

    it('バトルログ領域が存在する', () => {
      // Arrange
      const run = makeRun({ en: makeEnemy(),
        log: [{ x: 'テストログ', c: 'p' }],
      });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText('テストログ')).toBeInTheDocument();
    });

    it('降伏ボタンが表示される', () => {
      // Arrange
      const run = makeRun({ en: makeEnemy() });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText('降伏')).toBeInTheDocument();
    });
  });

  describe('スキルボタン', () => {
    it('文明レベル3以上でスキルボタンが表示される', () => {
      // Arrange: tech Lv3 にすると「炎の爆発」スキルが使用可能
      const run = makeRun({ en: makeEnemy(), cT: 3 });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText(/炎の爆発/)).toBeInTheDocument();
    });

    it('クールダウン中のスキルはCD表示される', () => {
      // Arrange: tech Lv3 + fB のクールダウンが2残り
      const run = makeRun({ en: makeEnemy(),
        cT: 3,
        sk: { avl: ['fB'], cds: { fB: 2 }, bfs: [] },
      });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert: "(2)" が CD 表示
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  describe('速度コントロール・一時停止', () => {
    it('一時停止でPAUSEDオーバーレイが表示される', () => {
      // Arrange: battleSpd=0 で一時停止
      const run = makeRun({ en: makeEnemy() });

      // Act
      render(
        <BattleScreen run={run} finalMode={false} battleSpd={0} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });
  });

  describe('run.en が null の場合', () => {
    it('run.en が null のとき null を返す', () => {
      // Arrange
      const run = makeRun({ en: null });

      // Act
      const { container } = render(
        <BattleScreen run={run} finalMode={false} battleSpd={750} dispatch={mockDispatch} playSfx={mockPlaySfx} />,
      );

      // Assert: 何もレンダリングされない
      expect(container.innerHTML).toBe('');
    });
  });
});
