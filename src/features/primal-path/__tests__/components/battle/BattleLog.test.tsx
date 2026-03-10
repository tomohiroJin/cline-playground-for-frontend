/**
 * BattleLog コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BattleLog } from '../../../components/battle/BattleLog';
import type { LogEntry } from '../../../types';

describe('BattleLog', () => {
  it('ログエントリが表示される', () => {
    // Arrange
    const log: LogEntry[] = [
      { x: 'プレイヤーの攻撃！ 10ダメージ', c: 'p' },
      { x: '敵の反撃！ 5ダメージ', c: 'e' },
    ];

    // Act
    render(<BattleLog log={log} />);

    // Assert
    expect(screen.getByText('プレイヤーの攻撃！ 10ダメージ')).toBeInTheDocument();
    expect(screen.getByText('敵の反撃！ 5ダメージ')).toBeInTheDocument();
  });

  it('最新40件のみ表示される', () => {
    // Arrange: 50件のログ
    const log: LogEntry[] = Array.from({ length: 50 }, (_, i) => ({
      x: `ログ${i}`,
      c: 'p',
    }));

    // Act
    render(<BattleLog log={log} />);

    // Assert: 最新40件 = ログ10〜ログ49
    expect(screen.queryByText('ログ9')).not.toBeInTheDocument();
    expect(screen.getByText('ログ10')).toBeInTheDocument();
    expect(screen.getByText('ログ49')).toBeInTheDocument();
  });

  it('空のログでも正常にレンダリングされる', () => {
    // Arrange & Act
    const { container } = render(<BattleLog log={[]} />);

    // Assert
    expect(container.firstChild).toBeTruthy();
  });
});
