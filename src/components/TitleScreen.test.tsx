import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TitleScreen from './TitleScreen';

describe('TitleScreen', () => {
  it('タイトルと入館するボタンが表示される', () => {
    render(
      <TitleScreen
        onStart={jest.fn()}
        onDebugActivate={jest.fn()}
        onOpenCollection={jest.fn()}
        onStartDaily={jest.fn()}
        onStartChallenge={jest.fn()}
      />
    );
    expect(screen.getByText('ピクチャーパズル')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '入館する' })).toBeInTheDocument();
  });

  it('入館するボタンをクリックするとonStartが呼ばれる', () => {
    const onStart = jest.fn();
    render(
      <TitleScreen
        onStart={onStart}
        onDebugActivate={jest.fn()}
        onOpenCollection={jest.fn()}
        onStartDaily={jest.fn()}
        onStartChallenge={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '入館する' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('"jin"と入力するとonDebugActivateが呼ばれる', () => {
    const onDebugActivate = jest.fn();
    render(
      <TitleScreen
        onStart={jest.fn()}
        onDebugActivate={onDebugActivate}
        onOpenCollection={jest.fn()}
        onStartDaily={jest.fn()}
        onStartChallenge={jest.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'i' });
    fireEvent.keyDown(window, { key: 'n' });

    expect(onDebugActivate).toHaveBeenCalledTimes(1);
  });

  it('無関係なキー入力ではonDebugActivateが呼ばれない', () => {
    const onDebugActivate = jest.fn();
    render(
      <TitleScreen
        onStart={jest.fn()}
        onDebugActivate={onDebugActivate}
        onOpenCollection={jest.fn()}
        onStartDaily={jest.fn()}
        onStartChallenge={jest.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'b' });
    fireEvent.keyDown(window, { key: 'c' });

    expect(onDebugActivate).not.toHaveBeenCalled();
  });

  it('「収蔵目録を見る」で onOpenCollection を呼ぶ', () => {
    const onOpenCollection = jest.fn();
    render(
      <TitleScreen
        onStart={() => {}}
        onDebugActivate={() => {}}
        onOpenCollection={onOpenCollection}
        onStartDaily={() => {}}
        onStartChallenge={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '収蔵目録を見る' }));
    expect(onOpenCollection).toHaveBeenCalledTimes(1);
  });

  it('「本日の一枚」で onStartDaily を呼ぶ', () => {
    const onStartDaily = jest.fn();
    render(
      <TitleScreen
        onStart={() => {}}
        onDebugActivate={() => {}}
        onOpenCollection={() => {}}
        onStartDaily={onStartDaily}
        onStartChallenge={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '本日の一枚' }));
    expect(onStartDaily).toHaveBeenCalledTimes(1);
  });

  it('「鑑定チャレンジ」で onStartChallenge を呼ぶ', () => {
    const onStartChallenge = jest.fn();
    render(
      <TitleScreen
        onStart={() => {}}
        onDebugActivate={() => {}}
        onOpenCollection={() => {}}
        onStartDaily={() => {}}
        onStartChallenge={onStartChallenge}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '鑑定チャレンジ' }));
    expect(onStartChallenge).toHaveBeenCalledTimes(1);
  });
});
