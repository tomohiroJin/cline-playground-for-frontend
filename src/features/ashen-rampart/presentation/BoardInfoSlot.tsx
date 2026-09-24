/**
 * 灰燼の城壁 - 盤面の下の拒否理由と能力表示（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは拒否理由と能力表示が出入りするたびに、その下の凡例と手札が上下した。
 * ここは空でも同じ高さを占める枠にし、能力表示が閉じているときは
 * 能力表示の導線を出す（段階1 の試遊で能力表示は一度も開かれなかった。§3.8）。
 */
import React from 'react';
import styled from 'styled-components';
import type { PlateModel } from './board-plates';
import { InspectPanel } from './InspectPanel';
import { COLORS } from './theme';
import {
  BOARD_INFO_GAP_PX,
  BOARD_INFO_LINE_PX,
  BOARD_INFO_SLOT_HEIGHT_PX,
  INSPECT_ROW_HEIGHT_PX,
} from './layout-constants';

/**
 * 拒否理由の色トーン（StageView から移設）
 *
 * 拒否は「不便」であって砦が削られる「本当の危険」ではないため、赤は使わない。
 * この定数から色と data-tone 属性の両方を導出する（片方だけ変えられないように）。
 */
export const REJECTION_NOTICE_TONE = 'opportunity' as const;

/** 能力表示が閉じているときの導線 */
export const INSPECT_HINT_TEXT = '置いた札をタップすると能力を表示';

const Slot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${BOARD_INFO_GAP_PX}px;
  height: ${BOARD_INFO_SLOT_HEIGHT_PX}px;
  margin-top: 4px;
  overflow: hidden;
`;

const RejectionLine = styled.p`
  margin: 0;
  height: ${BOARD_INFO_LINE_PX}px;
  line-height: ${BOARD_INFO_LINE_PX}px;
  color: ${COLORS[REJECTION_NOTICE_TONE]};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Hint = styled.p`
  margin: 0;
  height: ${INSPECT_ROW_HEIGHT_PX}px;
  line-height: ${INSPECT_ROW_HEIGHT_PX}px;
  padding: 0 8px;
  font-size: 11px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  rejectionNotice?: string;
  inspectedPlate?: PlateModel;
}

export const BoardInfoSlot: React.FC<Props> = ({ rejectionNotice, inspectedPlate }) => (
  <Slot data-testid="board-info-slot">
    <RejectionLine data-testid="rejection-line" data-tone={REJECTION_NOTICE_TONE}>
      {rejectionNotice ?? ''}
    </RejectionLine>
    {inspectedPlate ? (
      <InspectPanel plate={inspectedPlate} />
    ) : (
      <Hint data-testid="inspect-hint">{INSPECT_HINT_TEXT}</Hint>
    )}
  </Slot>
);
