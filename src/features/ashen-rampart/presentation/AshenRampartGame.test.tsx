import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AshenRampartGame } from './AshenRampartGame';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

describe('AshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('準備フェーズのUI（手札・ウェーブ開始ボタン・ステータス）が表示される', () => {
    render(<AshenRampartGame seed={42} />);
    expect(screen.getByText('灰燼の城壁')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ウェーブ開始' })).toBeInTheDocument();
    expect(screen.getAllByTestId('hand-card')).toHaveLength(5);
    expect(screen.getByTestId('status-life')).toHaveTextContent('10');
  });

  it('ウェーブ開始で戦闘フェーズになり、完走後に次フェーズへ進む', () => {
    render(<AshenRampartGame seed={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'ウェーブ開始' }));
    expect(screen.getByText(/戦闘中/)).toBeInTheDocument();
    act(() => {
      // 十分な時間を進めてリプレイを完走させる（安全弁 MAX_TICKS ぶん）
      jest.advanceTimersByTime(2100 * TICK_INTERVAL_MS);
    });
    // タワーなし全漏れ → ライフは残るので報酬フェーズ
    expect(screen.getByText('報酬を選択')).toBeInTheDocument();
    expect(screen.getAllByTestId('reward-card')).toHaveLength(3);
  });

  it('報酬をスキップして次の準備フェーズへ戻れる', () => {
    render(<AshenRampartGame seed={42} />);
    fireEvent.click(screen.getByRole('button', { name: 'ウェーブ開始' }));
    act(() => {
      jest.advanceTimersByTime(2100 * TICK_INTERVAL_MS);
    });
    fireEvent.click(screen.getByRole('button', { name: 'スキップ' }));
    expect(screen.getByRole('button', { name: 'ウェーブ開始' })).toBeInTheDocument();
  });
});
