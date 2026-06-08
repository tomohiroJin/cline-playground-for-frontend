// BranchSelectScreen のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { getStage } from '../../domain/race/stage-catalog';
import { BranchSelectScreen } from './BranchSelectScreen';

describe('BranchSelectScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('分岐ステージ 3 で A / B 両ルートが表示される', () => {
    const stage = getStage(3);
    render(<BranchSelectScreen stage={stage} onConfirm={jest.fn()} />);
    expect(screen.getByLabelText(/A ルート/)).toBeInTheDocument();
    expect(screen.getByLabelText(/B ルート/)).toBeInTheDocument();
  });

  it('CONFIRM クリックで onConfirm が呼ばれる（既定 a）', () => {
    const stage = getStage(3);
    const onConfirm = jest.fn();
    render(<BranchSelectScreen stage={stage} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('CONFIRM'));
    expect(onConfirm).toHaveBeenCalledWith('a', stage.branch!.a);
  });

  it('B ルートをクリックして CONFIRM で b が選ばれる', () => {
    const stage = getStage(3);
    const onConfirm = jest.fn();
    render(<BranchSelectScreen stage={stage} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText(/B ルート/));
    fireEvent.click(screen.getByText('CONFIRM'));
    expect(onConfirm).toHaveBeenCalledWith('b', stage.branch!.b);
  });

  it('B ルートのダブルクリックで即決定', () => {
    const stage = getStage(3);
    const onConfirm = jest.fn();
    render(<BranchSelectScreen stage={stage} onConfirm={onConfirm} />);
    fireEvent.doubleClick(screen.getByLabelText(/B ルート/));
    expect(onConfirm).toHaveBeenCalledWith('b', stage.branch!.b);
  });

  it('Esc で onCancel が呼ばれる', () => {
    const stage = getStage(3);
    const onCancel = jest.fn();
    render(<BranchSelectScreen stage={stage} onConfirm={jest.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('→ キーで b 選択、Enter で確定', () => {
    const stage = getStage(3);
    const onConfirm = jest.fn();
    render(<BranchSelectScreen stage={stage} onConfirm={onConfirm} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith('b', stage.branch!.b);
  });

  it('defaultChoice=b で初期選択が b', () => {
    const stage = getStage(3);
    const onConfirm = jest.fn();
    render(
      <BranchSelectScreen stage={stage} defaultChoice="b" onConfirm={onConfirm} />,
    );
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledWith('b', stage.branch!.b);
  });

  it('分岐なしステージでは null を返す', () => {
    const stage = getStage(1);
    const { container } = render(
      <BranchSelectScreen stage={stage} onConfirm={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
