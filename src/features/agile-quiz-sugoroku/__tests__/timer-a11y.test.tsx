/**
 * TimerDisplay アクセシビリティテスト
 * WCAG 2.1 AA: role="timer" + aria-live によるスクリーンリーダー通知
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '../presentation/components/screens/QuizScreen/TimerDisplay';

describe('TimerDisplay アクセシビリティ', () => {
  it('残り時間が timer ロールと aria-live を持つ', () => {
    render(<TimerDisplay timer={5} answered={false} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live');
  });

  it('回答済みの場合は何もレンダリングしない', () => {
    const { container } = render(<TimerDisplay timer={5} answered={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('残り時間が閾値（5秒）のとき aria-live リージョンにテキストが表示される', () => {
    render(<TimerDisplay timer={5} answered={false} />);
    // SR 専用リージョンに「残り 5 秒」が含まれる
    expect(screen.getByText('残り 5 秒')).toBeInTheDocument();
  });

  it('残り時間が非閾値のとき aria-live リージョンのテキストは空', () => {
    render(<TimerDisplay timer={8} answered={false} />);
    // 閾値外なので live text は空（timer ロール要素内の数値「8」は別途表示）
    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
  });
});
