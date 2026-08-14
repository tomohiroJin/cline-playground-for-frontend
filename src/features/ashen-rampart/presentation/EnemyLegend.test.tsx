/**
 * 敵凡例のテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyLegend } from './EnemyLegend';
import { ENEMY_IDS, getEnemySpec } from '../domain/combat/enemies';

describe('EnemyLegend', () => {
  it('敵5種すべてが名前付きで並ぶ', () => {
    render(<EnemyLegend />);
    ['雑兵', '俊足', '群れ', '重装'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('飛行する敵には対処法が添えられる', () => {
    render(<EnemyLegend />);
    expect(screen.getByText('鴉（飛行・弩砲のみ有効）')).toBeInTheDocument();
  });
});

describe('敵の射程の表示（反復5）', () => {
  it('射程を持つ敵には射程を出す', () => {
    render(<EnemyLegend />);
    // 重装は attackRange 1.5。凡例に数値が出る
    expect(screen.getByText(/射程 1\.5/)).toBeInTheDocument();
  });

  it('射程を持たない敵には射程を出さない', () => {
    render(<EnemyLegend />);
    // 射程0 の敵に「射程 0」と書くと、あたかも0マス届くように読める
    expect(screen.queryByText(/射程 0/)).not.toBeInTheDocument();
  });

  it('射程を持つ敵の数が、定義と一致する', () => {
    render(<EnemyLegend />);
    const expected = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).length;
    expect(screen.getAllByText(/射程 /)).toHaveLength(expected);
  });
});
