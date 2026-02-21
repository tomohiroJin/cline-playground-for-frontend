import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TitleScreen from './TitleScreen';

describe('TitleScreen', () => {
  it('タイトルとはじめるボタンが表示される', () => {
    render(<TitleScreen onStart={jest.fn()} onDebugActivate={jest.fn()} />);

    expect(screen.getByText('ピクチャーパズル')).toBeInTheDocument();
    expect(screen.getByText('はじめる')).toBeInTheDocument();
  });

  it('はじめるボタンをクリックするとonStartが呼ばれる', () => {
    const onStart = jest.fn();
    render(<TitleScreen onStart={onStart} onDebugActivate={jest.fn()} />);

    fireEvent.click(screen.getByText('はじめる'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('"jin"と入力するとonDebugActivateが呼ばれる', () => {
    const onDebugActivate = jest.fn();
    render(<TitleScreen onStart={jest.fn()} onDebugActivate={onDebugActivate} />);

    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'i' });
    fireEvent.keyDown(window, { key: 'n' });

    expect(onDebugActivate).toHaveBeenCalledTimes(1);
  });

  it('無関係なキー入力ではonDebugActivateが呼ばれない', () => {
    const onDebugActivate = jest.fn();
    render(<TitleScreen onStart={jest.fn()} onDebugActivate={onDebugActivate} />);

    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'c' });

    expect(onDebugActivate).not.toHaveBeenCalled();
  });
});
