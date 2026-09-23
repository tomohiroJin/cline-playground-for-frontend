/**
 * 灰燼の城壁 - 遠征の帯（反復7 段階1・設計書 §3.2）
 *
 * 層・ステージ名・獲得枚数だけを出す。ライフは戦闘中に RunStatusBar が
 * 刻々と出しているので、ここで開始時の値を出すと2つのライフが並んで食い違う。
 * **次ステージの予告は段階3 で足す**（暫定ステージは全て同じマップで、まだ違いが無い）。
 */
import React from 'react';
import styled from 'styled-components';
import { currentStage, type ExpeditionState } from '../domain/expedition/expedition-state';
import { COLORS } from './theme';

const TIER_COUNT = 3;

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 12px;
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
  font-size: 14px;
`;

export const ExpeditionBar: React.FC<{ expedition: ExpeditionState }> = ({ expedition }) => {
  const stage = currentStage(expedition);
  return (
    <Bar role="status" aria-label="遠征の進み具合">
      <strong>
        層 {stage?.tier ?? TIER_COUNT} / {TIER_COUNT}
      </strong>
      <span>{stage?.name ?? ''}</span>
      <span>獲得 {expedition.acquired.length}枚</span>
    </Bar>
  );
};
