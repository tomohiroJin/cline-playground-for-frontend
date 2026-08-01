/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 判定7項目に1対1で対応させる。**判定に使わない数値は出さない**。
 * 支援塔を入れなかったランでは該当行を出さない（情報量の抑制）。
 */
import React from 'react';
import styled from 'styled-components';
import type { RunSummaryView } from './run-summary';
import { COLORS } from './theme';

const List = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 8px 0 0;
  color: ${COLORS.secondary};
  text-align: left;
`;

const Term = styled.dt`
  color: ${COLORS.secondary};
  opacity: 0.75;
`;

const Detail = styled.dd`
  margin: 0;
`;

/**
 * 篝火・鍛冶場の貢献行専用。ラベルと値を同じ要素の直接の子テキストにまとめる。
 * dt/dd を分けると Testing Library の getByText は要素をまたいだテキストを
 * 拾えず（各要素の直接の子テキストノードだけを見る仕様）、「ラベルと値が
 * 同じ行にある」ことをテストで検証できなくなるため、1つの dd に集約する。
 */
const FullRow = styled.dd`
  grid-column: 1 / -1;
  margin: 0;
  opacity: 0.9;
`;

/** tick を秒へ（1 tick = 100ms） */
const toSeconds = (ticks: number): string => (ticks / 10).toFixed(1);

interface Props {
  view: RunSummaryView;
}

export const RunSummary: React.FC<Props> = ({ view }) => (
  <List>
    <Term>撃破の内訳</Term>
    <Detail>
      {view.defeats.length === 0
        ? '撃破なし'
        : view.defeats.map((d) => `${d.name} ${d.count}体`).join(' / ')}
    </Detail>

    {view.beaconBonusDamage > 0 && (
      <FullRow>篝火の貢献: 与ダメージ +{view.beaconBonusDamage}</FullRow>
    )}

    {view.forgeExtendedShots > 0 && (
      <FullRow>鍛冶場の貢献: 射程延長で {view.forgeExtendedShots} 射</FullRow>
    )}

    <Term>通らなかった操作</Term>
    <Detail>
      {view.rejectionTotal}回
      {view.rejectionDetail.length > 0 &&
        `（${view.rejectionDetail.map((r) => `${r.label}${r.count}`).join('・')}）`}
    </Detail>

    <Term>徴発</Term>
    <Detail>
      {view.levyPlayed}回使用 / 選択成立 {view.levyResolved}回
    </Detail>

    <Term>マナ基盤</Term>
    <Detail>
      {view.firstReactorTick === undefined
        ? '魔力炉を置けなかった'
        : `初号機 ${toSeconds(view.firstReactorTick)}秒`}
      {' / '}マナ待ち {toSeconds(view.manaStarvedTicks)}秒
    </Detail>

    <Term>置くときに選べたマス</Term>
    <Detail>
      平均 {view.placeableAverage.toFixed(1)} / 最小 {view.placeableMin}
    </Detail>

    <Term>使わなかった札</Term>
    <Detail>
      {view.unusedCardNames.length === 0 ? 'なし' : view.unusedCardNames.join('・')}
    </Detail>
  </List>
);
