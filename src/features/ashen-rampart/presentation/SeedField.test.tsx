import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SeedField, SEED_LABEL, USE_LAST_SEED_LABEL } from './SeedField';

const Harness: React.FC<{ lastSeed?: number }> = ({ lastSeed }) => {
  const [value, setValue] = useState('');
  return <SeedField value={value} onChange={setValue} lastSeed={lastSeed} />;
};

describe('SeedField', () => {
  it('前回のシードがあっても欄は空で始まり、前回の値を文字で添える（同一盤面の事故を防ぐ）', () => {
    render(<Harness lastSeed={321} />);

    expect((screen.getByLabelText(SEED_LABEL) as HTMLInputElement).value).toBe('');
    expect(screen.getByText('前回のシード: 321')).toBeInTheDocument();
  });

  it('「前回のシードを使う」を押したときだけ欄に入る', () => {
    render(<Harness lastSeed={321} />);

    fireEvent.click(screen.getByRole('button', { name: USE_LAST_SEED_LABEL }));

    expect((screen.getByLabelText(SEED_LABEL) as HTMLInputElement).value).toBe('321');
  });

  it('前回のシードが無ければ添え書きもボタンも出さない', () => {
    render(<Harness />);

    expect(screen.queryByText(/前回のシード/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: USE_LAST_SEED_LABEL })).not.toBeInTheDocument();
  });
});
