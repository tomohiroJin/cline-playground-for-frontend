/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 支援塔をデッキに入れなかったランでは行ごと出さない（情報量の抑制）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RunSummary } from './RunSummary';
import type { RunSummaryView } from './run-summary';

const view = (over: Partial<RunSummaryView> = {}): RunSummaryView => ({
  defeats: [{ name: '弓兵', count: 12 }],
  beaconBonusDamage: 0,
  forgeExtendedShots: 0,
  rejectionTotal: 0,
  rejectionDetail: [],
  levyPlayed: 0,
  levyResolved: 0,
  placeableAverage: 11.2,
  placeableMin: 4,
  firstReactorTick: 210,
  manaStarvedTicks: 340,
  unusedCardNames: [],
  ...over,
});

describe('RunSummary', () => {
  it('塔別の撃破数を出す', () => {
    render(<RunSummary view={view()} />);
    expect(screen.getByText(/弓兵/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('選べたマスの平均と最小を出す', () => {
    render(<RunSummary view={view()} />);
    expect(screen.getByText(/平均 11.2/)).toBeInTheDocument();
    expect(screen.getByText(/最小 4/)).toBeInTheDocument();
  });

  it('篝火の貢献が0のときはその行を出さない', () => {
    render(<RunSummary view={view({ beaconBonusDamage: 0 })} />);
    expect(screen.queryByText(/篝火/)).not.toBeInTheDocument();
  });

  it('篝火の貢献があるときは与ダメージ増加分を出す', () => {
    // dt/dd を分けたまま検証するため data-testid で値セルを直接取得する（方法A）。
    // Testing Library の getByText は要素をまたいだテキストを拾えない
    // （各要素の直接の子テキストノードだけを見る仕様）ため、ラベル(dt)と値(dd)を
    // 1つの正規表現でまたいで検証することはできない。dl の構造（dt→dd の並び）を
    // 崩さずに済むこちらを選んだ。
    render(<RunSummary view={view({ beaconBonusDamage: 34 })} />);
    expect(screen.getByTestId('summary-beacon')).toHaveTextContent('与ダメージ +34');
  });
});
