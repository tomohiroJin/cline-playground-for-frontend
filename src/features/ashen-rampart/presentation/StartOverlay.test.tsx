/**
 * 開始前オーバーレイのテスト
 *
 * 「何の説明もカウントダウンもなしだと焦る」への対応。
 * 目的・操作・第1ウェーブの予告を静止状態で示す。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartOverlay } from './StartOverlay';
import { HEADER_CLEARANCE } from './layout-constants';

describe('StartOverlay', () => {
  it('画面上端にフローティングホームボタンぶんの余白がある', () => {
    render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
    // フローティングホームボタン（App.tsx, position: fixed）は常に画面左上に
    // 重なるため、共通側を変更せずこちら側で余白を確保して吸収する
    expect(screen.getByTestId('ashen-rampart-start-overlay')).toHaveAttribute(
      'data-header-clearance',
      HEADER_CLEARANCE
    );
  });

  it('目的が示される', () => {
    render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
    expect(screen.getByText(/砦を守/)).toBeInTheDocument();
  });

  it('操作が示される（カード配置・燠火・能力表示・一時停止）', () => {
    render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
    expect(screen.getByText(/カードを選/)).toBeInTheDocument();
    expect(screen.getByText(/燠火/)).toBeInTheDocument();
    expect(screen.getByText(/カード未選択時/)).toBeInTheDocument();
    expect(screen.getByText(/スペース/)).toBeInTheDocument();
  });

  it('第1ウェーブの予告が示される', () => {
    render(<StartOverlay preview="雑兵8 俊足5" onStart={jest.fn()} />);
    expect(screen.getByText(/雑兵8 俊足5/)).toBeInTheDocument();
  });

  it('開始ボタンで onStart が呼ばれる', () => {
    const onStart = jest.fn();
    render(<StartOverlay preview="雑兵8" onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  describe('反復5 で追加した操作の案内', () => {
    it('手札を捨てられることが操作説明に書いてある', () => {
      render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
      expect(screen.getByText(/捨て/)).toBeInTheDocument();
    });

    it('手札があふれるとライフを失うことが書いてある', () => {
      render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
      expect(screen.getByText(/あふれ/)).toBeInTheDocument();
    });

    it('経路の脇に置いた守り手も壊れることが書いてある', () => {
      render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
      // 「守り手」だけで探すと他の行にも当たりうる。この案内に固有の語で掴む
      expect(screen.getByText(/経路の脇/)).toBeInTheDocument();
    });
  });
});
