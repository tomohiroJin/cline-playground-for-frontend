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
  defeats: [{ name: '弓兵の塔', count: 12 }],
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
    expect(screen.getByText(/弓兵の塔/)).toBeInTheDocument();
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
    render(<RunSummary view={view({ beaconBonusDamage: 34 })} />);
    expect(screen.getByText(/篝火.*34/)).toBeInTheDocument();
  });
});
