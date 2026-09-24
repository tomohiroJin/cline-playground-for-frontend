/**
 * 敵凡例のテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyLegend } from './EnemyLegend';
import { ENEMY_IDS, getEnemySpec } from '../domain/combat/enemies';

describe('EnemyLegend', () => {
  it('敵7種すべてが名前付きで並ぶ', () => {
    render(<EnemyLegend />);
    ['雑兵', '俊足', '群れ', '重装', '盾衛', '癒し手'].forEach((name) => {
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
    // 重装と盾衛は attackRange 1.5。凡例に数値が出る
    expect(screen.getAllByText(/射程 1\.5/)).toHaveLength(2);
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

describe('敵の能力の表示（反復7 段階2・判定項目9(a) の自己紹介）', () => {
  it('盾衛には装甲の値、癒し手には回復量・間隔・範囲を出す', () => {
    render(<EnemyLegend />);

    expect(screen.getByText('装甲4')).toBeInTheDocument();
    expect(screen.getByText('回復3（4秒ごと・周囲1.5）')).toBeInTheDocument();
  });

  it('装甲と回復が何をするかを1文ずつ説明する', () => {
    render(<EnemyLegend />);

    expect(screen.getByText(/装甲: 1撃ごとに/)).toBeInTheDocument();
    expect(screen.getByText(/回復: 一定の間隔で/)).toBeInTheDocument();
  });

  it('能力を持たない敵には能力の表記を出さない', () => {
    render(<EnemyLegend />);

    expect(screen.getAllByText(/^装甲\d/)).toHaveLength(1);
    expect(screen.getAllByText(/^回復\d/)).toHaveLength(1);
  });
});
