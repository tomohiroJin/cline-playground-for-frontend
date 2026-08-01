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
});
