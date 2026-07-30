/**
 * カウントダウン表示のテスト
 *
 * 3 → 2 → 1 を各30tick。0 になったら何も表示しない。
 *
 * 境界値は `countdownLeftAt(tick) = max(0, COUNTDOWN_TICKS - tick)` と
 * `shown = ceil(left / 30)` から導出した（レビュー指摘: 切替直後の代表値だけでは
 * `Math.ceil` を `Math.floor + 1` に書き換えても検出できない。区間の幅を
 * 固定するため、切替直前の tick も個別にアサートする）。
 *
 * | tick | left = 90 - tick | shown = ceil(left/30) |
 * |---|---|---|
 * | 0  | 90 | 3 |
 * | 29 | 61 | ceil(61/30)=3（切替直前） |
 * | 30 | 60 | 2 |
 * | 59 | 31 | ceil(31/30)=2（切替直前） |
 * | 60 | 30 | 1 |
 * | 89 | 1  | ceil(1/30)=1（切替直前） |
 * | 90 | 0  | 非表示（開始済み） |
 * | 91 | 0（max(0, -1)） | 非表示（開始後も残らない） |
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CountdownDisplay } from './CountdownDisplay';
import { COUNTDOWN_TICKS } from '../domain/combat/combat-state';

describe('CountdownDisplay', () => {
  it.each([
    [0, '3'],
    [29, '3'],
    [30, '2'],
    [59, '2'],
    [60, '1'],
    [89, '1'],
  ])('tick=%i のとき「%s」を表示する', (tick, expected) => {
    render(<CountdownDisplay tick={tick} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([COUNTDOWN_TICKS, COUNTDOWN_TICKS + 1])(
    'tick=%i（開始済み）は何も表示しない',
    (tick) => {
      const { container } = render(<CountdownDisplay tick={tick} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it('カウントダウン中は「配置できる」ことを伝える', () => {
    render(<CountdownDisplay tick={0} />);
    expect(screen.getByText(/置けます/)).toBeInTheDocument();
  });
});
