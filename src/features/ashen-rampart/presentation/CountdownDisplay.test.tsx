/**
 * カウントダウン表示のテスト
 *
 * 3 → 2 → 1 を各30tick。0 になったら何も表示しない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CountdownDisplay } from './CountdownDisplay';
import { COUNTDOWN_TICKS } from '../domain/combat/combat-state';

describe('CountdownDisplay', () => {
  it('開始直後は3を表示する', () => {
    render(<CountdownDisplay tick={0} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('30tick 経過で2を表示する', () => {
    render(<CountdownDisplay tick={30} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('60tick 経過で1を表示する', () => {
    render(<CountdownDisplay tick={60} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('カウントダウン後は何も表示しない', () => {
    const { container } = render(<CountdownDisplay tick={COUNTDOWN_TICKS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('カウントダウン中は「配置できる」ことを伝える', () => {
    render(<CountdownDisplay tick={0} />);
    expect(screen.getByText(/置けます/)).toBeInTheDocument();
  });
});
