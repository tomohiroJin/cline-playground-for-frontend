/**
 * 灰燼の城壁 - 手札の上の通知の枠（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは溢れ通知・マナ不足・溢れそうの警告が出るたびに行が増え、
 * 手札を押し下げていた。通知は2行固定の枠に出し、空でも同じ高さを占める。
 * 3つ同時に出たときは、取り返しのつかない順（失った > 溢れそう > マナ不足）の
 * 上位2つだけを出す。
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';
import { HAND_NOTICE_LINE_PX, HAND_NOTICE_MAX_LINES } from './layout-constants';

/** 360px 幅でも1行に収まる長さにした（段階1 の文言は折り返していた） */
export const OVERFLOW_WARNING_TEXT = '手札がいっぱい。次のドローであふれてライフ-1';

const Slot = styled.div`
  height: ${HAND_NOTICE_LINE_PX * HAND_NOTICE_MAX_LINES}px;
  overflow: hidden;
  line-height: ${HAND_NOTICE_LINE_PX}px;
`;

const Line = styled.p<{ $color: string }>`
  margin: 0;
  color: ${({ $color }) => $color};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  /** 溢れて失った札の名前 */
  overflowNotice?: string;
  /** このままだと次のドローで溢れるか */
  willOverflow: boolean;
  /** 手札の札のうち最大のマナ不足量（0 なら不足なし） */
  maxShortage: number;
}

interface Notice {
  key: string;
  text: string;
  color: string;
}

/** 出す通知を優先順に並べる */
const noticesOf = ({ overflowNotice, willOverflow, maxShortage }: Props): Notice[] => [
  // 溢れは「不便」であって砦が削られる危険そのものではないため opportunity（段階1 と同じ）
  ...(overflowNotice
    ? [{ key: 'lost', text: `${overflowNotice} を手札に持てず失いました`, color: COLORS.opportunity }]
    : []),
  // 溢れそうはライフを失う予告なので危険の文字色（danger は文字に使えない。theme.ts）
  ...(willOverflow ? [{ key: 'warn', text: OVERFLOW_WARNING_TEXT, color: COLORS.dangerText }] : []),
  ...(maxShortage > 0
    ? [{ key: 'mana', text: `マナが${maxShortage}足りません`, color: COLORS.secondary }]
    : []),
];

export const HandNoticeSlot: React.FC<Props> = (props) => (
  <Slot data-testid="hand-notice-slot">
    {noticesOf(props)
      .slice(0, HAND_NOTICE_MAX_LINES)
      .map((notice) => (
        <Line key={notice.key} $color={notice.color}>
          {notice.text}
        </Line>
      ))}
  </Slot>
);
