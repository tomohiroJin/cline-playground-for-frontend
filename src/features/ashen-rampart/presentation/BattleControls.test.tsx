/**
 * 戦闘コントロールのテスト
 *
 * 速度ボタンの押下・選択中表示・スキップ呼び出しを DOM レベルで検証する。
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを確認する（S1 の教訓）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BattleControls } from './BattleControls';

describe('BattleControls', () => {
  it('速度ボタン 1x/2x/4x とスキップが表示される', () => {
    render(<BattleControls speed={1} onChangeSpeed={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByRole('button', { name: '等速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2倍速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4倍速' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スキップ' })).toBeInTheDocument();
  });

  it('現在速度のボタンが aria-pressed=true になる', () => {
    render(<BattleControls speed={2} onChangeSpeed={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByRole('button', { name: '2倍速' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '等速' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('速度ボタン押下で onChangeSpeed が呼ばれる', () => {
    const onChangeSpeed = jest.fn();
    render(<BattleControls speed={1} onChangeSpeed={onChangeSpeed} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '4倍速' }));
    expect(onChangeSpeed).toHaveBeenCalledWith(4);
  });

  it('スキップ押下で onSkip が呼ばれる', () => {
    const onSkip = jest.fn();
    render(<BattleControls speed={1} onChangeSpeed={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: 'スキップ' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
