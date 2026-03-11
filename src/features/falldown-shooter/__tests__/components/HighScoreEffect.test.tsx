// ハイスコア更新演出コンポーネントのテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HighScoreEffect } from '../../components/HighScoreEffect';

describe('HighScoreEffect', () => {
  it('非表示時は何も表示しない', () => {
    const { container } = render(<HighScoreEffect show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('表示時に "NEW HIGH SCORE!" テキストが表示される', () => {
    render(<HighScoreEffect show={true} />);
    expect(screen.getByText('NEW HIGH SCORE!')).toBeInTheDocument();
  });
});
