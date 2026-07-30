/**
 * 徴発の選択 UI のテスト
 *
 * 選択中もゲームは止まらないため、盤面を覆い隠さない位置に出す。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevyChoice } from './LevyChoice';

describe('LevyChoice', () => {
  it('候補が名前とコスト付きで並ぶ', () => {
    render(<LevyChoice options={['arrow-tower', 'ballista']} onChoose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /弓兵の塔 コスト2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /弩砲 コスト3/ })).toBeInTheDocument();
  });

  it('選ぶと index が渡る', () => {
    const onChoose = jest.fn();
    render(<LevyChoice options={['arrow-tower', 'ballista']} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /弩砲 コスト3/ }));
    expect(onChoose).toHaveBeenCalledWith(1);
  });

  it('候補が空なら何も表示しない', () => {
    const { container } = render(<LevyChoice options={[]} onChoose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('選択中も時間が進むことを伝える', () => {
    render(<LevyChoice options={['arrow-tower']} onChoose={jest.fn()} />);
    expect(screen.getByText(/進み/)).toBeInTheDocument();
  });
});
