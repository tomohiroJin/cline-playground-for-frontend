// ComboDisplay コンポーネントのテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComboDisplay } from '../../components/ComboDisplay';
import type { ComboState } from '../../types';

const createComboState = (overrides: Partial<ComboState> = {}): ComboState => ({
  count: 0,
  multiplier: 1.0,
  isActive: false,
  skillBonus: 0,
  displayText: '',
  ...overrides,
});

describe('ComboDisplay', () => {
  it('コンボ非アクティブ時は何も表示しない', () => {
    const { container } = render(
      <ComboDisplay comboState={createComboState()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('コンボ1ではテキストが空なので何も表示しない', () => {
    const { container } = render(
      <ComboDisplay comboState={createComboState({ count: 1, isActive: true, displayText: '' })} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('コンボ2以上で表示テキストが表示される', () => {
    render(
      <ComboDisplay comboState={createComboState({ count: 2, isActive: true, displayText: '2 COMBO!', multiplier: 1.5 })} />
    );
    expect(screen.getByText('2 COMBO!')).toBeInTheDocument();
  });

  it('コンボ倍率が表示される', () => {
    render(
      <ComboDisplay comboState={createComboState({ count: 3, isActive: true, displayText: '3 COMBO!!', multiplier: 2.0 })} />
    );
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('MAX COMBOが表示される', () => {
    render(
      <ComboDisplay comboState={createComboState({ count: 10, isActive: true, displayText: 'MAX COMBO!!!!!', multiplier: 5.0 })} />
    );
    expect(screen.getByText('MAX COMBO!!!!!')).toBeInTheDocument();
    expect(screen.getByText('x5')).toBeInTheDocument();
  });

  it('aria-live属性でスクリーンリーダーに通知する', () => {
    render(
      <ComboDisplay comboState={createComboState({ count: 2, isActive: true, displayText: '2 COMBO!', multiplier: 1.5 })} />
    );
    const element = screen.getByText('2 COMBO!').closest('[aria-live]');
    expect(element).toHaveAttribute('aria-live', 'polite');
  });
});
