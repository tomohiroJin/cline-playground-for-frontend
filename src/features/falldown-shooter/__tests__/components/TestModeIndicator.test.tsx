// テストモードインジケーターのコンポーネントテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestModeIndicator } from '../../components/TestModeIndicator';

describe('TestModeIndicator', () => {
  it('テストモード有効時に「TEST」バッジが表示される', () => {
    render(<TestModeIndicator isTestMode={true} />);
    expect(screen.getByText('TEST')).toBeInTheDocument();
  });

  it('テストモード無効時は何も表示しない', () => {
    const { container } = render(<TestModeIndicator isTestMode={false} />);
    expect(container.firstChild).toBeNull();
  });
});
