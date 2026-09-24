/**
 * 灰燼の城壁 - 遠征の帯（反復7 段階1・設計書 §3.2）
 *
 * 層・ステージ名・獲得枚数だけを出す。ライフは戦闘中に RunStatusBar が
 * 刻々と出しているので、ここで開始時の値を出すと2つのライフが並んで食い違う。
 * **次ステージの予告は段階3 で足す**（暫定ステージは全て同じマップで、まだ違いが無い）。
 *
 * 獲得（offer）画面では `expedition.stageIndex` は既に**次に進むステージ**を
 * 指している（獲得を選んだ時点で進むため）。そのため、この帯は獲得画面では
 * 次ステージの層・名前を表示する（意図した挙動: 選ぶ前に「どこへ向かうか」が
 * 見える）。敵の内訳の先出しはこの帯の役目ではなく、引き続きステージ3
 * （StageView・EnemyLegend 等）の仕事。
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
