/**
 * 灰燼の城壁 - エフェクト層の描画
 *
 * 「情報が存在する」テストと「レンダリングされる」テストは別物である。
 * S1 では aria-label と descriptor 値だけを見ていたため、滞留セルで
 * 矢印が消えるバグを既存テスト7件が1件も検出できなかった。
 * ここでは要素の数を直接数える。
 */
import React from 'react';
import { render } from '@testing-library/react';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { BoardEffectLayer } from './BoardEffectLayer';
import type { Effect } from './combat-effects';
import { COLORS } from './theme';

const shot = (id: string): Effect => ({
  kind: 'shot',
  id,
  from: { x: 1, y: 2 },
  to: { x: 1, y: 3 },
  untilTick: 10,
  wide: false,
  dashed: false,
});

describe('BoardEffectLayer', () => {
  it('shot の数だけ line 要素を描く', () => {
    const { container } = render(
      <BoardEffectLayer effects={[shot('a'), shot('b')]} map={PLAINS_MAP} />
    );
    expect(container.querySelectorAll('line')).toHaveLength(2);
  });

  it('defeat は線と終端マークの両方を描く', () => {
    const effects: Effect[] = [
      { kind: 'defeat', id: 'd', from: { x: 1, y: 2 }, to: { x: 2, y: 3 }, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    expect(container.querySelectorAll('line').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-effect="defeat-mark"]')).not.toBeNull();
  });

  it('viewBox が盤面のセル座標系に一致する', () => {
    const { container } = render(<BoardEffectLayer effects={[]} map={PLAINS_MAP} />);
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 9 7');
  });

  it('エフェクトが無いときも SVG 自体は存在する', () => {
    const { container } = render(<BoardEffectLayer effects={[]} map={PLAINS_MAP} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('danger 色は脅威の実害（漏れ・守り手の消滅）にのみ使い、罠には使わない', () => {
    // 反復3 で danger の用途は「漏れ専用」から「脅威の実害」へ一般化した。
    // 罠はプレイヤーの資産のままなので secondary から変わらないことを確認する。
    const effects: Effect[] = [
      { kind: 'trap', id: 't', at: { x: 0, y: 3 }, untilTick: 10 },
      { kind: 'leak', id: 'l', at: { x: 8, y: 1 }, untilTick: 10 },
      { kind: 'unit-lost', id: 'ul', pos: { x: 4, y: 4 }, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    const trap = container.querySelector('[data-effect="trap"]');
    const leak = container.querySelector('[data-effect="leak"]');
    const unitLostLine = container.querySelector('[data-effect="unit-lost"] line');
    expect(trap?.getAttribute('stroke')).toBe(COLORS.secondary);
    expect(leak?.getAttribute('fill')).toBe(COLORS.danger);
    expect(unitLostLine?.getAttribute('stroke')).toBe(COLORS.danger);
  });

  it('unit-damaged のエフェクトが本数ぶん描画される', () => {
    const effects: Effect[] = [
      { kind: 'unit-damaged', id: 'ud', pos: { x: 3, y: 2 }, untilTick: 5 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    expect(container.querySelectorAll('[data-effect="unit-damaged"]')).toHaveLength(1);
  });

  it('unit-lost のエフェクトが本数ぶん描画される（✕ は line 2本で構成される）', () => {
    const effects: Effect[] = [
      { kind: 'unit-lost', id: 'ul1', pos: { x: 3, y: 2 }, untilTick: 10 },
      { kind: 'unit-lost', id: 'ul2', pos: { x: 5, y: 4 }, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    expect(container.querySelectorAll('[data-effect="unit-lost"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-effect="unit-lost"] line')).toHaveLength(4);
  });

  it('unit-damaged は矩形、unit-lost は✕（g要素）で形が違う（色だけに依存しない）', () => {
    const effects: Effect[] = [
      { kind: 'unit-damaged', id: 'ud', pos: { x: 1, y: 1 }, untilTick: 10 },
      { kind: 'unit-lost', id: 'ul', pos: { x: 2, y: 2 }, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    expect(container.querySelector('[data-effect="unit-damaged"]')?.tagName).toBe('rect');
    expect(container.querySelector('[data-effect="unit-lost"]')?.tagName).toBe('g');
  });
});
