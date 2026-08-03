/**
 * 灰燼の城壁 - 戦況の読み上げ
 *
 * 流す基準は「頻度が低く、かつ取り返しがつかない」出来事のみ。
 * 撃破は総敵数52体・群れ22体が短時間で溶けるため流さない
 * （射撃と同じく読み上げが詰まり、かえって情報が失われる）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BattleAnnouncer } from './BattleAnnouncer';

describe('BattleAnnouncer', () => {
  it('aria-live 領域としてメッセージを出す', () => {
    render(<BattleAnnouncer message="1体が砦に到達" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('1体が砦に到達');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('メッセージが無いときは空のまま領域を保持する', () => {
    render(<BattleAnnouncer />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
