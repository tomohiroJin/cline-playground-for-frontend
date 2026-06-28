import { render, screen, fireEvent } from '@testing-library/react';
import { FinaleScreen } from '../presentation/components/screens/FinaleScreen';

const baseProps = (over = {}) => ({
  Particles: null, finaleStep: 0,
  onEscape: jest.fn(), onAdvance: jest.fn(), onDecide: jest.fn(),
  ...over,
});

describe('FinaleScreen', () => {
  it('finaleStep=0 は offer（さらに深く／脱出）を提示する', () => {
    const p = baseProps();
    render(<FinaleScreen {...p} />);
    fireEvent.click(screen.getByText(/さらに深く/));
    expect(p.onAdvance).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/脱出/));
    expect(p.onEscape).toHaveBeenCalled();
  });
  it('finaleStep=1 は最初のビート「集う残響」を描画し、前進で onAdvance', () => {
    const p = baseProps({ finaleStep: 1 });
    render(<FinaleScreen {...p} />);
    expect(screen.getByText('集う残響')).toBeInTheDocument();
    fireEvent.click(screen.getByText('記憶を受け止める'));
    expect(p.onAdvance).toHaveBeenCalled();
  });
  it('finaleStep=3 の最終ビートは decision を onDecide に渡す', () => {
    const p = baseProps({ finaleStep: 3 });
    render(<FinaleScreen {...p} />);
    fireEvent.click(screen.getByText('願いを継ぐ'));
    expect(p.onDecide).toHaveBeenCalledWith('inherit');
    fireEvent.click(screen.getByText('願いを断つ'));
    expect(p.onDecide).toHaveBeenCalledWith('sever');
  });
});
