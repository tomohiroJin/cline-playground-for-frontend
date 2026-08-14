/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 判定7項目（設計書 §9.1）に1対1で対応させる。**判定に使わない数値は出さない**。
 * 支援2種（篝火・鍛冶場）の貢献と守り手別の撃破は反復2 から引き継ぐ。
 * 支援塔をデッキに入れなかったランでは行ごと出さない（情報量の抑制）。
 * ライフの内訳（漏れ／溢れ）は反復5 でライフが2つの理由で減るようになったため追加した
 * （設計書 §5.4。反証条件「ライフが何で減ったか分からない」への対応）。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
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

/** レーン index → 表示名。平原マップは北・南の2レーン固定（設計書 §5.2） */
const LANE_LABELS = ['北', '南'] as const;
const laneLabel = (laneIndex: number): string => LANE_LABELS[laneIndex] ?? `レーン${laneIndex + 1}`;

const nameOf = (cardId: string): string => getCardDefinition(cardId).name;

/** 項目2: 前線を敷いた位置を「北3・南2」のように列挙する */
const formatBlockerPositions = (positions: RunSummaryView['blockerPositions']): string =>
  positions.length === 0
    ? 'なし'
    : positions.map((p) => `${laneLabel(p.laneIndex)}${p.index}`).join('・');

/** 項目3: 失った守り手をカード名ごとに列挙する */
const formatUnitsLost = (unitsLost: RunSummaryView['unitsLost']): string => {
  const entries = Object.entries(unitsLost);
  return entries.length === 0
    ? 'なし'
    : entries.map(([id, count]) => `${nameOf(id)} ${count}体`).join(' / ');
};

/** 項目6: コスト帯（index = コスト）の分布を「0:2 / 1:5 / …」のように出す */
const formatCostHistogram = (histogram: RunSummaryView['costHistogram']): string =>
  histogram.map((count, cost) => `${cost}:${count}`).join(' / ');

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
      <>
        <Term>篝火の貢献</Term>
        <Detail data-testid="summary-beacon">与ダメージ +{view.beaconBonusDamage}</Detail>
      </>
    )}

    {view.forgeExtendedShots > 0 && (
      <>
        <Term>鍛冶場の貢献</Term>
        <Detail data-testid="summary-forge">射程延長で {view.forgeExtendedShots} 射</Detail>
      </>
    )}

    <Term>ライフの内訳</Term>
    <Detail>
      砦への到達 {view.lifeLostToLeak} / 手札のあふれ {view.lifeLostToOverflow}
    </Detail>

    <Term>通らなかった操作</Term>
    <Detail>
      {view.rejectionTotal}回
      {view.rejectionDetail.length > 0 &&
        `（${view.rejectionDetail.map((r) => `${r.label}${r.count}`).join('・')}）`}
    </Detail>

    <Term>レーンへの配分</Term>
    <Detail>
      北 {view.laneAllocation[0] ?? 0} / 南 {view.laneAllocation[1] ?? 0}
    </Detail>

    <Term>前線を敷いた位置</Term>
    <Detail>{formatBlockerPositions(view.blockerPositions)}</Detail>

    <Term>失った守り手</Term>
    <Detail>{formatUnitsLost(view.unitsLost)}</Detail>

    <Term>経路上／経路外</Term>
    <Detail>
      {view.placedOnPath} / {view.placedOffPath}（経路上 {Math.round(view.onPathRatio * 100)}%）
    </Detail>

    <Term>鴉を落とした位置</Term>
    <Detail>
      {view.ravenDefeatCount === 0
        ? '撃破なし'
        : `平均 ${Math.round(view.ravenDefeatAverage * 100)}%（0% = 入口、100% = 砦）`}
    </Detail>

    <Term>使わなかった札</Term>
    <Detail>
      {view.unusedCardIds.length === 0 ? 'なし' : view.unusedCardIds.map(nameOf).join('・')}
    </Detail>

    <Term>コスト帯の分布</Term>
    <Detail>{formatCostHistogram(view.costHistogram)}</Detail>
  </List>
);
