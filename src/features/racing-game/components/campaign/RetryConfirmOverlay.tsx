// リトライ確認 オーバーレイ（spec §2.4）
//
// 残機 > 0 で時間切れになったときに表示。残機を1つ消費した状態で、
// 同じステージに再挑戦するか STAGE SELECT に戻るかを選ばせる。
// 残機 0 の場合は GameOverOverlay が出るため、この画面には到達しない。

import React from 'react';
import styled from 'styled-components';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';

const StageInfo = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 18px;
  color: ${TOKENS.textPrimary};
  margin: 12px 0 4px;
`;

const LivesInfo = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  color: ${TOKENS.accentDanger};
  margin: 0 0 24px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

export interface RetryConfirmOverlayProps {
  readonly stageNumber: number;
  readonly totalStages: number;
  readonly livesRemaining: number;
  readonly onRetry: () => void;
  readonly onBackToStageSelect: () => void;
}

export const RetryConfirmOverlay: React.FC<RetryConfirmOverlayProps> = ({
  stageNumber,
  totalStages,
  livesRemaining,
  onRetry,
  onBackToStageSelect,
}) => (
  <Overlay role="dialog" aria-label="リトライ確認">
    <Panel>
      <LargeTitle style={{ color: TOKENS.accentDanger }}>TIME UP</LargeTitle>
      <StageInfo>STAGE {stageNumber} / {totalStages}</StageInfo>
      <LivesInfo>LIVES {livesRemaining}</LivesInfo>
      <Row>
        <PrimaryButton onClick={onRetry} autoFocus>RETRY</PrimaryButton>
        <PrimaryButton onClick={onBackToStageSelect}>STAGE SELECT</PrimaryButton>
      </Row>
    </Panel>
  </Overlay>
);
