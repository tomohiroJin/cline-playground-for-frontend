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
import { createDeck } from '../domain/cards/deck';

const stateWith = (hand: string[], mana = 5) => ({
  ...createCombatState({ drawPile: ['a'], hand, graveyard: [] }, PLAINS_WAVES),
  mana,
});

describe('HandArea', () => {
  it('手札のカード名とコストが表示される', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={null} onSelect={jest.fn()} onDiscard={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔 コスト/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /コスト2/ })).toBeInTheDocument();
  });

  it('カードを押すと index が渡る', () => {
    const onSelect = jest.fn();
    render(
      <HandArea
        state={stateWith(['arrow-tower', 'ballista'])}
        selectedIndex={null}
        onSelect={onSelect}
        onDiscard={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /弩砲 コスト/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('選択中のカードは aria-pressed が true になる', () => {
    render(
      <HandArea state={stateWith(['arrow-tower'])} selectedIndex={0} onSelect={jest.fn()} onDiscard={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /弓兵の塔 コスト/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('マナ不足のカードは押せず不足量が示される', () => {
    render(
      <HandArea state={stateWith(['ballista'], 1)} selectedIndex={null} onSelect={jest.fn()} onDiscard={jest.fn()} />
    );
    const card = screen.getByRole('button', { name: /弩砲 コスト/ });
    expect(card).toBeDisabled();
    expect(screen.getByText('マナが2足りません')).toBeInTheDocument();
  });

  it('現在のマナと墓地の枚数が表示される', () => {
    const state = {
      ...stateWith(['arrow-tower'], 4),
      deck: { drawPile: ['a'], hand: ['arrow-tower'], graveyard: ['x', 'y'] },
    };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} onDiscard={jest.fn()} />);
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
        onDiscard={jest.fn()}
      />
    );
    expect(screen.getByText('火砲台 を手札に持てず失いました')).toBeInTheDocument();
  });

  it('配置とドローの残りが両方読める', () => {
    const state = { ...stateWith(['arrow-tower']), placeCooldown: 30, ticksToDraw: 10 };
    render(<HandArea state={state} selectedIndex={null} onSelect={jest.fn()} onDiscard={jest.fn()} />);
    expect(screen.getByLabelText('次に置けるまで 3秒')).toBeInTheDocument();
    expect(screen.getByLabelText('次のドローまで 1秒')).toBeInTheDocument();
  });

  it('マナが足りない札でも捨てられる', () => {
    const onDiscard = jest.fn();
    const state = {
      ...createCombatState(createDeck(['ballista', 'reactor', 'reactor', 'reactor'], () => 0), PLAINS_WAVES),
      mana: 0,
    };
    render(
      <HandArea
        state={state}
        selectedIndex={null}
        onSelect={() => undefined}
        onDiscard={onDiscard}
      />
    );

    // 捨札ボタンは Card ボタンとは別要素にする。
    // Card は disabled={!affordable} のため、内包すると押せなくなる
    const discardButtons = screen.getAllByRole('button', { name: /を捨てる$/ });
    fireEvent.click(discardButtons[0]);
    expect(onDiscard).toHaveBeenCalledWith(0);
  });
});
