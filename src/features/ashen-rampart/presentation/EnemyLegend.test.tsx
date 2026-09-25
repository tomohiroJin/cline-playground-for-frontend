/**
 * 敵凡例のテスト
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EnemyLegend, LEGEND_BUTTON_MIN_HEIGHT_PX } from './EnemyLegend';
import { ENEMY_IDS, getEnemySpec } from '../domain/combat/enemies';
import { appliedValueOf } from './applied-css';

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

describe('凡例から敵の能力表示を開く（反復7 段階2・§4.3 #4）', () => {
  it('7種すべてが「名前 の能力を見る」ボタンになり、押すとその敵の ID を渡す', () => {
    const onInspect = jest.fn();
    render(<EnemyLegend onInspect={onInspect} />);

    ENEMY_IDS.forEach((id) => {
      fireEvent.click(screen.getByRole('button', { name: `${getEnemySpec(id).name} の能力を見る` }));
    });

    expect(onInspect.mock.calls.map(([id]) => id)).toEqual([...ENEMY_IDS]);
  });

  it('開いている種類のボタンだけが押された状態になる', () => {
    render(<EnemyLegend inspectedEnemyId="mender" onInspect={jest.fn()} />);

    expect(screen.getByRole('button', { name: '癒し手 の能力を見る' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '盾衛 の能力を見る' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('onInspect を渡さなくても描画でき、押しても例外にならない（既存の呼び出しの互換）', () => {
    render(<EnemyLegend />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: '盾衛 の能力を見る' }))).not.toThrow();
  });

  it('ボタンの高さが WCAG 2.5.8 の最小 24px を満たす 32px になる（修正ラウンド1・Minor 3）', () => {
    render(<EnemyLegend />);

    const button = screen.getByRole('button', { name: '盾衛 の能力を見る' });
    expect(appliedValueOf(button, 'min-height')).toBe(`${LEGEND_BUTTON_MIN_HEIGHT_PX}px`);
  });
});

describe('射程の色調の説明（反復7 段階2・設計書 §4.3 #5）', () => {
  it('札を選ぶと射程の届く場所に斜線が出ることを説明する', () => {
    render(<EnemyLegend />);

    expect(screen.getByText(/札を選ぶと、射程の届く場所に斜線/)).toBeInTheDocument();
  });
});
