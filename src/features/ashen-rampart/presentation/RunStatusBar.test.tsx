/**
 * ラン状態バーのテスト
 *
 * ライフ・ウェーブ・予告・一時停止を上部に固定する（設計書 §9.1）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunStatusBar } from './RunStatusBar';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const state = createCombatState({ drawPile: [], hand: [], graveyard: [] }, PLAINS_WAVES);

describe('RunStatusBar', () => {
  it('ライフが数値で示される', () => {
    render(<RunStatusBar state={state} isPaused={false} onTogglePause={jest.fn()} />);
    expect(screen.getByText('残り 12')).toBeInTheDocument();
  });

  it('ライフが3以下になると警告テキストが加わる（色だけに依存しない）', () => {
    render(
      <RunStatusBar state={{ ...state, life: 2 }} isPaused={false} onTogglePause={jest.fn()} />
    );
    expect(screen.getByText('残り 2')).toBeInTheDocument();
    expect(screen.getByText('危険')).toBeInTheDocument();
  });

  it('次ウェーブの構成が予告される', () => {
    // Task 9 の再較正（PLAINS_WAVES 総HP 964→668・総体数 52→37、LIFE_INITIAL 10→12）により、
    // tick:100 時点の次ウェーブ（startTick:250）は 雑兵3 俊足2 が正しい現物値。
    render(
      <RunStatusBar state={{ ...state, tick: 100 }} isPaused={false} onTogglePause={jest.fn()} />
    );
    expect(screen.getByText(/次: 雑兵3 俊足2/)).toBeInTheDocument();
  });

  it('一時停止ボタンで onTogglePause が呼ばれる', () => {
    const onTogglePause = jest.fn();
    render(<RunStatusBar state={state} isPaused={false} onTogglePause={onTogglePause} />);
    fireEvent.click(screen.getByRole('button', { name: '一時停止' }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('一時停止中はラベルが変わる', () => {
    render(<RunStatusBar state={state} isPaused onTogglePause={jest.fn()} />);
    expect(screen.getByRole('button', { name: '再開' })).toBeInTheDocument();
  });
});
