/**
 * PlayerPanel コンポーネントテスト
 * プレイヤーの表示パネル（スプライト、HP、ステータス、バフ、シナジー）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerPanel } from '../../../components/battle/PlayerPanel';
import type { PopupEntry } from '../../../components/battle/use-battle-popups';
import { RunStateBuilder } from '../../helpers/run-state-builder';

// Canvas のモック
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  globalAlpha: 1,
  setTransform: jest.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('PlayerPanel', () => {
  const baseRun = RunStateBuilder.create()
    .withPlayer({ hp: 80, mhp: 100, atk: 10, def: 5, cr: 10, burn: 0, aM: 1, dm: 1 })
    .withBattle({ bE: 50 })
    .withSkills({ sk: { avl: [], cds: {}, bfs: [] }, al: [], mxA: 3, skillUseCount: 0 })
    .build();

  const defaultProps = {
    run: baseRun,
    popups: [] as PopupEntry[],
  };

  it('プレイヤーのHP バーが表示される', () => {
    // Arrange & Act
    render(<PlayerPanel {...defaultProps} />);

    // Assert: 「部族長」のラベルが表示される
    expect(screen.getByText(/部族長/)).toBeInTheDocument();
  });

  it('ATK/DEF が表示される', () => {
    // Arrange & Act
    render(<PlayerPanel {...defaultProps} />);

    // Assert
    expect(screen.getByText(/ATK/)).toBeInTheDocument();
    expect(screen.getByText(/DEF/)).toBeInTheDocument();
  });

  it('バフがある場合に残りターン数が表示される', () => {
    // Arrange
    const runWithBuff = RunStateBuilder.create()
      .withPlayer({ hp: 80, mhp: 100, atk: 10, def: 5, cr: 10, burn: 0, aM: 1, dm: 1 })
      .withBattle({ bE: 50 })
      .withSkills({
        sk: { avl: [], cds: {}, bfs: [{ sid: 'fB', rT: 3, fx: { t: 'buffAtk', aM: 1.5, hC: 0, dur: 3 } }] },
        al: [],
        mxA: 3,
        skillUseCount: 0,
      })
      .build();

    // Act
    render(<PlayerPanel {...defaultProps} run={runWithBuff} />);

    // Assert
    expect(screen.getByText(/3T/)).toBeInTheDocument();
  });
});
