/**
 * ラン状態バーのテスト
 *
 * ライフ・ウェーブ・予告・一時停止・シードを上部に固定する（設計書 §9.1・§4）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunStatusBar } from './RunStatusBar';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';
import { createDeck } from '../domain/cards/deck';

const state = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

describe('RunStatusBar', () => {
  it('ライフが数値で示される', () => {
    render(
      <RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={1} />
    );
    expect(screen.getByText('残り 12')).toBeInTheDocument();
  });

  it('ライフが3以下になると警告テキストが加わる（色だけに依存しない）', () => {
    render(
      <RunStatusBar
        state={{ ...state, life: 2 }}
        isPaused={false}
        onTogglePause={jest.fn()}
        runSeed={1}
      />
    );
    expect(screen.getByText('残り 2')).toBeInTheDocument();
    expect(screen.getByText('危険')).toBeInTheDocument();
  });

  it('次ウェーブの構成が予告される', () => {
    // Task 9 の再較正（PLAINS_WAVES 総HP 728・総体数 51、LIFE_INITIAL 10→12）により、
    // tick:100 時点の次ウェーブ（startTick:250）は 雑兵3 俊足2 が正しい現物値。
    render(
      <RunStatusBar
        state={{ ...state, tick: 100 }}
        isPaused={false}
        onTogglePause={jest.fn()}
        runSeed={1}
      />
    );
    expect(screen.getByText(/次: 雑兵3 俊足2/)).toBeInTheDocument();
  });

  it('一時停止ボタンで onTogglePause が呼ばれる', () => {
    const onTogglePause = jest.fn();
    render(
      <RunStatusBar
        state={state}
        isPaused={false}
        onTogglePause={onTogglePause}
        runSeed={1}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '一時停止' }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('一時停止中はラベルが変わる', () => {
    render(<RunStatusBar state={state} isPaused onTogglePause={jest.fn()} runSeed={1} />);
    expect(screen.getByRole('button', { name: '再開' })).toBeInTheDocument();
  });

  it('現在のシードが常時表示され、選択してコピーできる形（readOnly input）である（設計書§4）', () => {
    render(
      <RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={4242} />
    );
    const seedField = screen.getByLabelText('シード') as HTMLInputElement;
    expect(seedField.value).toBe('4242');
    expect(seedField.readOnly).toBe(true);
  });

  it('漏れの最中はライフが危険色になる', () => {
    const { container } = render(
      <RunStatusBar
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        isPaused={false}
        onTogglePause={() => undefined}
        runSeed={1}
        isLeaking
      />
    );
    expect(container.querySelector('[data-leaking="true"]')).not.toBeNull();
  });

  it('シードが変わると表示も更新される', () => {
    const { rerender } = render(
      <RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={1} />
    );
    expect((screen.getByLabelText('シード') as HTMLInputElement).value).toBe('1');
    rerender(
      <RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} runSeed={999} />
    );
    expect((screen.getByLabelText('シード') as HTMLInputElement).value).toBe('999');
  });
});
