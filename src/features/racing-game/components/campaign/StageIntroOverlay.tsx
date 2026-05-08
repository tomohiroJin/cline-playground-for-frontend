// ステージタイトル + intro オーバーレイ（spec §7.1）
//
// 未クリアは 4.0s、既クリアは 1.5s 表示。任意キーでスキップ。
// 開始 0.5s 後にスキップヒント表示。

import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Overlay, TOKENS } from './campaign-styles';

const FRESH_DURATION_MS = 4000;
const REPLAY_DURATION_MS = 1500;
const SKIP_HINT_DELAY_MS = 500;

const scaleIn = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  text-align: center;
  color: ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontEnPixel};
  animation: ${css`${scaleIn} 0.4s ease-out`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Number = styled.div`
  font-size: 24px;
  letter-spacing: 4px;
  color: ${TOKENS.accentGold};
  margin-bottom: 12px;
`;

const TitleLine = styled.div`
  font-size: 36px;
  letter-spacing: 3px;
  margin-bottom: 24px;
`;

const IntroText = styled.div`
  font-family: ${TOKENS.fontJpNarrative};
  font-size: 16px;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  color: ${TOKENS.textPrimary};
`;

const SkipHint = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  font-size: 12px;
  color: ${TOKENS.textSecondary};
  font-family: ${TOKENS.fontEnPixel};
  letter-spacing: 1px;
`;

export interface StageIntroOverlayProps {
  readonly numberLabel: string;
  readonly title: string;
  readonly intro: string;
  /** 既クリアステージのリプレイなら短縮表示 */
  readonly isReplay: boolean;
  readonly onComplete: () => void;
}

export const StageIntroOverlay: React.FC<StageIntroOverlayProps> = ({
  numberLabel,
  title,
  intro,
  isReplay,
  onComplete,
}) => {
  const [showSkipHint, setShowSkipHint] = useState(false);
  const duration = isReplay ? REPLAY_DURATION_MS : FRESH_DURATION_MS;

  useEffect(() => {
    const hintId = window.setTimeout(() => setShowSkipHint(true), SKIP_HINT_DELAY_MS);
    const completeId = window.setTimeout(onComplete, duration);
    return () => {
      window.clearTimeout(hintId);
      window.clearTimeout(completeId);
    };
  }, [duration, onComplete]);

  // 任意キー / タップでスキップ
  useEffect(() => {
    const handler = () => onComplete();
    window.addEventListener('keydown', handler);
    window.addEventListener('pointerdown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('pointerdown', handler);
    };
  }, [onComplete]);

  return (
    <Overlay role="dialog" aria-label="ステージ intro">
      <Container>
        <Number>{numberLabel}</Number>
        <TitleLine>{title}</TitleLine>
        <IntroText>{intro}</IntroText>
      </Container>
      {showSkipHint && <SkipHint>▶ PRESS ANY KEY TO SKIP</SkipHint>}
    </Overlay>
  );
};
