// ステージクリア時の紙吹雪エフェクト（CSS keyframes ベース）
//
// CPU 負荷を抑えるため Canvas ではなく CSS animation で実装。
// reduced-motion 環境では非表示。

import React, { useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { TOKENS } from './campaign-styles';

const PIECE_COUNT = 32;

const fall = keyframes`
  0% {
    transform: translate3d(0, -120vh, 0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate3d(var(--tx, 0), 60vh, 0) rotate(720deg);
    opacity: 0;
  }
`;

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

interface PieceStyle {
  readonly left: string;
  readonly background: string;
  readonly width: string;
  readonly height: string;
  readonly tx: string;
  readonly delay: string;
  readonly duration: string;
}

const Piece = styled.div<{ $style: PieceStyle }>`
  position: absolute;
  top: 0;
  left: ${(p) => p.$style.left};
  width: ${(p) => p.$style.width};
  height: ${(p) => p.$style.height};
  background: ${(p) => p.$style.background};
  --tx: ${(p) => p.$style.tx};
  animation: ${(p) => css`${fall} ${p.$style.duration} ease-in ${p.$style.delay} forwards`};
`;

const COLORS = [TOKENS.accentGold, TOKENS.accentSilver, TOKENS.accentBronze, TOKENS.textPrimary];

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generatePieces = (seed: number): PieceStyle[] =>
  Array.from({ length: PIECE_COUNT }, (_, i) => {
    const r1 = seededRandom(seed + i);
    const r2 = seededRandom(seed + i + 100);
    const r3 = seededRandom(seed + i + 200);
    const r4 = seededRandom(seed + i + 300);
    return {
      left: `${Math.floor(r1 * 100)}%`,
      background: COLORS[Math.floor(r2 * COLORS.length)],
      width: `${6 + Math.floor(r3 * 8)}px`,
      height: `${10 + Math.floor(r4 * 10)}px`,
      tx: `${Math.floor((r2 - 0.5) * 200)}px`,
      delay: `${Math.floor(r3 * 600)}ms`,
      duration: `${1500 + Math.floor(r4 * 1000)}ms`,
    };
  });

export interface ConfettiBurstProps {
  /** マウント時に紙吹雪を出すためのキー（同じステージのリプレイで再生する用） */
  readonly burstKey: number;
}

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ burstKey }) => {
  const pieces = useMemo(() => generatePieces(burstKey), [burstKey]);
  return (
    <Wrapper aria-hidden="true" data-testid="confetti-burst">
      {pieces.map((style, i) => (
        <Piece key={i} $style={style} />
      ))}
    </Wrapper>
  );
};
