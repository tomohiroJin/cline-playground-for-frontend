/**
 * 手札エリアのテスト
 *
 * 配置クールダウンとドローは周期が異なる2本のタイマーだが、
 * 1本のトラックに統合して「次に何かできるのはいつか」を1箇所で読ませる（設計書 §9.2）。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HandArea } from './HandArea';
import { createCombatState } from '../domain/combat/combat-state';
import { PLAINS_WAVES } from '../domain/combat/waves';

const stateWith = (hand: string[], mana = 5) => ({
  ...createCombatState({ drawPile: ['a'], hand, graveyard: [] }, PLAINS_WAVES),
  mana,
});

describe('HandArea', () => {
  it('手札のカード名とコストが表示される', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={null} onSelect={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /コスト2/ })).toBeInTheDocument();
  });

  it('カードを押すと index が渡る', () => {
    const onSelect = jest.fn();
    render(
      <HandArea
        state={stateWith(['arrow-tower', 'ballista'])}
        selectedIndex={null}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /弩砲/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('選択中のカードは aria-pressed が true になる', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={0} onSelect={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('マナ不足のカードは押せず不足量が示される', () => {
    render(
      <HandArea state={stateWith(['ballista'], 1)} selectedIndex={null} onSelect={jest.fn()} />
    );
    const card = screen.getByRole('button', { name: /弩砲/ });
    expect(card).toBeDisabled();
    expect(screen.getByText('マナが2足りません')).toBeInTheDocument();
  });

  it('現在のマナと墓地の枚数が表示される', () => {
    const state = {
      ...stateWith(['arrow-tower'], 4),
      deck: { drawPile: ['a'], hand: ['arrow-tower'], graveyard: ['x', 'y'] },
    };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} />);
    expect(screen.getByText('マナ 4')).toBeInTheDocument();
    expect(screen.getByText('墓地 2')).toBeInTheDocument();
  });

  it('溢れて失った札が通知として表示される', () => {
    render(
      <HandArea
        state={stateWith(['arrow-tower'])}
        selectedIndex={null}
        onSelect={jest.fn()}
        overflowNotice="火砲台"
      />
    );
    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();
  });

  it('配置とドローの残りが両方読める', () => {
    const state = { ...stateWith(['arrow-tower']), placeCooldown: 30, ticksToDraw: 10 };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} />);
    expect(screen.getByLabelText('次に置けるまで 3秒')).toBeInTheDocument();
    expect(screen.getByLabelText('次のドローまで 1秒')).toBeInTheDocument();
  });
});
