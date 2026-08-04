/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 支援塔をデッキに入れなかったランでは行ごと出さない（情報量の抑制）。
 * 反復3 で判定7項目（設計書 §9.1）に表示項目を差し替えた。
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
  laneAllocation: [3, 2],
  blockerPositions: [{ laneIndex: 0, index: 3 }],
  unitsLost: {},
  placedOnPath: 1,
  placedOffPath: 1,
  onPathRatio: 0.5,
  ravenDefeatAverage: 0.25,
  ravenDefeatCount: 1,
  costHistogram: [0, 1, 0, 0, 0, 0],
  unusedCardIds: [],
  ...over,
});

describe('RunSummary', () => {
  it('守り手別の撃破数を出す', () => {
    render(<RunSummary view={view()} />);
    expect(screen.getByText(/弓兵/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
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

  it('鍛冶場の貢献が0のときはその行を出さない', () => {
    render(<RunSummary view={view({ forgeExtendedShots: 0 })} />);
    expect(screen.queryByText(/鍛冶場/)).not.toBeInTheDocument();
  });

  it('項目1: レーンへの配分を出す', () => {
    render(<RunSummary view={view({ laneAllocation: [3, 1] })} />);
    expect(screen.getByText(/北 3 \/ 南 1/)).toBeInTheDocument();
  });

  it('項目2: 前線を敷いた位置を出す', () => {
    render(
      <RunSummary
        view={view({ blockerPositions: [{ laneIndex: 0, index: 3 }, { laneIndex: 1, index: 2 }] })}
      />
    );
    expect(screen.getByText('北3・南2')).toBeInTheDocument();
  });

  it('項目3: 失った守り手が無ければ「なし」を出す', () => {
    // unusedCardIds 側にも「なし」が出うるため、他方を非空にして一意にする
    render(<RunSummary view={view({ unitsLost: {}, unusedCardIds: ['stone-wall'] })} />);
    expect(screen.getByText('なし')).toBeInTheDocument();
  });

  it('項目3: 失った守り手をカード名で出す', () => {
    render(<RunSummary view={view({ unitsLost: { 'stone-wall': 2 } })} />);
    expect(screen.getByText(/石壁 2体/)).toBeInTheDocument();
  });

  it('項目4: 経路上／経路外の配置数と比率を出す', () => {
    render(<RunSummary view={view({ placedOnPath: 3, placedOffPath: 1, onPathRatio: 0.75 })} />);
    expect(screen.getByText(/3 \/ 1（経路上 75%）/)).toBeInTheDocument();
  });

  it('項目5: 鴉を1体も倒していなければ「撃破なし」を出す', () => {
    render(<RunSummary view={view({ ravenDefeatCount: 0 })} />);
    expect(screen.getByText(/鴉を落とした位置/)).toBeInTheDocument();
    expect(screen.getByText('撃破なし')).toBeInTheDocument();
  });

  it('項目5: 鴉を落とした位置の平均進捗を割合で出す', () => {
    render(<RunSummary view={view({ ravenDefeatCount: 2, ravenDefeatAverage: 0.5 })} />);
    expect(screen.getByText(/平均 50%/)).toBeInTheDocument();
  });

  it('項目6: 使わなかった札が無ければ「なし」を出す', () => {
    // unitsLost 側にも「なし」が出うるため、他方を非空にして一意にする
    render(<RunSummary view={view({ unitsLost: { 'stone-wall': 1 }, unusedCardIds: [] })} />);
    expect(screen.getByText('なし')).toBeInTheDocument();
  });

  it('項目6: 使わなかった札をカード名で出す', () => {
    render(<RunSummary view={view({ unusedCardIds: ['stone-wall', 'forge'] })} />);
    expect(screen.getByText('石壁・鍛冶場')).toBeInTheDocument();
  });

  it('項目6: コスト帯の分布を出す', () => {
    render(<RunSummary view={view({ costHistogram: [1, 2, 0, 0, 0, 0] })} />);
    expect(screen.getByText('0:1 / 1:2 / 2:0 / 3:0 / 4:0 / 5:0')).toBeInTheDocument();
  });
});
