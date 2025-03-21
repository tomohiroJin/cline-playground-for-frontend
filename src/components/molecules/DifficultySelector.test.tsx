import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DifficultySelector from './DifficultySelector';

describe('DifficultySelector Component', () => {
  test('コンポーネントが正しくレンダリングされる', () => {
    render(<DifficultySelector value={4} onChange={jest.fn()} />);
    // ラベルの確認
    expect(screen.getByLabelText(/難易度を選択/i)).toBeInTheDocument();
    // オプション数の確認 (9種類の難易度)
    expect(screen.getAllByRole('option').length).toBe(9);
    // 初期表示される説明文があるか確認
    expect(screen.getByText(/4x4の標準的な難易度のパズルです。/i)).toBeInTheDocument();
  });

  test('選択が変更された際に onChange が呼ばれる', () => {
    const onChangeMock = jest.fn();
    render(<DifficultySelector value={4} onChange={onChangeMock} />);

    const select = screen.getByLabelText(/難易度を選択/i);
    fireEvent.change(select, { target: { value: '6' } });
    // onChange が正しい値で呼ばれていることの確認
    expect(onChangeMock).toHaveBeenCalledWith(6);
  });
});
