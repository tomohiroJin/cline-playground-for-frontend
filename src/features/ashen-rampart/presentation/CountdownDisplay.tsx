/**
 * 灰燼の城壁 - 開始カウントダウン
 *
 * 3 → 2 → 1 を各30tick。この間、敵は出現しないが配置はできる。
 * 「見ているだけの3秒」にしないための猶予である。
 */
import React from 'react';
import styled from 'styled-components';
import { countdownLeftAt } from '../domain/combat/combat-state';
import { COLORS } from './theme';

/** 1つの数字を表示する tick 数 */
const TICKS_PER_NUMBER = 30;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  color: ${COLORS.opportunity};
`;

const Number = styled.span`
  font-size: 64px;
  font-weight: 700;
`;

const Hint = styled.span`
  color: ${COLORS.secondary};
`;

interface Props {
  tick: number;
}

export const CountdownDisplay: React.FC<Props> = ({ tick }) => {
  const left = countdownLeftAt(tick);
  if (left <= 0) return null;
  const shown = Math.ceil(left / TICKS_PER_NUMBER);
  return (
    <Overlay aria-live="polite">
      <Number>{shown}</Number>
      <Hint>いまのうちに置けます</Hint>
    </Overlay>
  );
};
